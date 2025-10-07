const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const nodeService = require('../services/nodeService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

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
  const { name, path: newPath } = req.body;
  await subscriptionService.updateSubscription(oldPath, name, newPath);
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

module.exports = router;