const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  createSubscription,
  generateSubscriptionContent,
  updateSubscription: updateSub,
  deleteSubscription: deleteSub
} = require('../services/subscriptionService');
const { ConversionService } = require('../services/conversionService');
const {
  SubscriptionRepository,
  NodeRepository,
  safeBase64Encode,
  filterSnellNodes
} = require('../utils');

// 获取订阅内容 - 支持 /path 格式
router.get('/:path', async (req, res) => {
  await handleSubscriptionRequest(req, res, req.params.path, req.query.format);
});

// 获取订阅内容 - 支持 /path/format 格式
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

    // 构建真实的订阅 URL（使用请求中的真实域名）
    const protocol = req.protocol;
    const host = req.get('host');
    const realBaseUrl = `${protocol}://${host}`;

    // 根据格式返回内容
    let response;
    if (format) {
      const conversionService = new ConversionService();

      switch (format) {
        case 'clash':
        case 'surge':
        case 'shadowsocks': {
          const contentType = format === 'clash'
            ? 'text/yaml; charset=utf-8'
            : 'text/plain; charset=utf-8';

          const convertedContent = await conversionService.convert(content, format, {
            customTemplate: config.customTemplate,
            subconvertUrl: config.subconvertApi,
            subscriptionUrl: subscriptionUrl,
            realBaseUrl: realBaseUrl,  // 传入真实的 baseUrl
            useDefaultTemplate: config.useDefaultTemplate
          });

          response = {
            content: convertedContent,
            type: contentType
          };
          break;
        }
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