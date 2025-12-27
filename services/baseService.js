const { SubscriptionRepository, NodeRepository } = require('../utils/database/operations');
const ApiError = require('../utils/ApiError');
const { ERROR_CODES } = require('../utils/constants');

/**
 * 基础服务类 - 提供通用的数据库操作和业务逻辑
 */
class BaseService {
/**
 * 根据订阅路径获取订阅ID
 * @param {string} subscriptionPath 订阅路径
 * @returns {number} 订阅ID
 * @throws {ApiError} 当订阅不存在时
 */
  async getSubscriptionIdByPath(subscriptionPath) {
    const subscriptions = await SubscriptionRepository.findByPath(subscriptionPath);

    if (!subscriptions.length) {
      throw new ApiError(404, ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    return subscriptions[0].id;
  }

/**
 * 检查订阅路径是否唯一
 * @param {string} subscriptionPath 订阅路径
 * @param {number} excludeId 排除的ID（用于更新时检查）
 * @returns {boolean} 是否唯一
 */
  async isSubscriptionPathUnique(subscriptionPath, excludeId = null) {
    return await SubscriptionRepository.isPathUnique(subscriptionPath, excludeId);
  }

/**
 * 获取节点总数
 * @param {number} subscriptionId 订阅ID
 * @returns {number} 节点总数
 */
  async getNodeCount(subscriptionId) {
    return await NodeRepository.count(subscriptionId);
  }

  /**
   * 验证订阅路径格式
   * @param {string} subscriptionPath 订阅路径
   * @throws {ApiError} 当路径格式无效时
   */
  validateSubscriptionPath(subscriptionPath) {
    const { validateSubscriptionPath } = require('../utils/helpers');
    
    if (!validateSubscriptionPath(subscriptionPath)) {
      throw new ApiError(400, ERROR_CODES.INVALID_SUBSCRIPTION_PATH);
    }
  }
}

module.exports = BaseService;