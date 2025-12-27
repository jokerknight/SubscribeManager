const BaseProtocol = require('./BaseProtocol');
const { safeBase64Decode, safeDecodeURIComponent } = require('../utils/helpers');

class SOCKSProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'socks://',
      defaults: {
        name: '未命名节点'
      },
      transformers: {
        name: (name) => name ? decodeURIComponent(name) : '未命名节点',
        port: (port) => parseInt(port),
        username: (username) => this.decodeAuthInfo(username),
        password: (password) => password ? safeDecodeURIComponent(password) : ''
      }
    });
  }

  extractElements(nodeLink) {
    const url = new URL(nodeLink);
    if (!url.hostname || !url.port) return null;

    return {
      name: url.hash ? url.hash.substring(1) : null,
      server: url.hostname,
      port: url.port,
      username: url.username,
      password: url.password
    };
  }

  // 认证信息解析
  decodeAuthInfo(encoded) {
    if (!encoded) return '';
    
    const decodedUsername = safeDecodeURIComponent(encoded);
    try {
      const decoded = safeBase64Decode(decodedUsername);
      if (decoded.includes(':')) {
        return decoded.split(':')[0];
      }
    } catch (e) {
      // 解码失败，返回原始值
    }
    return decodedUsername;
  }

  toSurgeFormat(node) {
    const parts = [
      `${node.name} = socks5`,
      node.server,
      node.port
    ];

    if (node.username) parts.push(node.username);
    if (node.password) parts.push(node.password);

    return parts.join(', ');
  }

  toClashFormat(node) {
    const clashNode = {
      name: node.name,
      type: 'socks5',
      server: node.server,
      port: node.port
    };

    if (node.username) clashNode.username = node.username;
    if (node.password) clashNode.password = node.password;

    return clashNode;
  }
}

module.exports = SOCKSProtocol;