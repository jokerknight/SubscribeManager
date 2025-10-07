const express = require('express');
const router = express.Router();
const subscriptionGeneratorService = require('../services/subscriptionGeneratorService');

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

// 订阅请求处理
router.get('/:path', handleSubscriptionRequest);
router.get('/:path/surge', handleSubscriptionRequest);
router.get('/:path/v2ray', handleSubscriptionRequest);
router.get('/:path/clash', handleSubscriptionRequest);

module.exports = router;