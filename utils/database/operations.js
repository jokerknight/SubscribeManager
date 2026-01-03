const { getDB } = require('../../database');
const ApiError = require('../ApiError');
const ERROR_CODES = {
  SUBSCRIPTION_NOT_FOUND: 'subscription.not_found',
  NODE_NOT_FOUND: 'node.not_found',
  INVALID_SUBSCRIPTION_PATH: 'subscription.invalid_path',
  INVALID_NODE_LINK: 'node.invalid_link',
  DUPLICATE_SUBSCRIPTION_PATH: 'subscription.duplicate_path'
};

/**
 * 数据库查询操作
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function dbQuery(sql, params = []) {
  const db = getDB();
  return db.all(sql, params);
}

/**
 * 数据库执行操作
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise<Object>} 执行结果
 */
async function dbRun(sql, params = []) {
  const db = getDB();
  return db.run(sql, params);
}

/**
 * 事务处理
 * @param {Function} callback 事务回调函数
 * @returns {Promise<void>}
 */
async function withTransaction(callback) {
  const db = getDB();
  await db.run('BEGIN TRANSACTION');
  try {
    await callback(db);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

/**
 * 订阅数据访问对象
 */
class SubscriptionRepository {
  /**
   * 根据路径查找订阅
   * @param {string} path 订阅路径
   * @returns {Promise<Array>} 订阅信息
   */
  static async findByPath(path) {
    return await dbQuery(
      'SELECT * FROM subscriptions WHERE path = ?',
      [path]
    );
  }

  /**
   * 根据ID查找订阅
   * @param {number} id 订阅ID
   * @returns {Promise<Array>} 订阅信息
   */
  static async findById(id) {
    return await dbQuery(
      'SELECT * FROM subscriptions WHERE id = ?',
      [id]
    );
  }

  /**
   * 检查路径是否唯一
   * @param {string} path 订阅路径
   * @param {number} excludeId 排除的ID
   * @returns {Promise<boolean>} 是否唯一
   */
  static async isPathUnique(path, excludeId = null) {
    let sql = 'SELECT id FROM subscriptions WHERE path = ?';
    let params = [path];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const existing = await dbQuery(sql, params);
    return existing.length === 0;
  }

  /**
   * 创建订阅
   * @param {Object} data 订阅数据
   * @returns {Promise<Object>} 创建结果
   */
  static async create(data) {
    const { name, path, enabled = 1 } = data;
    return await dbRun(
      'INSERT INTO subscriptions (name, path, enabled) VALUES (?, ?, ?)',
      [name, path, enabled]
    );
  }

  /**
   * 更新订阅
   * @param {number} id 订阅ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  static async update(id, data) {
    const { name, path, enabled } = data;
    return await dbRun(
      'UPDATE subscriptions SET name = ?, path = ?, enabled = ? WHERE id = ?',
      [name, path, enabled, id]
    );
  }

  /**
   * 删除订阅
   * @param {number} id 订阅ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    return await dbRun(
      'DELETE FROM subscriptions WHERE id = ?',
      [id]
    );
  }

  /**
   * 获取所有订阅
   * @returns {Promise<Array>} 订阅列表
   */
  static async findAll() {
    return await dbQuery('SELECT * FROM subscriptions ORDER BY created_at DESC');
  }
}

/**
 * 节点数据访问对象
 */
class NodeRepository {
  /**
   * 根据订阅ID获取节点
   * @param {number} subscriptionId 订阅ID
   * @returns {Promise<Array>} 节点列表
   */
  static async findBySubscriptionId(subscriptionId) {
    return await dbQuery(`
      SELECT 
        n.id,
        n.name,
        n.original_link,
        n.node_order,
        n.enabled
      FROM nodes n
      WHERE n.subscription_id = ? 
        AND (n.enabled IS NULL OR n.enabled = 1)
      ORDER BY n.node_order ASC
    `, [subscriptionId]);
  }

  /**
   * 根据订阅路径获取节点
   * @param {string} subscriptionPath 订阅路径
   * @returns {Promise<Array>} 节点列表
   */
  static async findBySubscriptionPath(subscriptionPath) {
    return await dbQuery(`
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

  /**
   * 创建节点
   * @param {Object} data 节点数据
   * @returns {Promise<Object>} 创建结果
   */
  static async create(data) {
    const { subscriptionId, name, originalLink, nodeOrder = 0, type } = data;
    return await dbRun(
      'INSERT INTO nodes (subscription_id, name, original_link, node_order, type) VALUES (?, ?, ?, ?, ?)',
      [subscriptionId, name, originalLink, nodeOrder, type]
    );
  }

  /**
   * 更新节点
   * @param {number} id 节点ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  static async update(id, data) {
    const { name, originalLink } = data;
    return await dbRun(
      'UPDATE nodes SET name = ?, original_link = ? WHERE id = ?',
      [name, originalLink, id]
    );
  }

  /**
   * 删除节点
   * @param {number} id 节点ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    return await dbRun(
      'DELETE FROM nodes WHERE id = ?',
      [id]
    );
  }

  /**
   * 切换节点状态
   * @param {number} id 节点ID
   * @param {boolean} enabled 是否启用
   * @returns {Promise<Object>} 更新结果
   */
  static async toggle(id, enabled) {
    return await dbRun(
      'UPDATE nodes SET enabled = ? WHERE id = ?',
      [enabled, id]
    );
  }

  /**
   * 重新排序节点
   * @param {number} subscriptionId 订阅ID
   * @param {Array} nodeOrder 节点顺序数组
   * @returns {Promise<void>}
   */
  static async reorder(subscriptionId, nodeOrder) {
    return await withTransaction(async (db) => {
      for (let i = 0; i < nodeOrder.length; i++) {
        await db.run(
          'UPDATE nodes SET node_order = ? WHERE id = ? AND subscription_id = ?',
          [i, nodeOrder[i], subscriptionId]
        );
      }
    });
  }

  /**
   * 获取节点数量
   * @param {number} subscriptionId 订阅ID
   * @returns {Promise<number>} 节点数量
   */
  static async count(subscriptionId) {
    const result = await dbQuery(
      'SELECT COUNT(*) as count FROM nodes WHERE subscription_id = ? AND (enabled IS NULL OR enabled = 1)',
      [subscriptionId]
    );
    return result[0].count;
  }

  /**
   * 根据订阅路径删除所有节点
   * @param {string} subscriptionPath 订阅路径
   * @returns {Promise<Object>} 删除结果
   */
  static async deleteBySubscriptionPath(subscriptionPath) {
    return await dbRun(
      'DELETE FROM nodes WHERE subscription_id IN (SELECT id FROM subscriptions WHERE path = ?)',
      [subscriptionPath]
    );
  }
}

module.exports = {
  dbQuery,
  dbRun,
  withTransaction,
  SubscriptionRepository,
  NodeRepository
};