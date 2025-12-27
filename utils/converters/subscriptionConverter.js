const { NODE_TYPES } = require('../constants');
const { extractNodeName } = require('../validators/nodeParser');
const clashGenerator = require('./clashGenerator');
const { getProtocolFactory } = require('../../protocols/ProtocolFactory');

/**
 * 统一转换函数 - 直接使用协议工厂进行简单转换
 * @param {string} content 订阅内容
 * @param {string} targetFormat 目标格式 ('clash', 'surge', 'shadowsocks', 'universal' 等)
 * @returns {string} 转换后的内容
 */
function convertSubscription(content, targetFormat) {
  if (!content?.trim()) {
    return targetFormat === 'clash' ? clashGenerator.generateEmptyConfig() : '';
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
    return formatOutput(processedNodes, targetFormat);
    
  } catch (error) {
    console.error(`Error processing subscription for ${targetFormat}:`, error.message);
    return '';
  }
}

/**
 * 格式化输出结果
 * @param {Array} processedNodes 处理后的节点列表
 * @param {string} format 输出格式
 * @returns {string} 格式化后的输出
 */
function formatOutput(processedNodes, format) {
  if (!processedNodes || processedNodes.length === 0) {
    return format === 'clash' ? clashGenerator.generateEmptyConfig() : '';
  }

  switch (format) {
    case 'clash':
      return clashGenerator.generateConfig(processedNodes);
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
  formatSnellConfig
};