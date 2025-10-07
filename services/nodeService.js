const { dbQuery, dbRun, extractNodeName, NODE_TYPES, safeBase64Decode, withTransaction } = require('../utils');
const ApiError = require('../utils/ApiError');

async function getNodes(subscriptionPath) {
  return dbQuery(`
    SELECT 
      n.id,
      n.name,
      n.original_link,
      n.node_order,
      n.enabled
    FROM nodes n
    JOIN subscriptions s ON n.subscription_id = s.id
    WHERE s.path = ?
    ORDER BY n.node_order ASC
  `, [subscriptionPath]);
}

async function createNode(subscriptionPath, name, content, order) {
  if (!content) {
    throw new ApiError(400, 'nodes.content_required');
  }
  
  // 获取订阅ID
  const subscription = await dbQuery(
    'SELECT id FROM subscriptions WHERE path = ?',
    [subscriptionPath]
  );
  
  if (!subscription.length) {
    throw new ApiError(404, 'subscription.not_found');
  }
  
  const subscriptionId = subscription[0].id;
  let originalLink = content.trim();
  
  // 尝试Base64解码
  try {
    const decodedContent = safeBase64Decode(originalLink);
    if (Object.values(NODE_TYPES).some(prefix =>
      decodedContent.startsWith(prefix) && prefix !== NODE_TYPES.SNELL)) {
      originalLink = decodedContent.trim();
    }
  } catch (e) { }

  // 验证节点类型
  const lowerContent = originalLink.toLowerCase();
  const isSnell = lowerContent.includes('=') && lowerContent.includes('snell,');
  if (!Object.values(NODE_TYPES).some(type => lowerContent.startsWith(type.toLowerCase())) && !isSnell) {
    throw new ApiError(400, 'nodes.unsupported_format');
  }
  
  // 提取节点名称
  let nodeName = name || extractNodeName(originalLink);
  
  // 插入节点
  await dbRun(
    'INSERT INTO nodes (subscription_id, name, original_link, node_order) VALUES (?, ?, ?, ?)',
    [subscriptionId, nodeName, originalLink, order || 0]
  );
}

async function updateNode(subscriptionPath, nodeId, content) {
  if (!content) {
    throw new ApiError(400, 'nodes.content_required');
  }
  
  // 获取订阅ID
  const subscription = await dbQuery(
    'SELECT id FROM subscriptions WHERE path = ?',
    [subscriptionPath]
  );
  
  if (!subscription.length) {
    throw new ApiError(404, 'subscription.not_found');
  }
  
  const subscriptionId = subscription[0].id;
  let originalLink = content.replace(/[\r\n\s]+$/, '');
  
  // 尝试base64解码
  try {
    const decodedContent = safeBase64Decode(originalLink);
    if (Object.values(NODE_TYPES).some(prefix =>
      decodedContent.startsWith(prefix) && prefix !== NODE_TYPES.SNELL)) {
      originalLink = decodedContent.replace(/[\r\n\s]+$/, '');
    }
  } catch (e) { }

  // 提取节点名称
  const nodeName = extractNodeName(originalLink);
  
  // 更新节点
  await dbRun(
    'UPDATE nodes SET original_link = ?, name = ? WHERE id = ? AND subscription_id = ?',
    [originalLink, nodeName || '未命名节点', nodeId, subscriptionId]
  );
}

async function deleteNode(subscriptionPath, nodeId) {
  // 获取订阅ID
  const subscription = await dbQuery(
    'SELECT id FROM subscriptions WHERE path = ?',
    [subscriptionPath]
  );
  
  if (!subscription.length) {
    throw new ApiError(404, 'subscription.not_found');
  }
  
  const subscriptionId = subscription[0].id;
  
  // 删除节点
  await dbRun(
    'DELETE FROM nodes WHERE id = ? AND subscription_id = ?',
    [nodeId, subscriptionId]
  );
}

async function toggleNode(subscriptionPath, nodeId, enabled) {
  if (typeof enabled !== 'boolean') {
    throw new ApiError(400, 'nodes.invalid_enabled');
  }
  
  // 获取订阅ID
  const subscription = await dbQuery(
    'SELECT id FROM subscriptions WHERE path = ?',
    [subscriptionPath]
  );
  
  if (!subscription.length) {
    throw new ApiError(404, 'subscription.not_found');
  }
  
  const subscriptionId = subscription[0].id;
  
  // 更新节点状态
  await dbRun(
    'UPDATE nodes SET enabled = ? WHERE id = ? AND subscription_id = ?',
    [enabled ? 1 : 0, nodeId, subscriptionId]
  );
}

async function reorderNodes(subscriptionPath, orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new ApiError(400, 'nodes.invalid_orders');
  }
  
  // 获取订阅ID
  const subscription = await dbQuery(
    'SELECT id FROM subscriptions WHERE path = ?',
    [subscriptionPath]
  );
  
  if (!subscription.length) {
    throw new ApiError(404, 'subscription.not_found');
  }
  
  const subscriptionId = subscription[0].id;
  
  await withTransaction(async (db) => {
    for (const { id, order } of orders) {
      await db.run(
        'UPDATE nodes SET node_order = ? WHERE id = ? AND subscription_id = ?',
        [order, id, subscriptionId]
      );
    }
  });
}

module.exports = {
  getNodes,
  createNode,
  updateNode,
  deleteNode,
  toggleNode,
  reorderNodes
};