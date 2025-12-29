const { NODE_TYPES } = require('../constants');
const { extractNodeName } = require('../validators/nodeParser');
const clashGenerator = require('./clashGenerator');
const { getProtocolFactory } = require('../../protocols/ProtocolFactory');
const https = require('https');
const querystring = require('querystring');

/**
 * 通过 Subconvert API 生成配置
 * @param {string} subconvertApiUrl Subconvert API 地址
 * @param {string} subscriptionUrl 当前订阅的 URL
 * @param {string} targetFormat 目标格式
 * @returns {Promise<string>} 转换后的内容
 */
async function convertViaSubconvert(subconvertApiUrl, subscriptionUrl, targetFormat) {
  return new Promise((resolve, reject) => {
    try {
      // 解析 Subconvert API URL 和参数
      const urlObj = new URL(subconvertApiUrl);
      const params = new URLSearchParams(urlObj.search);

      // 提取 base URL（去掉查询参数）
      const baseUrl = urlObj.origin + urlObj.pathname;

      // 检查是否配置了外部的 url 参数
      // 如果用户在 subconvert_api 配置中包含了 url 参数，说明要转换外部订阅
      const externalUrl = params.get('url');

      // 构建请求参数
      const requestParams = {
        target: params.get('target') || targetFormat,
        url: externalUrl || subscriptionUrl, // 如果有外部URL则使用外部URL，否则使用当前订阅URL
        config: params.get('config') || '',
        insert: params.get('insert') || 'false',
        emoji: params.get('emoji') || 'true',
        list: params.get('list') || 'false',
        udp: params.get('udp') || 'false',
        tfo: params.get('tfo') || 'false',
        scv: params.get('scv') || 'false',
        fdn: params.get('fdn') || 'false',
        sort: params.get('sort') || 'false',
        new_name: params.get('new_name') || 'false',
        append_type: params.get('append_type') || 'false',
        expand: params.get('expand') || 'true',
        'xudp': params.get('xudp') || 'false',
      };

      // Subconvert API 不支持 surge 和 shadowsocks 格式，如果请求这些格式则不使用 Subconvert
      if (targetFormat === 'surge' || targetFormat === 'shadowsocks') {
        throw new Error(`Subconvert API does not support ${targetFormat} format`);
      }

      // 构建完整请求 URL
      const fullUrl = `${baseUrl}?${querystring.stringify(requestParams)}`;

      console.log('Subconvert 请求 URL:', fullUrl);

      const req = https.get(fullUrl, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            // 输出响应内容以便调试
            console.error('Subconvert API 响应状态:', res.statusCode);
            console.error('Subconvert API 响应内容:', data);
            reject(new Error(`Subconvert API returned status ${res.statusCode}: ${data}`));
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
 * @param {string} customTemplate 自定义模板内容（可选）
 * @param {string} subconvertApiUrl Subconvert API 地址（可选）
 * @param {string} subscriptionUrl 当前订阅的 URL（可选）
 * @returns {Promise<string>} 转换后的内容
 */
async function convertSubscription(content, targetFormat, customTemplate = null, subconvertApiUrl = null, subscriptionUrl = null) {
  if (!content?.trim()) {
    return targetFormat === 'clash' ? clashGenerator.generateEmptyConfig(customTemplate) : '';
  }

  // 如果配置了 Subconvert API，优先使用 Subconvert 进行转换
  if (subconvertApiUrl && subconvertApiUrl.trim()) {
    try {
      console.log('使用 Subconvert API 进行转换...');
      // 使用订阅 URL 调用 Subconvert（会自动使用本地订阅 URL 或外部 URL）
      const convertedContent = await convertViaSubconvert(subconvertApiUrl, subscriptionUrl, targetFormat);
      return convertedContent;
    } catch (error) {
      console.error('Subconvert 转换失败，降级到本地转换:', error.message);
      // 继续使用本地转换
    }
  }

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
            if (targetFormat === 'clash') {
              processedNodes.push(convertedNode);
            } else {
              processedNodes.push(convertedNode);
            }
          }
        }
      } catch (error) {
        // 静默忽略解析失败的节点
      }
    }

    // 格式化输出
    return formatOutput(processedNodes, targetFormat, customTemplate);

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
      return clashGenerator.generateConfig(processedNodes, customTemplate);
    case 'surge':
    case 'shadowsocks':
    default:
      return processedNodes.join('\n');
  }
}

/**
 * 格式化Snell配置（用于Surge）
 * @param {string} snellLine Snell配置行
 * @returns {string} 格式化后的Snell配置
 */
function formatSnellConfig(snellLine) {
  // 基本的Snell配置格式化逻辑
  return snellLine;
}

module.exports = {
  convertSubscription,
  formatSnellConfig,
  convertViaSubconvert
};