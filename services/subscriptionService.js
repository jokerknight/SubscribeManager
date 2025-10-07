const { dbQuery, dbRun, validateSubscriptionPath, withTransaction } = require('../utils');
const ApiError = require('../utils/ApiError');

async function getSubscriptions() {
  return dbQuery(`
    SELECT 
      s.path,
      s.name,
      COUNT(n.id) as nodeCount
    FROM subscriptions s
    LEFT JOIN nodes n ON s.id = n.subscription_id
    GROUP BY s.id
    ORDER BY s.id ASC
  `);
}

async function createSubscription(name, path) {
  if (!name || !validateSubscriptionPath(path)) {
    throw new ApiError(400, 'subscription.path_invalid');
  }
  
  // 检查路径是否已存在
  const existing = await dbQuery(
    'SELECT COUNT(*) as count FROM subscriptions WHERE path = ?',
    [path]
  );
  
  if (existing[0].count > 0) {
    throw new ApiError(400, 'subscription.path_used');
  }
  
  await dbRun(
    'INSERT INTO subscriptions (name, path) VALUES (?, ?)',
    [name, path]
  );
}

async function getSubscription(path) {
  const results = await dbQuery(
    'SELECT * FROM subscriptions WHERE path = ?',
    [path]
  );
  return results[0];
}

async function updateSubscription(oldPath, newName, newPath) {
  if (!newName || !validateSubscriptionPath(newPath)) {
    throw new ApiError(400, 'subscription.path_invalid');
  }
  
  // 如果路径被修改，检查新路径是否已存在
  if (newPath !== oldPath) {
    const existing = await dbQuery(
      'SELECT COUNT(*) as count FROM subscriptions WHERE path = ?',
      [newPath]
    );
    
    if (existing[0].count > 0) {
      throw new ApiError(400, 'subscription.path_used');
    }
  }
  
  await dbRun(
    'UPDATE subscriptions SET name = ?, path = ? WHERE path = ?',
    [newName, newPath, oldPath]
  );
}

async function deleteSubscription(path) {
  await withTransaction(async (db) => {
    // 删除订阅下的节点
    await db.run(
      'DELETE FROM nodes WHERE subscription_id IN (SELECT id FROM subscriptions WHERE path = ?)',
      [path]
    );
    
    // 删除订阅
    await db.run(
      'DELETE FROM subscriptions WHERE path = ?',
      [path]
    );
  });
}

module.exports = {
  getSubscriptions,
  createSubscription,
  getSubscription,
  updateSubscription,
  deleteSubscription
};