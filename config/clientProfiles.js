/**
 * 客户端协议支持配置 - 定义不同客户端支持的协议
 * 硬编码配置，稳定可靠，无需动态修改
 */

// 客户端协议支持配置
const CLIENT_PROTOCOL_SUPPORT = {
    // Clash 客户端 - 支持主流代理协议，不支持 Snell
  clash: [
    'ss://', 'ssr://', 'vmess://', 'vless://', 
    'trojan://', 'socks://', 'hysteria2://', 
    'hy2://', 'tuic://'
  ],

  // Surge 客户端 - 支持 Snell，不支持 VLESS
  surge: [
    'ss://', 'vmess://', 'trojan://', 'socks://', 
    'hysteria2://', 'hy2://', 'tuic://', 'snell://'
  ],

  // Shadowsocks 客户端 - 仅支持 SS/SSR 协议
  shadowsocks: [
    'ss://', 'ssr://'
  ],

  // 通用客户端 - 支持所有协议
  universal: [
    'ss://', 'ssr://', 'vmess://', 'vless://', 
    'trojan://', 'socks://', 'hysteria2://', 
    'hy2://', 'tuic://', 'snell://'
  ]
};

/**
 * 简化的客户端协议支持检查器
 */
class ProtocolSupportChecker {
  constructor() {
    this.supportConfig = CLIENT_PROTOCOL_SUPPORT;
  }

  /**
   * 检查客户端是否支持指定协议
   * @param {string} clientType 客户端类型
   * @param {string} protocol 协议前缀
   * @returns {boolean} 是否支持
   */
  supportsProtocol(clientType, protocol) {
    const supportedProtocols = this.supportConfig[clientType];
    if (!supportedProtocols) return false;
    
    return supportedProtocols.includes(protocol);
  }

  /**
   * 获取客户端支持的所有协议
   * @param {string} clientType 客户端类型
   * @returns {Array} 支持的协议列表
   */
  getSupportedProtocols(clientType) {
    return this.supportConfig[clientType] || [];
  }

  /**
   * 获取所有可用的客户端类型
   * @returns {Array} 客户端类型列表
   */
  getAvailableClients() {
    return Object.keys(this.supportConfig);
  }

  /**
   * 获取协议支持矩阵
   * @returns {Object} 协议支持矩阵
   */
  getProtocolMatrix() {
    const matrix = {};
    const allProtocols = new Set();
    
    // 收集所有协议
    Object.values(this.supportConfig).forEach(protocols => {
      protocols.forEach(protocol => allProtocols.add(protocol));
    });

    // 构建矩阵
    allProtocols.forEach(protocol => {
      matrix[protocol] = {};
      Object.keys(this.supportConfig).forEach(clientType => {
        matrix[protocol][clientType] = this.supportsProtocol(clientType, protocol);
      });
    });

    return matrix;
  }
}

// 导出单例实例
const protocolSupportChecker = new ProtocolSupportChecker();

module.exports = {
  CLIENT_PROTOCOL_SUPPORT,
  ProtocolSupportChecker,
  protocolSupportChecker
};