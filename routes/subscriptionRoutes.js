const express = require('express');
const router = express.Router();
const { 
  getSubscriptions, 
  createSubscription, 
  generateSubscriptionContent, 
  updateSubscription: updateSub, 
  deleteSubscription: deleteSub 
} = require('../services/subscriptionService');
const { 
  SubscriptionRepository, 
  NodeRepository, 
  safeBase64Encode, 
  filterSnellNodes,
  convertSubscription 
} = require('../utils');

// 获取订阅内容 - 支持查询参数格式和路径参数格式
router.get('/:path', async (req, res) => {
  try {
    const { path } = req.params;
    let { format } = req.query;
    
    // 如果没有查询参数，检查路径参数格式 /path/format
    const pathSegments = req.path.split('/').filter(Boolean);
    if (pathSegments.length > 1 && !format) {
      format = pathSegments[1]; // 取第二个路径段作为format
    }

    // 获取订阅内容
    const content = await generateSubscriptionContent(path);
    
    if (!content) {
      return res.status(404).json({
        error: { code: 404, message: 'Subscription not found' }
      });
    }

    // 根据格式返回内容
    let response;
    if (format) {
      switch (format) {
        case 'clash':
        case 'surge':
        case 'shadowsocks':
          response = {
            content: convertSubscription(content, format),
            type: format === 'clash' ? 'text/yaml; charset=utf-8' : 'text/plain; charset=utf-8'
          };
          break;
        case 'v2ray':
          response = {
            content: safeBase64Encode(filterSnellNodes(content)),
            type: 'text/plain; charset=utf-8'
          };
          break;
        default:
          return res.status(404).json({
            error: { code: 404, message: 'Unsupported format' }
          });
      }
    } else {
      response = {
        content: filterSnellNodes(content),
        type: 'text/plain; charset=utf-8'
      };
    }

    res.set('Content-Type', response.type);
    res.send(response.content);

  } catch (error) {
    console.error('Subscription generation error:', error);
    res.status(500).json({
      error: { code: 500, message: 'Internal server error', details: error.message }
    });
  }
});

module.exports = router;