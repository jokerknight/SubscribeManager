const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const nodeService = require('../services/nodeService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const https = require('https');
const http = require('http');
const { extractNodeName, getNodeType } = require('../utils/validators/nodeParser');
const { parseSubscriptionNodes } = require('../utils/converters/subscriptionParser');
const { NodeRepository } = require('../utils/database/operations');

// 获取订阅列表
router.get('/subscriptions', asyncHandler(async (req, res) => {
  const subscriptions = await subscriptionService.getSubscriptions();
  res.json({ success: true, data: subscriptions });
}));

// 创建订阅
router.post('/subscriptions', asyncHandler(async (req, res) => {
  const { name, path } = req.body;
  await subscriptionService.createSubscription(name, path);
  res.json({ success: true, message: 'subscription.created' });
}));

// 获取单个订阅
router.get('/subscriptions/:path', asyncHandler(async (req, res) => {
  const { path } = req.params;
  const subscription = await subscriptionService.getSubscription(path);
  if (!subscription) {
    throw new ApiError(404, 'subscription.not_found');
  }
  res.json({ success: true, data: subscription });
}));

// 更新订阅信息
router.put('/subscriptions/:path', asyncHandler(async (req, res) => {
  const { path: oldPath } = req.params;
  const { name, path: newPath, subconvert_url, custom_template, use_default_template } = req.body;
  await subscriptionService.updateSubscription(oldPath, name, newPath, subconvert_url, custom_template, use_default_template);
  res.json({ success: true, message: 'subscription.updated' });
}));

// 删除订阅
router.delete('/subscriptions/:path', asyncHandler(async (req, res) => {
  const { path } = req.params;
  await subscriptionService.deleteSubscription(path);
  res.json({ success: true, message: 'subscription.deleted' });
}));

// 获取节点列表
router.get('/subscriptions/:path/nodes', asyncHandler(async (req, res) => {
  const { path: subscriptionPath } = req.params;
  const nodes = await nodeService.getNodes(subscriptionPath);
  res.json({ success: true, data: nodes });
}));

// 创建节点
router.post('/subscriptions/:path/nodes', asyncHandler(async (req, res) => {
  const { path: subscriptionPath } = req.params;
  const { name, content, order } = req.body;
  await nodeService.createNode(subscriptionPath, name, content, order);
  res.json({ success: true, message: 'nodes.added' });
}));

// 更新节点
router.put('/subscriptions/:path/nodes/:id', asyncHandler(async (req, res) => {
  const { path: subscriptionPath, id: nodeId } = req.params;
  const { content } = req.body;
  await nodeService.updateNode(subscriptionPath, nodeId, content);
  res.json({ success: true, message: 'nodes.edited' });
}));

// 删除节点
router.delete('/subscriptions/:path/nodes/:id', asyncHandler(async (req, res) => {
  const { path: subscriptionPath, id: nodeId } = req.params;
  await nodeService.deleteNode(subscriptionPath, nodeId);
  res.json({ success: true, message: 'nodes.deleted' });
}));

// 切换节点状态
router.patch('/subscriptions/:path/nodes/:id', asyncHandler(async (req, res) => {
  const { path: subscriptionPath, id: nodeId } = req.params;
  const { enabled } = req.body;
  await nodeService.toggleNode(subscriptionPath, nodeId, enabled);
  res.json({ success: true, message: `nodes.${enabled ? 'enabled' : 'disabled'}` });
}));

// 节点重新排序
router.post('/subscriptions/:path/nodes/reorder', asyncHandler(async (req, res) => {
  const { path: subscriptionPath } = req.params;
  const { orders } = req.body;
  await nodeService.reorderNodes(subscriptionPath, orders);
  res.json({ success: true, message: 'nodes.sort_updated' });
}));

// 从外部 URL 导入订阅节点
router.post('/subscriptions/:path/import-nodes', asyncHandler(async (req, res) => {
  const { path: subscriptionPath } = req.params;
  const { importUrl } = req.body;

  console.log(`[导入] 收到请求 - 订阅路径: ${subscriptionPath}, 导入URL: ${importUrl}`);

  if (!importUrl || !importUrl.trim()) {
    throw new ApiError(400, 'import.url_required');
  }

  try {
    new URL(importUrl);
  } catch (e) {
    console.error('[导入] URL 解析失败:', importUrl, e.message);
    throw new ApiError(400, 'import.invalid_url');
  }

  try {
    // 获取订阅内容
    const content = await fetchSubscriptionContent(importUrl);

    if (!content) {
      console.error('[导入] 获取到 null 或 undefined 内容');
      throw new ApiError(400, 'import.empty_content');
    }

    console.log(`[导入] 获取到内容长度: ${content.length} 字节`);
    console.log(`[导入] 内容预览: ${content.length > 0 ? content.substring(0, 200) : '(空)'}`);

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      console.error('[导入] 订阅内容为空（只有空白字符）');
      throw new ApiError(400, 'import.empty_content');
    }

    // 使用订阅解析器自动检测格式并解析节点
    const nodeLinks = await parseSubscriptionNodes(content);

    console.log(`[导入] 解析到 ${nodeLinks.length} 个节点`);
    const ssNodes = nodeLinks.filter(n => n.startsWith('ss://'));
    console.log(`[导入] 其中 ${ssNodes.length} 个 SS 节点`);

    if (nodeLinks.length === 0) {
      throw new ApiError(400, 'import.no_valid_nodes');
    }

    // 获取现有节点以检查重复
    const existingNodes = await NodeRepository.findBySubscriptionPath(subscriptionPath);

    // 获取现有节点名称用于去重
    const existingNodeNames = new Set();
    for (const node of existingNodes) {
      if (node.name) {
        const trimmedName = node.name.trim();
        existingNodeNames.add(trimmedName);
        console.log(`[导入] 现有节点名称: "${trimmedName}" (原始: "${node.name}")`);
      }
    }

    console.log(`[导入] 订阅中现有 ${existingNodes.length} 个节点，现有节点名称:`, Array.from(existingNodeNames).map(n => `"${n}"`).join(', '));

    // 保存节点到数据库
    let importedCount = 0;
    let skippedCount = 0;  // 跳过的重复节点
    let failedCount = 0;

    // 获取订阅ID
    const subscription = await subscriptionService.getSubscription(subscriptionPath);
    const subscriptionId = subscription.id;

    for (let i = 0; i < nodeLinks.length; i++) {
      const nodeLink = nodeLinks[i];

      try {
        // 提取节点名称
        const nodeName = extractNodeName(nodeLink);
        const trimmedName = nodeName.trim();

        console.log(`[导入] 检查节点 "${trimmedName}" 是否在现有名称中:`, existingNodeNames.has(trimmedName));

        // 检查是否重复（通过节点名称）
        if (existingNodeNames.has(trimmedName)) {
          skippedCount++;
          console.log(`[导入] 节点 ${i + 1} 已存在（名称: ${trimmedName}），跳过`);
          continue;
        }

        // 直接插入数据库
        const nodeType = getNodeType(nodeLink);

        await NodeRepository.create({
          subscriptionId,
          name: nodeName,
          originalLink: nodeLink,
          nodeOrder: 0,
          type: nodeType
        });
        importedCount++;
        existingNodeNames.add(nodeName.trim());
        console.log(`[导入] 节点 ${i + 1} 导入成功: ${nodeName}`);
      } catch (error) {
        failedCount++;
        console.error(`[导入] 节点 ${i + 1} 处理失败:`, error.message);
      }
    }

    console.log(`[导入] 完成 - 解析: ${nodeLinks.length}, 导入: ${importedCount}, 跳过: ${skippedCount}, 失败: ${failedCount}`);

    res.json({
      success: true,
      message: 'import.nodes_imported',
      data: {
        importedCount: importedCount,
        updatedCount: skippedCount,
        failedCount: failedCount,
        totalAfterImport: existingNodes.length + importedCount
      }
    });
  } catch (error) {
    console.error('[导入错误]', error);
    throw new ApiError(500, 'import.failed', error.message);
  }
}));

// 获取订阅内容
function fetchSubscriptionContent(urlString) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlString);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    console.log(`[fetchSubscriptionContent] 请求 URL: ${urlString}`);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 30000
    };

    const req = protocol.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        console.log(`[fetchSubscriptionContent] 响应状态: ${res.statusCode}, 内容类型: ${res.headers['content-type']}, 编码: ${res.headers['content-encoding'] || 'none'}`);

        if (res.statusCode === 200) {
          const data = Buffer.concat(chunks).toString('utf-8');
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[fetchSubscriptionContent] 请求错误:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(options.timeout);
    req.end();
  });
}

// Clash 配置生成 - 使用 Subconvert API 和自定义模板
const { generateClashConfig, validateAndLoadTemplate } = require('../utils/converters/clashConfigGenerator');

router.post('/clash/generate', asyncHandler(async (req, res) => {
  const { subconvertUrl, templateUrl } = req.body;

  // 构建当前订阅 URL（如果有订阅路径）
  let subscriptionUrl = null;
  if (req.body.subscriptionPath) {
    const protocol = process.env.PROTOCOL || 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    subscriptionUrl = `${protocol}://${host}:${port}/subscribe/${req.body.subscriptionPath}`;
  }

  try {
    const config = await generateClashConfig(subconvertUrl, templateUrl, subscriptionUrl);
    res.json({
      success: true,
      data: {
        config: config,
        length: config.length
      }
    });
  } catch (error) {
    throw new ApiError(500, 'clash.generate_failed', error.message);
  }
}));

// 从 URL 加载模板
router.post('/clash/load-template', asyncHandler(async (req, res) => {
  const { templateUrl } = req.body;

  if (!templateUrl || !templateUrl.trim()) {
    throw new ApiError(400, 'template.url_required');
  }

  const template = await validateAndLoadTemplate(templateUrl);
  res.json({
    success: true,
    data: template
  });
}));

// 更新订阅的 Subconverter 配置
router.put('/subscriptions/:path/subconverter', asyncHandler(async (req, res) => {
  const { path } = req.params;
  const { subconvert_url, custom_template, use_default_template } = req.body;

  const subscription = await subscriptionService.getSubscription(path);
  if (!subscription) {
    throw new ApiError(404, 'subscription.not_found');
  }

  await subscriptionService.updateSubscription(path, subscription.name, path, subconvert_url, custom_template, use_default_template);
  res.json({ success: true, message: 'subconverter.updated' });
}));

module.exports = router;