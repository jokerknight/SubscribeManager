const BaseProtocol = require('./BaseProtocol');
const { safeDecodeURIComponent } = require('../utils/helpers');

class Hysteria2Protocol extends BaseProtocol {
  constructor() {
    super({
      prefix: ['hysteria2://', 'hy2://'],
      defaults: {
        name: '未命名节点',
        password: ''
      },
      transformers: {
        name: (name) => name ? decodeURIComponent(name) : '未命名节点',
        port: (port) => parseInt(port)
      }
    });
  }

  extractElements(nodeLink) {
    const url = new URL(nodeLink);
    if (!url.hostname || !url.port) return null;

    const params = new URLSearchParams(url.search);
    
    return {
      name: url.hash ? url.hash.substring(1) : null,
      server: url.hostname,
      port: url.port,
      password: url.username || params.get('password'),
      up: params.get('upmbps') || params.get('up'),
      down: params.get('downmbps') || params.get('down'),
      sni: params.get('sni'),
      alpn: params.get('alpn'),
      obfs: params.get('obfs'),
      obfsPassword: params.get('obfs-password'),
      cc: params.get('cc')
    };
  }

  toSurgeFormat(node) {
    const parts = [
      `${node.name} = hysteria2`,
      node.server,
      node.port,
      `password=${node.password}`
    ];

    if (node.up) parts.push(`up=${node.up}`);
    if (node.down) parts.push(`down=${node.down}`);
    if (node.sni) parts.push(`sni=${safeDecodeURIComponent(node.sni)}`);
    if (node.alpn) parts.push(`alpn=${node.alpn}`);
    if (node.obfs) {
      parts.push(`obfs=${safeDecodeURIComponent(node.obfs)}`);
      if (node.obfsPassword) {
        parts.push(`obfs-password=${safeDecodeURIComponent(node.obfsPassword)}`);
      }
    }
    if (node.cc) parts.push(`cc=${node.cc}`);

    parts.push('skip-cert-verify=true');
    return parts.join(', ');
  }

  toClashFormat(node) {
    const clashNode = {
      name: node.name,
      type: 'hysteria2',
      server: node.server,
      port: node.port,
      password: node.password,
      'skip-cert-verify': true
    };

    if (node.up) clashNode.up = node.up;
    if (node.down) clashNode.down = node.down;
    if (node.sni) clashNode.sni = safeDecodeURIComponent(node.sni);
    if (node.alpn) clashNode.alpn = node.alpn.split(',').map(s => s.trim());
    if (node.obfs) {
      clashNode.obfs = safeDecodeURIComponent(node.obfs);
      if (node.obfsPassword) {
        clashNode['obfs-password'] = safeDecodeURIComponent(node.obfsPassword);
      }
    }
    if (node.cc) clashNode.cc = node.cc;

    return clashNode;
  }
}

module.exports = Hysteria2Protocol;