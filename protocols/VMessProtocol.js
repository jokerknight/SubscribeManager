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
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash', 'universal')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    if (format === 'universal') {
      // 如果 node 是从 Clash YAML 解析的（有 server/port 等 Clash 字段），使用 convertFromClash
      // 否则返回原始 vmess:// 链接
      if (node.server && node.port && node.uuid) {
        return this.convertFromClash(node);
      }

      // 返回原始 vmess:// 链接
      const vmessConfig = {
        v: '2',
        ps: node.name || '未命名节点',
        add: node.server,
        port: node.port.toString(),
        id: node.uuid,
        aid: (node.alterId || 0).toString(),
        scy: 'auto',
        net: node.net || 'tcp',
        type: 'none',
        host: node.host || '',
        path: node.path || '',
        tls: node.tls ? 'tls' : ''
      };

      if (node.sni) {
        vmessConfig.sni = node.sni;
      }

      const jsonStr = JSON.stringify(vmessConfig);
      const base64Str = Buffer.from(jsonStr).toString('base64');
      return `vmess://${base64Str}`;
    }

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

  /**
   * 从 Clash YAML 节点转换为通用格式链接
   * @param {Object} proxy Clash 节点对象
   * @returns {string|null} 通用格式字符串
   */
  convertFromClash(proxy) {
    const { name, server, port, uuid, alterId, cipher = 'auto', network, tls, 'skip-cert-verify': skipCertVerify, servername, 'ws-opts': wsOpts, 'grpc-opts': grpcOpts, udp, fingerprint, 'client-fingerprint': clientFingerprint, alpn } = proxy;

    const vmessConfig = {
      v: '2',
      ps: name || '',
      add: server,
      port: port.toString(),
      id: uuid,
      aid: (alterId || 0).toString(),
      scy: cipher,
      net: network || 'tcp',
      type: 'none',
      host: '',
      path: '',
      tls: tls ? 'tls' : ''
    };

    if (wsOpts) {
      vmessConfig.host = wsOpts.headers?.Host || '';
      vmessConfig.path = wsOpts.path || '';
    }

    if (grpcOpts?.['grpc-service-name']) {
      vmessConfig.path = grpcOpts['grpc-service-name'];
      vmessConfig.type = 'grpc';
    }

    if (servername) {
      vmessConfig.sni = servername;
    }

    if (fingerprint) vmessConfig.fp = fingerprint;
    if (clientFingerprint) vmessConfig.fp = clientFingerprint;
    if (alpn) vmessConfig.alpn = alpn;

    const jsonStr = JSON.stringify(vmessConfig);
    const base64Str = Buffer.from(jsonStr).toString('base64');
    return `vmess://${base64Str}`;
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
    // 1. name = vmess, server, port, uuid, alterId, cipher
    // 2. name = vmess, server, port, uuid=xxx, alterId=0, cipher=auto

    const uuid = keyValuePairs['uuid'] || params[3];
    const alterId = keyValuePairs['alterId'] || params[4] || '0';
    const cipher = keyValuePairs['cipher'] || params[5] || 'auto';

    if (!uuid) {
      return null;
    }

    const proxyConfig = {
      name,
      server,
      port: parseInt(port),
      uuid,
      alterId: parseInt(alterId),
      cipher,
      network: 'tcp'
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
      uuid: parts[4],
      alterId: parts[5] || '0',
      cipher: parts[6] || 'auto'
    };

    if (!proxyConfig.server || !proxyConfig.port || !proxyConfig.uuid) {
      return null;
    }

    return this.convertFromClash(proxyConfig);
  }
}

module.exports = VMessProtocol;