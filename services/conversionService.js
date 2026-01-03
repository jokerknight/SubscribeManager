/**
 * 转换服务 - 统一管理订阅格式转换逻辑
 */
const { convertSubscription } = require('../utils/converters/subscriptionConverter');
const { buildSubconvertApiUrl, determineConversionStrategy } = require('../utils/converters/urlHandler');
const https = require('node:https');

class ConversionService {
  /**
   * 转换订阅内容到指定格式
   * @param {string} content 订阅内容（通用格式的节点链接）
   * @param {string} format 目标格式 ('clash', 'surge', 'shadowsocks')
   * @param {Object} options 转换选项
   * @param {string} options.customTemplate 自定义模板或模板 URL
   * @param {string} options.subconvertUrl Subconvert API URL
   * @param {string} options.subscriptionUrl 当前订阅的 URL
   * @param {boolean} options.useDefaultTemplate 是否使用默认模板（优先级最高）
   * @returns {Promise<string>} 转换后的内容
   */
  async convert(content, format, options = {}) {
    const {
      customTemplate = null,
      subconvertUrl = null,
      subscriptionUrl = null,
      realBaseUrl = null,  // 新增：真实的 baseUrl
      useDefaultTemplate = null
    } = options;

    console.log('[ConversionService] convert 开始');
    console.log('[ConversionService]   - content 长度:', content?.length || 0);
    console.log('[ConversionService]   - format:', format);
    console.log('[ConversionService]   - customTemplate:', customTemplate);
    console.log('[ConversionService]   - subconvertUrl:', subconvertUrl);
    console.log('[ConversionService]   - subscriptionUrl:', subscriptionUrl);
    console.log('[ConversionService]   - realBaseUrl:', realBaseUrl);
    console.log('[ConversionService]   - useDefaultTemplate:', useDefaultTemplate);

    // 空内容处理
    if (!content?.trim()) {
      return format === 'clash' ? await this._getEmptyClashConfig() : '';
    }

    // 如果配置了 Subconvert URL，使用 Subconvert API（优先级最高）
    if (subconvertUrl && subconvertUrl.trim()) {
      console.log('[ConversionService] 配置了 Subconvert URL，使用 Subconvert API');
      return await this._convertViaSubconvert(content, format, customTemplate, subconvertUrl, subscriptionUrl, realBaseUrl);
    }

    // 没有配置 Subconvert URL，根据 checkbox 决定模板类型
    const useDefault = useDefaultTemplate !== false; // null 或 true 都使用默认模板，false 使用仅节点
    console.log('[ConversionService] 没有配置 Subconvert URL');
    console.log('[ConversionService]   - useDefaultTemplate:', useDefaultTemplate, '->', useDefault ? '默认模板' : '仅节点');

    if (useDefault) {
      // 使用默认完整模板（含规则）
      return await this._convertLocally(content, format, null);
    } else {
      // 使用仅节点模板（不含规则）
      return await this._convertLocally(content, format, await this._getSimpleTemplateOnlyNodes());
    }
  }

  /**
   * 通过 Subconvert API 转换
   * @private
   */
  async _convertViaSubconvert(content, format, customTemplate, subconvertUrl, subscriptionUrl, realBaseUrl) {
    try {
      console.log('[ConversionService] 使用 Subconvert API 进行转换');
      console.log('[ConversionService] customTemplate:', customTemplate);
      console.log('[ConversionService] realBaseUrl:', realBaseUrl);

      // 构建一个仅包含节点的本地订阅 URL，作为 Subconvert 的输入
      // 使用专门的 /path/nodes 端点
      let nodesOnlyUrl = null;
      if (subscriptionUrl) {
        try {
          const urlObj = new URL(subscriptionUrl);
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          // 提取订阅路径，使用 realBaseUrl 构建 /path/nodes URL（专用端点，避免死循环）
          if (pathParts.length >= 1) {
            const subscriptionPath = pathParts[0];
            // 使用真实的 baseUrl（从请求中获取），而不是 localhost
            // 使用 /nodes 端点，这个端点只返回节点不含规则
            nodesOnlyUrl = `${realBaseUrl}/${subscriptionPath}/nodes`;
          }
        } catch (e) {
          console.error('[ConversionService] 解析 subscriptionUrl 失败:', e.message);
        }
      }

      const templateUrl = this._isTemplateUrl(customTemplate) ? customTemplate : null;
      console.log('[ConversionService] templateUrl (传给 Subconvert):', templateUrl);
      console.log('[ConversionService] nodesOnlyUrl (传给 Subconvert):', nodesOnlyUrl);

      console.log('[ConversionService] Subconvert 请求 URL (raw):', subconvertUrl);

      // 调用 Subconvert API，传入 nodesOnlyUrl 作为直接 URL
      const convertedContent = await this._callSubconvertApi(
        subconvertUrl,
        null, // subscriptionUrl 设为 null，使用 nodesOnlyUrl
        format,
        templateUrl,
        nodesOnlyUrl
      );

      return convertedContent;
    } catch (error) {
      console.error('[ConversionService] Subconvert 转换失败，降级到本地转换:', error.message);
      // 降级时，使用默认完整模板
      console.log('[ConversionService] 降级使用默认完整模板');
      return await this._convertLocally(content, format, null);
    }
  }

  /**
   * 直接调用 Subconvert API
   * @private
   */
  async _callSubconvertApi(subconvertUrl, subscriptionUrl, format, customTemplateUrl, directUrl = null) {
    return new Promise((resolve, reject) => {
      try {
        const fullUrl = buildSubconvertApiUrl(subconvertUrl, subscriptionUrl, format, customTemplateUrl, directUrl);
        console.log('[ConversionService] Subconvert API 请求 URL:', fullUrl);

        const req = https.get(fullUrl, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else {
              console.error('[ConversionService] Subconvert API 响应状态:', res.statusCode);
              console.error('[ConversionService] Subconvert API 响应内容:', data.substring(0, 500));
              reject(new Error(`Subconvert API returned status ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Subconvert API request timeout'));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 本地转换
   * @param {string} content 订阅内容
   * @param {string} format 目标格式
   * @param {string|null} templateUrl 模板 URL 或 null（使用默认模板）
   * @private
   */
  async _convertLocally(content, format, templateUrl = null) {
    if (templateUrl) {
      console.log(`[ConversionService] 使用本地转换器（自定义模板 URL）`);
      console.log(`[ConversionService] 模板 URL: ${templateUrl}`);
    } else {
      console.log(`[ConversionService] 使用本地转换器（默认完整模板）`);
    }

    return await convertSubscription(content, format, templateUrl, null, null);
  }

  /**
   * 获取仅包含节点的简单模板
   * @private
   */
  async _getSimpleTemplateOnlyNodes() {
    // 使用一个空的模板，只返回节点，不包含规则
    return `# Clash 配置文件 - 仅节点（无规则）
# 生成时间: ${new Date().toISOString()}

proxies:
{{proxies}}

proxy-groups:
  - name: 节点选择
    type: select
    proxies: [{{proxy_names_comma}}]
`;
  }

  /**
   * 检查是否为模板 URL
   * @private
   */
  _isTemplateUrl(template) {
    return template && (template.startsWith('http://') || template.startsWith('https://'));
  }

  /**
   * 获取仅节点的订阅内容
   * @param {string} content 订阅内容
   * @param {string} format 目标格式
   * @returns {Promise<string>} 仅节点的配置内容
   */
  async getNodesOnly(content, format) {
    console.log('[ConversionService] 获取仅节点内容，format:', format);
    if (format !== 'clash') {
      // 非 Clash 格式，直接返回原始内容
      return content;
    }

    // Clash 格式，返回仅节点配置
    return await this._convertLocally(content, format, await this._getSimpleTemplateOnlyNodes());
  }

  /**
   * 获取空的 Clash 配置
   * @private
   */
  async _getEmptyClashConfig() {
    const clashGenerator = require('../utils/converters/clashGenerator');
    return clashGenerator.generateEmptyConfig();
  }
}

module.exports = {
  ConversionService
};
