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

  /**
   * 将节点转换为指定目标格式
   * @param {Object} node 节点对象
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash', 'universal')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    // 从 Clash YAML 转换为通用格式链接
    if (format === 'universal' && node.server && node.port && node.password) {
      return this.convertFromClash(node);
    }

    if (format === 'surge') {
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

    if (format === 'clash') {
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

    // Hysteria2 不支持 shadowsocks 格式
    return null;
  }

  /**
   * 从 Clash YAML 节点转换为通用格式链接
   * @param {Object} proxy Clash 节点对象
   * @returns {string|null} 通用格式字符串
   */
  convertFromClash(proxy) {
    const { name, server, port, password, sni, 'skip-cert-verify': skipCertVerify } = proxy;

    let params = new URLSearchParams();
    if (sni) params.set('sni', sni);
    if (skipCertVerify) params.set('insecure', '1');

    const link = `hysteria2://${password}@${server}:${port}?${params.toString()}`;
    return name ? `${link}#${encodeURIComponent(name)}` : link;
  }

  /**
   * 从 Surge 逗号格式节点转换为通用格式链接
   * @param {string} name 节点名称
   * @param {Array<string>} params 逗号分隔的参数列表
   * @returns {string|null} 通用格式字符串
   */
  convertFromSurge(name, params) {
    const [, server, port, ...rest] = params;

    if (!server || !port) return null;

    // 解析键值对参数
    const keyValuePairs = rest.join(',').split(',').reduce((acc, item) => {
      const eqIndex = item.indexOf('=');
      if (eqIndex !== -1) {
        const key = item.substring(0, eqIndex).trim();
        const value = item.substring(eqIndex + 1).trim();
        if (key) {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    // 格式: name = hysteria2, server, port, password=xxx, sni=xxx, skip-cert-verify=true
    const password = keyValuePairs['password'] || params[3];
    const sni = keyValuePairs['sni'] || keyValuePairs['sni-name'] || params[4];
    const skipCertVerify = keyValuePairs['skip-cert-verify'];

    if (!password) {
      return null;
    }

    const proxyConfig = {
      name,
      server,
      port: parseInt(port),
      password,
      sni,
      'skip-cert-verify': skipCertVerify === 'true'
    };

    return this.convertFromClash(proxyConfig);
  }

  /**
   * 从 Clash 逗号格式节点转换为通用格式链接
   * @param {string} name 节点名称
   * @param {Array<string>} parts 逗号分隔的参数列表
   * @returns {string|null} 通用格式字符串
   */
  convertFromClashComma(name, parts) {
    const proxyConfig = {
      name,
      server: parts[2],
      port: parts[3],
      password: parts[4]
    };

    if (!proxyConfig.server || !proxyConfig.port || !proxyConfig.password) {
      return null;
    }

    return this.convertFromClash(proxyConfig);
  }
}

module.exports = Hysteria2Protocol;