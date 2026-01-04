const { NODE_TYPES } = require('../constants');
const { extractNodeName } = require('../validators/nodeParser');
const clashGenerator = require('./clashGenerator');
const { getProtocolFactory } = require('../../protocols/ProtocolFactory');
const { loadTemplateFromUrl } = require('./clashConfigGenerator');
const { buildSubconvertApiUrl, determineConversionStrategy } = require('./urlHandler');
const https = require('https');

/**
 * 通过 Subconvert API 生成配置
 * @param {string} subconvertUrl Subconvert API URL
 * @param {string} subscriptionUrl 当前订阅的 URL（可选，如果 subconvertUrl 已包含 url 参数则为 null）
 * @param {string} targetFormat 目标格式
 * @param {string} customTemplateUrl 自定义模板 URL（可选）
 * @returns {Promise<string>} 转换后的内容
 */
async function convertViaSubconvert(subconvertUrl, subscriptionUrl, targetFormat, customTemplateUrl = null) {
  return new Promise((resolve, reject) => {
    try {
      // Subconvert API 不支持 surge 和 shadowsocks 格式
      if (targetFormat === 'surge' || targetFormat === 'shadowsocks') {
        throw new Error(`Subconvert API does not support ${targetFormat} format`);
      }

      // 构建完整的 Subconvert API URL
      const fullUrl = buildSubconvertApiUrl(subconvertUrl, subscriptionUrl, targetFormat, customTemplateUrl);

      const req = https.get(fullUrl, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            console.error('Subconvert API 响应状态:', res.statusCode);
            console.error('Subconvert API 响应内容:', data.substring(0, 500));
            reject(new Error(`Subconvert API returned status ${res.statusCode}: ${data.substring(0, 200)}`));
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
 * 统一转换函数 - 直接使用协议工厂进行简单转换
 * @param {string} content 订阅内容
 * @param {string} targetFormat 目标格式 ('clash', 'surge', 'shadowsocks', 'universal' 等)
 * @param {string} customTemplate 自定义模板 URL 或内容
 * @param {string} subconvertUrl Subconvert URL 地址（可选，已废弃）
 * @param {string} subscriptionUrl 当前订阅的 URL（可选，已废弃）
 * @returns {Promise<string>} 转换后的内容
 */
async function convertSubscription(content, targetFormat, customTemplate = null, subconvertUrl = null, subscriptionUrl = null) {
  if (!content?.trim()) {
    return targetFormat === 'clash' ? clashGenerator.generateEmptyConfig(customTemplate) : '';
  }

  let templateContent = null;
  // 判断 customTemplate 是 URL 还是已加载的内容
  const isTemplateUrl = customTemplate && (customTemplate.startsWith('http://') || customTemplate.startsWith('https://'));

  if (customTemplate && customTemplate.trim()) {
    // 如果是 URL，加载模板内容
    if (isTemplateUrl) {
      try {
        templateContent = await loadTemplateFromUrl(customTemplate);
      } catch (error) {
        console.error('[local] 模板加载失败，使用默认模板:', error.message);
        templateContent = null;
      }
    } else {
      // 已经是模板内容
      templateContent = customTemplate;
    }
  }

  // 如果配置了 Subconvert URL，优先尝试使用 Subconvert 进行转换
  if (subconvertUrl && subconvertUrl.trim()) {
    try {
      const strategy = determineConversionStrategy(subscriptionUrl, subconvertUrl, targetFormat);

      if (strategy.useSubconvert) {
        // 如果有自定义模板 URL，传递给 convertViaSubconvert
        const templateUrl = isTemplateUrl ? customTemplate : null;
        const convertedContent = await convertViaSubconvert(subconvertUrl, subscriptionUrl, targetFormat, templateUrl);
        return convertedContent;
      }
    } catch (error) {
      console.error('Subconvert 转换失败，降级到本地转换:', error.message);
      // 继续使用本地转换
    }
  }

  // 本地转换
  try {
    const protocolFactory = getProtocolFactory();
    const lines = content.split(/\r?\n/);
    const processedNodes = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      try {
        // 使用协议工厂直接解析节点
        const node = protocolFactory.parseNode(trimmedLine);

        if (node) {
          // 根据目标格式转换节点
          const convertedNode = protocolFactory.convertNodeFormat(node, targetFormat);

          if (convertedNode) {
            processedNodes.push(convertedNode);
          }
        }
      } catch (error) {
        // 静默忽略解析失败的节点
      }
    }

    return formatOutput(processedNodes, targetFormat, templateContent);

  } catch (error) {
    console.error(`Error processing subscription for ${targetFormat}:`, error.message);
    return '';
  }
}

/**
 * 格式化输出结果
 * @param {Array} processedNodes 处理后的节点列表
 * @param {string} format 输出格式
 * @param {string} customTemplate 自定义模板内容（可选）
 * @returns {string} 格式化后的输出
 */
function formatOutput(processedNodes, format, customTemplate = null) {
  if (!processedNodes || processedNodes.length === 0) {
    return format === 'clash' ? clashGenerator.generateEmptyConfig(customTemplate) : '';
  }

  switch (format) {
    case 'clash':
      // 如果有自定义模板，使用模板；否则使用完整默认配置（包含 rule-provider）
      if (customTemplate && customTemplate.trim()) {
        return clashGenerator.generateConfig(processedNodes, customTemplate);
      } else {
        return clashGenerator.generateDefaultConfig(processedNodes);
      }
    case 'surge':
    case 'shadowsocks':
    default:
      return processedNodes.join('\n');
  }
}

module.exports = {
  convertSubscription,
  convertViaSubconvert,
};