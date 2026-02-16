/**
 * 导入服务 - 处理订阅节点导入逻辑
 */
const { parseSubscriptionNodes } = require('../utils/converters/subscriptionParser');
const { extractNodeName, getNodeType } = require('../utils/validators/nodeParser');
const { NodeRepository } = require('../utils/database/operations');
const subscriptionService = require('./subscriptionService');
const https = require('node:https');
const http = require('node:http');

/**
 * 从外部 URL 获取订阅内容
 * @param {string} url 订阅 URL
 * @returns {Promise<string>} 订阅内容
 */
async function fetchSubscriptionContent(url) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 15000,
        rejectUnauthorized: false, // 允许自签名证书
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const req = protocol.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 验证导入 URL
 * @param {string} url 要验证的 URL
 * @throws {Error} URL 格式无效时抛出错误
 */
function validateImportUrl(url) {
  if (!url?.trim()) {
    throw new Error('import.url_required');
  }

  new URL(url);
}

/**
 * 验证订阅内容
 * @param {string} content 订阅内容
 * @throws {Error} 内容无效时抛出错误
 */
function validateSubscriptionContent(content) {
  if (!content) {
    throw new Error('import.empty_content');
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    throw new Error('import.empty_content');
  }

  return trimmedContent;
}

/**
 * 获取现有节点名称集合（用于去重）
 * @param {string} subscriptionPath 订阅路径
 * @returns {Promise<Set<string>>} 现有节点名称集合
 */
async function getExistingNodeNames(subscriptionPath) {
  const existingNodes = await NodeRepository.findBySubscriptionPath(subscriptionPath);
  const existingNodeNames = new Set();

  for (const node of existingNodes) {
    if (node.name) {
      existingNodeNames.add(node.name.trim());
    }
  }

  return existingNodeNames;
}

/**
 * 导入节点到订阅
 * @param {string} subscriptionPath 订阅路径
 * @param {string} importUrl 导入 URL
 * @returns {Promise<Object>} 导入结果统计
 */
async function importNodes(subscriptionPath, importUrl) {
  // 验证 URL
  validateImportUrl(importUrl);

  // 获取订阅内容
  const content = await fetchSubscriptionContent(importUrl);
  const trimmedContent = validateSubscriptionContent(content);

  // 解析节点
  const nodeLinks = await parseSubscriptionNodes(trimmedContent);

  if (nodeLinks.length === 0) {
    throw new Error('import.no_valid_nodes');
  }

  // 获取现有节点名称
  const existingNodeNames = await getExistingNodeNames(subscriptionPath);

  // 获取订阅 ID
  const subscription = await subscriptionService.getSubscription(subscriptionPath);
  const subscriptionId = subscription.id;

  // 导入节点
  const result = {
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0
  };

  for (const nodeLink of nodeLinks) {
    try {
      const nodeName = extractNodeName(nodeLink);
      const trimmedName = nodeName.trim();

      // 检查是否重复
      if (existingNodeNames.has(trimmedName)) {
        result.skippedCount++;
        continue;
      }

      // 创建节点
      const nodeType = getNodeType(nodeLink);
      await NodeRepository.create({
        subscriptionId,
        name: nodeName,
        originalLink: nodeLink,
        nodeOrder: 0,
        type: nodeType
      });

      result.importedCount++;
      existingNodeNames.add(trimmedName);
    } catch {
      // 忽略单个节点的错误，继续处理下一个节点
      result.failedCount++;
    }
  }

  // 返回结果
  const totalAfterImport = await NodeRepository.countBySubscriptionPath(subscriptionPath);

  return {
    importedCount: result.importedCount,
    skippedCount: result.skippedCount,
    failedCount: result.failedCount,
    totalAfterImport
  };
}

module.exports = {
  importNodes
};
