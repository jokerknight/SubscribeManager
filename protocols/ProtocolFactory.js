// 协议工厂类 - 管理所有协议实例和提供统一接口
const SSProtocol = require('./SSProtocol');
const VMessProtocol = require('./VMessProtocol');
const TrojanProtocol = require('./TrojanProtocol');
const SOCKSProtocol = require('./SOCKSProtocol');
const Hysteria2Protocol = require('./Hysteria2Protocol');
const TUICProtocol = require('./TUICProtocol');
const VLESSProtocol = require('./VLESSProtocol');

// 使用统一常量
const { NODE_TYPES } = require('../utils/constants');

class ProtocolFactory {
  constructor() {
    // 初始化所有协议实例
    this.protocols = [
      new SSProtocol(),
      new VMessProtocol(),
      new TrojanProtocol(),
      new SOCKSProtocol(),
      new Hysteria2Protocol(),
      new TUICProtocol(),
      new VLESSProtocol()
    ];
    
    // 建立前缀到协议的映射
    this.protocolMap = new Map();
    this.protocols.forEach(protocol => {
      const prefixes = Array.isArray(protocol.prefix) ? protocol.prefix : [protocol.prefix];
      prefixes.forEach(prefix => {
        this.protocolMap.set(prefix, protocol);
      });
    });
  }

  // 解析节点链接 - 使用多态
  parseNode(nodeLink) {
    if (!nodeLink) return null;

    // Snell 协议需要特殊处理，但不在此处过滤
    // 让 ClientProcessor 来决定如何处理 Snell

    // 使用前缀找到对应的协议
    const protocol = this.findProtocolByPrefix(nodeLink);
    if (!protocol) return null;

    // 使用多态调用具体的解析逻辑
    const nodeData = protocol.parse(nodeLink);
    if (nodeData) {
      return {
        ...nodeData,
        type: Array.isArray(protocol.prefix) ? protocol.prefix[0] : protocol.prefix
      };
    }

    return null;
  }

  // 转换节点到指定格式 - 使用多态
  convertNodeFormat(node, formatType) {
    const protocol = this.findProtocolByPrefix(node.type);
    if (!protocol) return null;

    switch (formatType.toLowerCase()) {
      case 'surge':
      case 'shadowsocks':
        // VLESS 不支持 Surge 格式，返回 null 会被过滤掉
        if (node.type === 'vless://') {
          return null;
        }
        return protocol.toSurgeFormat(node);
      case 'clash':
        return protocol.toClashFormat(node);
      default:
        return null;
    }
  }

  // 根据前缀查找协议
  findProtocolByPrefix(nodeLink) {
    for (const [prefix, protocol] of this.protocolMap.entries()) {
      if (nodeLink.startsWith(prefix)) {
        return protocol;
      }
    }
    return null;
  }

  // 获取支持的协议列表
  getSupportedProtocols() {
    return this.protocols.map(protocol => ({
      name: protocol.constructor.name,
      prefix: protocol.prefix,
      type: protocol.getProtocolType()
    }));
  }

  // 检查协议是否支持
  isProtocolSupported(prefix) {
    return this.protocolMap.has(prefix);
  }
}

// 单例模式
let factoryInstance = null;

function getProtocolFactory() {
  if (!factoryInstance) {
    factoryInstance = new ProtocolFactory();
  }
  return factoryInstance;
}

module.exports = {
  ProtocolFactory,
  getProtocolFactory
};