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
   * @returns {Promise<string>} 转换后的内容
   */
  async convert(content, format, options = {}) {
    const {
      customTemplate = null,
      subconvertUrl = null,
      subscriptionUrl = null
    } = options;

    // 空内容处理
    if (!content?.trim()) {
      return format === 'clash' ? await this._getEmptyClashConfig() : '';
    }

    // 决定转换策略
    const hasCustomTemplate = customTemplate?.trim();
    const strategy = determineConversionStrategy(subscriptionUrl, subconvertUrl, format, hasCustomTemplate);
    console.log(`[ConversionService] 转换策略: ${strategy.reason}`);

    // 使用 Subconvert API
    if (strategy.useSubconvert) {
      return await this._convertViaSubconvert(content, format, customTemplate, subconvertUrl, subscriptionUrl);
    }

    // 使用本地转换
    return await this._convertLocally(content, format);
  }

  /**
   * 通过 Subconvert API 转换
   * @private
   */
  async _convertViaSubconvert(content, format, customTemplate, subconvertUrl, subscriptionUrl) {
    try {
      console.log('[ConversionService] 使用 Subconvert API 进行转换');

      const templateUrl = this._isTemplateUrl(customTemplate) ? customTemplate : null;

      console.log('[ConversionService] Subconvert 请求 URL (raw):', subconvertUrl);
      console.log('[ConversionService] Subconvert 请求 subscriptionUrl:', subscriptionUrl);

      const convertedContent = await this._callSubconvertApi(
        subconvertUrl,
        subscriptionUrl,
        format,
        templateUrl
      );

      return convertedContent;
    } catch (error) {
      console.error('[ConversionService] Subconvert 转换失败，降级到本地转换:', error.message);
      return await this._convertLocally(content, format);
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
   * @private
   */
  async _convertLocally(content, format) {
    console.log('[ConversionService] 使用本地转换器（默认模板）');

    // 本地转换只使用默认模板
    return await convertSubscription(content, format, null, null, null);
  }

  /**
   * 检查是否为模板 URL
   * @private
   */
  _isTemplateUrl(template) {
    return template && (template.startsWith('http://') || template.startsWith('https://'));
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
