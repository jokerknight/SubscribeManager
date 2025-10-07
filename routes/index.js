const express = require('express');
const router = express.Router();
const path = require('path');
const { adminPath } = require('../config');
const authRoutes = require('./auth');
const apiRoutes = require('./api');
const subscriptionRoutes = require('./subscription');
const sessionService = require('../services/sessionService');

// 验证会话的中间件
async function authMiddleware(req, res, next) {
  const sessionId = req.session.sessionId;
  if (!sessionId || !(await sessionService.verifyAndRenewSession(sessionId))) {
    // For API requests, return 401 Unauthorized
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }
    // For other requests, redirect to login
    return res.redirect(`/${adminPath}/login`);
  }
  next();
}

// 管理面板路由
router.get(`/${adminPath}`, authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

// 认证路由
router.use(`/${adminPath}`, authRoutes);

// API 路由，应用认证中间件
router.use(`/${adminPath}/api`, authMiddleware, apiRoutes);

// 订阅路由
router.use('/', subscriptionRoutes);

module.exports = router;