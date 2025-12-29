// 协议解析基类 - 定义通用的解析流程
class BaseProtocol {
  constructor(config) {
    this.prefix = config.prefix;
    this.defaults = config.defaults || {};
    this.transformers = config.transformers || {};
  }

  // 核心解析流程：解析 → 拆分 → 组装
  parse(nodeLink) {
    if (!this.isValidLink(nodeLink)) {
      return null;
    }

    try {
      const elements = this.extractElements(nodeLink);
      if (!this.validateElements(elements)) {
        return null;
      }

      return this.assembleNodeData(elements);
    } catch (error) {
      return null;
    }
  }

  // 检查链接是否有效
  isValidLink(nodeLink) {
    const prefixes = Array.isArray(this.prefix) ? this.prefix : [this.prefix];
    return prefixes.some(prefix => nodeLink.startsWith(prefix));
  }

  // 抽象方法：子类必须实现
  extractElements(nodeLink) {
    throw new Error('extractElements must be implemented by subclass');
  }

  // 默认元素验证
  validateElements(elements) {
    if (!elements) return false;
    
    const requiredFields = ['server', 'port'];
    return requiredFields.every(field => 
      elements[field] != null && elements[field] !== ''
    );
  }

  // 通用数据组装
  assembleNodeData(elements) {
    let nodeData = { ...this.defaults };
    
    Object.entries(elements).forEach(([key, value]) => {
      const transformer = this.transformers[key];
      nodeData[key] = transformer ? transformer(value, elements, nodeData) : value;
    });
    
    return nodeData;
  }

  // 抽象方法：子类实现具体的格式转换
  /**
   * 将节点转换为指定目标格式
   * 子类应该重写此方法来实现自己的转换逻辑
   * @param {Object} node 节点对象
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash')
   * @returns {string|Object|null} 转换后的内容，不支持返回 null
   */
  convertToFormat(node, targetFormat) {
    throw new Error(`Protocol ${this.getProtocolType()} does not support ${targetFormat} format`);
  }

  // 获取协议类型
  getProtocolType() {
    return this.constructor.name.replace('Protocol', '').toLowerCase();
  }
}

module.exports = BaseProtocol;