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
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash', 'universal')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    // 从 Clash YAML 转换为通用格式链接
    if (format === 'universal') {
      return this.convertFromClash(node);
    }

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

  /**
   * 从 Clash YAML 节点转换为通用格式链接
   * @param {Object} proxy Clash 节点对象
   * @returns {string|null} 通用格式字符串
   */
  convertFromClash(proxy) {
    const { name, server, port, password, 'skip-cert-verify': skipCertVerify, sni, network, 'ws-opts': wsOpts, 'grpc-opts': grpcOpts, udp, fingerprint, 'client-fingerprint': clientFingerprint, alpn, 'allowInsecure': allowInsecure } = proxy;

    let params = new URLSearchParams();

    if (network) params.set('type', network);
    if (wsOpts?.path) params.set('path', wsOpts.path);
    if (wsOpts?.headers?.Host) params.set('host', wsOpts.headers.Host);
    if (grpcOpts?.['grpc-service-name']) params.set('serviceName', grpcOpts['grpc-service-name']);
    if (sni) params.set('sni', sni);

    // 处理证书验证
    if (skipCertVerify || allowInsecure) {
      params.set('allowInsecure', '1');
    }

    // 处理 UDP 参数
    if (udp !== undefined) params.set('udp', udp.toString());

    // 处理指纹参数
    if (clientFingerprint) params.set('fp', clientFingerprint);
    if (fingerprint) params.set('fp', fingerprint);

    // 处理 ALPN 参数
    if (alpn) params.set('alpn', Array.isArray(alpn) ? alpn.join(',') : alpn);

    const link = `trojan://${password}@${server}:${port}?${params.toString()}`;
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

    // 支持两种格式：
    // 1. name = trojan, server, port, password, sni
    // 2. name = trojan, server, port, password=xxx, sni=xxx

    const password = keyValuePairs['password'] || params[3];
    const sni = keyValuePairs['sni'] || params[4];

    if (!password) {
      return null;
    }

    const proxyConfig = {
      name,
      server,
      port: parseInt(port),
      password,
      sni
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

module.exports = TrojanProtocol;