const BaseProtocol = require('./BaseProtocol');
const { safeBase64Decode, safeDecodeURIComponent } = require('../utils/helpers');

class SSProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'ss://',
      defaults: {
        name: '未命名节点'
      },
      transformers: {
        name: (name) => name ? decodeURIComponent(name) : '未命名节点',
        port: (port) => parseInt(port)
      }
    });
  }

  extractElements(nodeLink) {
    const [base, name] = nodeLink.split('#');
    const prefixRemoved = base.substring(5);
    const atIndex = prefixRemoved.indexOf('@');
    
    if (atIndex === -1) return null;
    
    const [server, port] = prefixRemoved.substring(atIndex + 1).split(':');
    const methodPassBase64 = prefixRemoved.substring(0, atIndex);
    
    let method, password;
    try {
      [method, password] = safeBase64Decode(methodPassBase64).split(':');
    } catch {
      [method, password] = safeDecodeURIComponent(methodPassBase64).split(':');
    }
    
    if (!method || !password) return null;
    
    return { name, server, port, method, password };
  }

  /**
   * 将节点转换为指定目标格式
   * @param {Object} node 节点对象
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    // Shadowsocks 协议支持 surge、shadowsocks、clash 三种格式
    if (format === 'surge' || format === 'shadowsocks') {
      return `${node.name} = ss, ${node.server}, ${node.port}, encrypt-method=${node.method}, password=${node.password}`;
    }

    if (format === 'clash') {
      return {
        name: node.name,
        type: 'ss',
        server: node.server,
        port: node.port,
        cipher: node.method,
        password: node.password
      };
    }

    return null;
  }
}

module.exports = SSProtocol;