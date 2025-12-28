const BaseProtocol = require('./BaseProtocol');

class VLESSProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'vless://'
    });
  }

  /**
   * 解析 VLESS 节点链接
   * @param {string} link VLESS 协议链接
   * @returns {Object|null} 解析后的节点信息
   */
  parse(link) {
    try {
      const url = new URL(link);
      
      // 提取基本信息
      const node = {
        type: 'vless://',
        name: decodeURIComponent(url.hash.slice(1)) || 'VLESS',
        server: url.hostname,
        port: parseInt(url.port) || 443,
        uuid: url.username
      };

      // 解析查询参数
      const params = new URLSearchParams(url.search);
      
      // VLESS 特有参数
      if (params.has('encryption')) {
        node.encryption = params.get('encryption');
      }
      
      if (params.has('security')) {
        node.security = params.get('security');
      }
      
      if (params.has('type')) {
        node.network = params.get('type');
      }
      
      if (params.has('path')) {
        node.path = params.get('path');
      }
      
      if (params.has('serviceName')) {
        node.serviceName = params.get('serviceName');
      }
      
      if (params.has('ed')) {
        node.earlyData = params.get('ed');
      }
      
      if (params.has('max-early-data')) {
        node.maxEarlyData = params.get('max-early-data');
      }
      
      if (params.has('early-data-header-name')) {
        node.earlyDataHeaderName = params.get('early-data-header-name');
      }
      
      if (params.has('host')) {
        node.host = params.get('host');
      }
      
      if (params.has('sni')) {
        node.sni = params.get('sni');
      }
      
      if (params.has('alpn')) {
        node.alpn = params.get('alpn');
      }
      
      if (params.has('fp')) {
        node.fingerprint = params.get('fp');
      }
      
      if (params.has('flow')) {
        node.flow = params.get('flow');
      }
      
      // Reality 特有参数
      if (params.has('pbk')) {
        node.pbk = params.get('pbk');
      }
      
      if (params.has('sid')) {
        node.sid = params.get('sid');
      }
      
      // 证书验证相关参数
      if (params.has('allowInsecure') || params.has('allow_insecure')) {
        node.allowInsecure = params.get('allowInsecure') || params.get('allow_insecure');
      }

      return node;
    } catch (error) {
      console.error('Failed to parse VLESS link:', error);
      return null;
    }
  }

  /**
   * 转换为 Surge 格式
   * @param {Object} node 节点信息
   * @returns {string} Surge 配置
   */
  toSurgeFormat(node) {
    // VLESS 在 Surge 中不支持，返回 null
    return null;
  }

  /**
   * 转换为 Clash 格式
   * @param {Object} node 节点信息
   * @returns {string} Clash 配置片段
   */
  toClashFormat(node) {
    const clashNode = {
      name: node.name,
      type: 'vless',
      server: node.server,
      port: node.port,
      uuid: node.uuid
    };

    // 添加可选参数
    if (node.encryption) {
      clashNode.cipher = node.encryption;
    }

    if (node.network) {
      clashNode.network = node.network;
      
      // 网络相关配置
      if (node.network === 'ws') {
        clashNode['ws-opts'] = {};
        if (node.path) {
          clashNode['ws-opts'].path = node.path;
        }
        if (node.host) {
          clashNode['ws-opts'].headers = {
            Host: node.host
          };
        }
        
        // 早期数据配置
        if (node.earlyData) {
          clashNode['ws-opts']['max-early-data'] = parseInt(node.earlyData);
        }
        if (node.maxEarlyData) {
          clashNode['ws-opts']['max-early-data'] = parseInt(node.maxEarlyData);
        }
        if (node.earlyDataHeaderName) {
          clashNode['ws-opts']['early-data-header-name'] = node.earlyDataHeaderName;
        }
      } else if (node.network === 'grpc') {
        clashNode['grpc-opts'] = {};
        // 优先使用 serviceName，其次使用 path
        const serviceName = node.serviceName || node.path;
        if (serviceName) {
          clashNode['grpc-opts']['grpc-service-name'] = serviceName;
        }
      }
    }

    // 添加 flow 字段（如果存在）
    if (node.flow) {
      clashNode.flow = node.flow;
    }

    // TLS 配置
    if (node.security === 'reality' || node.security === 'tls' || node.sni) {
      clashNode.tls = true;
      
      // 公共 TLS 配置
      if (node.sni) {
        clashNode.servername = node.sni;
      }
      if (node.fingerprint) {
        clashNode.fingerprint = node.fingerprint;
      }
      if (node.alpn) {
        clashNode.alpn = node.alpn.split(',');
      }
      
      // 证书验证配置
      if (node.allowInsecure === 'true' || node.allowInsecure === '1') {
        clashNode['skip-cert-verify'] = true;
      }
      
      // Reality 特有配置
      if (node.security === 'reality') {
        clashNode['reality-opts'] = {};
        
        if (node.sni) {
          clashNode['reality-opts'].sni = node.sni;
        }
        
        if (node.pbk) {
          clashNode['reality-opts']['public-key'] = node.pbk;
        }
        
        if (node.sid) {
          clashNode['reality-opts']['short-id'] = node.sid;
        }
      }
    }

    return clashNode;
  }

  /**
   * 获取协议类型
   * @returns {string} 协议类型
   */
  getProtocolType() {
    return 'VLESS';
  }
}

module.exports = VLESSProtocol;