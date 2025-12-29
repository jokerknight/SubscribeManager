const BaseProtocol = require('./BaseProtocol');
const { safeDecodeURIComponent } = require('../utils/helpers');

class TrojanProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'trojan://',
      defaults: {
        name: '未命名节点',
        type: 'tcp'
      },
      transformers: {
        name: (name) => name ? decodeURIComponent(name) : '未命名节点',
        port: (port) => parseInt(port),
        sni: (sni, elements) => sni || elements.server
      }
    });
  }

  extractElements(nodeLink) {
    const url = new URL(nodeLink);
    if (!url.hostname || !url.port || !url.username) return null;

    const params = new URLSearchParams(url.search);
    
    return {
      name: url.hash ? url.hash.substring(1) : null,
      server: url.hostname,
      port: url.port,
      password: url.username,
      type: params.get('type'),
      path: params.get('path'),
      host: params.get('host'),
      sni: params.get('sni'),
      alpn: params.get('alpn')
    };
  }

  /**
   * 将节点转换为指定目标格式
   * @param {Object} node 节点对象
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    if (format === 'surge') {
      const parts = [
        `${node.name} = trojan`,
        node.server,
        node.port,
        `password=${node.password}`,
        'tls=true',
        `sni=${node.sni}`,
        'skip-cert-verify=true',
        'tfo=false'
      ];

      if (node.alpn) {
        parts.push(`alpn=${node.alpn.replace(/,/g, ':')}`);
      }

      if (node.type === 'ws') {
        parts.push('ws=true');
        if (node.path) {
          parts.push(`ws-path=${safeDecodeURIComponent(node.path)}`);
        }
        parts.push(`ws-headers=Host:${node.host || node.server}`);
      }

      return parts.join(', ');
    }

    if (format === 'clash') {
      const clashNode = {
        name: node.name,
        type: 'trojan',
        server: node.server,
        port: node.port,
        password: node.password,
        'skip-cert-verify': true
      };

      if (node.type === 'ws') {
        clashNode.network = 'ws';
        if (node.path || node.host) {
          clashNode['ws-opts'] = {};
          if (node.path) clashNode['ws-opts'].path = safeDecodeURIComponent(node.path);
          if (node.host) {
            clashNode['ws-opts'].headers = { Host: safeDecodeURIComponent(node.host) };
          }
        }
      }

      if (node.sni) clashNode.sni = safeDecodeURIComponent(node.sni);
      return clashNode;
    }

    // Trojan 不支持 shadowsocks 格式
    return null;
  }
}

module.exports = TrojanProtocol;