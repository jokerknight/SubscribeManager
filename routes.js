const express = require('express');
const router = express.Router();
const path = require('path');
const authService = require('./services/authService');
const sessionService = require('./services/sessionService');
const subscriptionService = require('./services/subscriptionService');
const nodeService = require('./services/nodeService');
const subscriptionGeneratorService = require('./services/subscriptionGeneratorService');
// 环境变量
const ADMIN_PATH = process.env.ADMIN_PATH || 'admin';

// 登录页面
router.get(`/${ADMIN_PATH}/login`, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 登录处理
router.post(`/${ADMIN_PATH}/login`, async (req, res) => {
  try {
    const { username, password } = req.body;
    const sessionInfo = await authService.login(username, password);
    
    if (sessionInfo) {
      // 设置会话cookie
      req.session.sessionId = sessionInfo.sessionId;
      res.json({ success: true, redirect: `/${ADMIN_PATH}` });
    } else {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: '登录失败'+error.message });
  }
});

// 登出
router.get(`/${ADMIN_PATH}/logout`, async (req, res) => {
  if (req.session.sessionId) {
    await authService.logout(req.session.sessionId);
    req.session.destroy();
  }
  res.redirect(`/${ADMIN_PATH}/login`);
});

// 管理面板
router.get(`/${ADMIN_PATH}`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.redirect(`/${ADMIN_PATH}/login`);
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 获取订阅列表
router.get(`/${ADMIN_PATH}/api/subscriptions`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  try {
    const subscriptions = await subscriptionService.getSubscriptions();
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error('获取订阅列表失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 创建订阅
router.post(`/${ADMIN_PATH}/api/subscriptions`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { name, path } = req.body;
  
  try {
    await subscriptionService.createSubscription(name, path);
    res.json({ success: true, message: '订阅创建成功' });
  } catch (error) {
    console.error('创建订阅失败:', error);
    const status = error.message === 'Invalid parameters' ? 400 : 
                  error.message === 'Path already exists' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 获取单个订阅
router.get(`/${ADMIN_PATH}/api/subscriptions/:path`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path } = req.params;
  
  try {
    const subscription = await subscriptionService.getSubscription(path);
    if (!subscription) {
      return res.status(404).json({ success: false, message: '订阅不存在' });
    }
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('获取订阅失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 更新订阅信息
router.put(`/${ADMIN_PATH}/api/subscriptions/:path`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: oldPath } = req.params;
  const { name, path: newPath } = req.body;
  
  try {
    await subscriptionService.updateSubscription(oldPath, name, newPath);
    res.json({ success: true, message: '订阅信息已更新' });
  } catch (error) {
    console.error('更新订阅失败:', error);
    const status = error.message === 'Invalid parameters' ? 400 : 
                  error.message === 'Path already exists' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 删除订阅
router.delete(`/${ADMIN_PATH}/api/subscriptions/:path`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path } = req.params;
  
  try {
    await subscriptionService.deleteSubscription(path);
    res.json({ success: true, message: '订阅已删除' });
  } catch (error) {
    console.error('删除订阅失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 获取节点列表
router.get(`/${ADMIN_PATH}/api/subscriptions/:path/nodes`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: subscriptionPath } = req.params;
  
  try {
    const nodes = await nodeService.getNodes(subscriptionPath);
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('获取节点列表失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 创建节点
router.post(`/${ADMIN_PATH}/api/subscriptions/:path/nodes`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: subscriptionPath } = req.params;
  const { name, content, order } = req.body;
  
  try {
    await nodeService.createNode(subscriptionPath, name, content, order);
    res.json({ success: true, message: '节点创建成功' });
  } catch (error) {
    console.error('创建节点失败:', error);
    const status = error.message === 'Missing node content' ? 400 : 
                  error.message === 'Subscription not found' ? 404 :
                  error.message === 'Unsupported node format' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 更新节点
router.put(`/${ADMIN_PATH}/api/subscriptions/:path/nodes/:id`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: subscriptionPath, id: nodeId } = req.params;
  const { content } = req.body;
  
  try {
    await nodeService.updateNode(subscriptionPath, nodeId, content);
    res.json({ success: true, message: '节点更新成功' });
  } catch (error) {
    console.error('更新节点失败:', error);
    const status = error.message === 'Missing node content' ? 400 : 
                  error.message === 'Subscription not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 删除节点
router.delete(`/${ADMIN_PATH}/api/subscriptions/:path/nodes/:id`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: subscriptionPath, id: nodeId } = req.params;
  
  try {
    await nodeService.deleteNode(subscriptionPath, nodeId);
    res.json({ success: true, message: '节点已删除' });
  } catch (error) {
    console.error('删除节点失败:', error);
    const status = error.message === 'Subscription not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 切换节点状态
router.patch(`/${ADMIN_PATH}/api/subscriptions/:path/nodes/:id`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: subscriptionPath, id: nodeId } = req.params;
  const { enabled } = req.body;
  
  try {
    await nodeService.toggleNode(subscriptionPath, nodeId, enabled);
    res.json({ success: true, message: `节点已${enabled ? '启用' : '禁用'}` });
  } catch (error) {
    console.error('切换节点状态失败:', error);
    const status = error.message === 'Invalid enabled value' ? 400 : 
                  error.message === 'Subscription not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 节点重新排序
router.post(`/${ADMIN_PATH}/api/subscriptions/:path/nodes/reorder`, async (req, res) => {
  if (!await verifySession(req)) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const { path: subscriptionPath } = req.params;
  const { orders } = req.body;
  
  try {
    await nodeService.reorderNodes(subscriptionPath, orders);
    res.json({ success: true, message: '节点顺序已更新' });
  } catch (error) {
    console.error('更新节点顺序失败:', error);
    const status = error.message === 'Invalid orders' ? 400 : 
                  error.message === 'Subscription not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// 订阅请求处理
router.get('/:path', handleSubscriptionRequest);
router.get('/:path/surge', handleSubscriptionRequest);
router.get('/:path/v2ray', handleSubscriptionRequest);
router.get('/:path/clash', handleSubscriptionRequest);

async function handleSubscriptionRequest(req, res) {
  const reqPath = req.path;
  const basePath = req.params.path;
  const format = reqPath.endsWith('/surge') ? 'surge' : 
                 reqPath.endsWith('/v2ray') ? 'v2ray' : 
                 reqPath.endsWith('/clash') ? 'clash' : 'default';
  
  try {
    const content = await subscriptionGeneratorService.generateSubscriptionContent(basePath);
    const formatted = subscriptionGeneratorService.getFormattedContent(content, format);
    res.type(formatted.type).send(formatted.content);
  } catch (error) {
    console.error('处理订阅请求失败:', error);
    res.status(404).send('Not Found');
  }
}

// 验证会话
async function verifySession(req) {
  const sessionId = req.session.sessionId;
  if (!sessionId) return false;
  return await sessionService.verifyAndRenewSession(sessionId);
}

module.exports = router;