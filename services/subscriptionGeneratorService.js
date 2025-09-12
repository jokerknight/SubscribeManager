const { dbQuery, filterSnellNodes,convertToClash, convertToSurge,safeBase64Encode } = require('../utils');

async function generateSubscriptionContent(subscriptionPath) {
  // 获取订阅内容
  const subscription = await dbQuery(
    'SELECT * FROM subscriptions WHERE path = ?',
    [subscriptionPath]
  );
  
  if (!subscription.length) {
    throw new Error('Subscription not found');
  }
  
  // 获取节点
  const nodes = await dbQuery(`
    SELECT original_link 
    FROM nodes 
    WHERE subscription_id = ? AND (enabled IS NULL OR enabled = 1)
    ORDER BY node_order ASC
  `, [subscription[0].id]);
  
  return nodes.map(node => node.original_link).join('\n');
}

function getFormattedContent(content, format) {
  switch (format) {
    case 'surge':
      return {
        content: convertToSurge(content), // 实际应调用转换函数
        type: 'text/plain; charset=utf-8'
      };
    case 'v2ray':
      return {
        content: safeBase64Encode(filterSnellNodes(content)),
        type: 'text/plain; charset=utf-8'
      };
    case 'clash':
      return {
        content: convertToClash(content), // 实际应调用转换函数
        type: 'text/yaml; charset=utf-8'
      };
    default:
      return {
        content: filterSnellNodes(content),
        type: 'text/plain; charset=utf-8'
      };
  }
}

module.exports = {
  generateSubscriptionContent,
  getFormattedContent
};