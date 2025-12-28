const express = require('express');
const router = express.Router();
const path = require('path');
const authService = require('../services/authService');
const { adminPath } = require('../config');

// 登录页面
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// 登录处理
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const sessionInfo = await authService.login(username, password);
    req.session.sessionId = sessionInfo.sessionId;
    res.json({ success: true, redirect: `/${adminPath}` });
  } catch (error) {
    next(error);
  }
});

// 登出
router.get('/logout', async (req, res) => {
  if (req.session.sessionId) {
    await authService.logout(req.session.sessionId);
    req.session.destroy();
  }
  res.redirect(`/${adminPath}/auth/login`);
});

module.exports = router;