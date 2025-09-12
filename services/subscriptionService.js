const { dbQuery, dbRun, validateSubscriptionPath } = require('../utils');

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
    throw new Error('Invalid parameters');
  }
  
  // 检查路径是否已存在
  const existing = await dbQuery(
    'SELECT COUNT(*) as count FROM subscriptions WHERE path = ?',
    [path]
  );
  
  if (existing[0].count > 0) {
    throw new Error('Path already exists');
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
    throw new Error('Invalid parameters');
  }
  
  // 如果路径被修改，检查新路径是否已存在
  if (newPath !== oldPath) {
    const existing = await dbQuery(
      'SELECT COUNT(*) as count FROM subscriptions WHERE path = ?',
      [newPath]
    );
    
    if (existing[0].count > 0) {
      throw new Error('Path already exists');
    }
  }
  
  await dbRun(
    'UPDATE subscriptions SET name = ?, path = ? WHERE path = ?',
    [newName, newPath, oldPath]
  );
}

async function deleteSubscription(path) {
  const db = require('../database').getDB(); // 需要事务处理
  
  await db.run('BEGIN TRANSACTION');
  
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
  
  await db.run('COMMIT');
}

module.exports = {
  getSubscriptions,
  createSubscription,
  getSubscription,
  updateSubscription,
  deleteSubscription
};