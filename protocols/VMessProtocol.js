const BaseProtocol = require('./BaseProtocol');
const { safeBase64Decode, safeUtf8Decode } = require('../utils/helpers');

class VMessProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'vmess://',
      defaults: {
        name: '未命名节点',
        alterId: 0,
        tls: false,
        net: 'tcp'
      },
      transformers: {
        name: (name) => name ? safeUtf8Decode(name) : '未命名节点',
        port: (port) => parseInt(port),
        alterId: (aid) => parseInt(aid) || 0,
        tls: (tls) => tls === 'tls'
      }
    });
  }

  extractElements(nodeLink) {
    const config = JSON.parse(safeBase64Decode(nodeLink.substring(8)));
    
    if (!config.add || !config.port || !config.id) return null;
    
    return {
      name: config.ps,
      server: config.add,
      port: config.port,
      uuid: config.id,
      alterId: config.aid,
      tls: config.tls,
      net: config.net || 'tcp',
      path: config.path,
      host: config.host || config.add,
      sni: config.sni,
      alpn: config.alpn
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
        `${node.name} = vmess`,
        node.server,
        node.port,
        `username=${node.uuid}`,
        'vmess-aead=true',
        `tls=${node.tls}`,
        `sni=${node.server}`,
        'skip-cert-verify=true',
        'tfo=false'
      ];

      if (node.tls && node.alpn) {
        parts.push(`alpn=${node.alpn.replace(/,/g, ':')}`);
      }

      if (node.net === 'ws') {
        parts.push('ws=true');
        if (node.path) parts.push(`ws-path=${node.path}`);
        parts.push(`ws-headers=Host:${node.host}`);
      }

      return parts.join(', ');
    }

    if (format === 'clash') {
      const clashNode = {
        name: node.name,
        type: 'vmess',
        server: node.server,
        port: node.port,
        uuid: node.uuid,
        alterId: node.alterId || 0,
        cipher: 'auto',
        tls: node.tls
      };

      if (node.net === 'ws') {
        clashNode.network = 'ws';
        if (node.path) {
          clashNode['ws-opts'] = {
            path: node.path,
            headers: { Host: node.host }
          };
        }
      }

      if (node.tls) {
        clashNode['skip-cert-verify'] = true;
        if (node.sni) clashNode.servername = node.sni;
      }

      return clashNode;
    }

    // VMess 不支持 shadowsocks 格式
    return null;
  }
}

module.exports = VMessProtocol;