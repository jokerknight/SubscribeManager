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
  await handleSubscriptionRequest(req, res, req.params.path, req.query.format);
});

// 获取订阅内容 - 支持 /path/format 路径参数格式
router.get('/:path/:format', async (req, res) => {
  await handleSubscriptionRequest(req, res, req.params.path, req.params.format);
});

// 统一的订阅请求处理函数
async function handleSubscriptionRequest(req, res, path, format) {
  try {
    // 获取订阅内容
    const subscriptionData = await generateSubscriptionContent(path);

    if (!subscriptionData) {
      return res.status(404).json({
        error: { code: 404, message: 'Subscription not found' }
      });
    }

    const { nodes: content, subscriptionUrl, config } = subscriptionData;

    // 根据格式返回内容
    let response;
    if (format) {
      switch (format) {
        case 'clash':
          // 优先使用订阅配置中的 Subconvert API
          const subconvertApi = config.subconvertApi;
          response = {
            content: await convertSubscription(content, format, null, subconvertApi, subscriptionUrl),
            type: 'text/yaml; charset=utf-8'
          };
          break;
        case 'surge':
        case 'shadowsocks':
          response = {
            content: await convertSubscription(content, format, null, config.subconvertApi, subscriptionUrl),
            type: 'text/plain; charset=utf-8'
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
}

module.exports = router;