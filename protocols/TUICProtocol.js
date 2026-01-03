const BaseProtocol = require('./BaseProtocol');
const { safeDecodeURIComponent } = require('../utils/helpers');

class TUICProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'tuic://',
      defaults: {
        name: '未命名节点',
        version: '5'
      },
      transformers: {
        name: (name) => name ? decodeURIComponent(name) : '未命名节点',
        port: (port) => parseInt(port),
        version: (version) => version || '5',
        skipCertVerify: (allowInsecure) => allowInsecure === 'true' || allowInsecure === '1',
        disableSni: (disable) => disable === 'true' || disable === '1',
        reduceRtt: (reduce) => reduce === 'true' || reduce === '1'
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
      uuid: url.username || params.get('uuid'),
      password: url.password || params.get('password'),
      version: params.get('version') || params.get('v'),
      sni: params.get('sni') || url.hostname,
      alpn: params.get('alpn'),
      allowInsecure: params.get('allow_insecure') || params.get('allowInsecure'),
      udpRelayMode: params.get('udp_relay_mode') || params.get('udp-relay-mode'),
      congestionControl: params.get('congestion_control') || params.get('congestion-control') || params.get('cc'),
      disableSni: params.get('disable_sni'),
      reduceRtt: params.get('reduce_rtt')
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
    if (format === 'universal' && node.server && node.port && node.uuid) {
      return this.convertFromClash(node);
    }

    if (format === 'surge') {
      const parts = [
        `${node.name} = tuic`,
        node.server,
        node.port,
        `uuid=${node.uuid}`,
        `password=${node.password}`,
        `version=${node.version}`,
        `sni=${safeDecodeURIComponent(node.sni)}`,
        `skip-cert-verify=${node.skipCertVerify}`
      ];

      if (node.alpn) parts.push(`alpn=${node.alpn}`);
      if (node.udpRelayMode) parts.push(`udp-relay-mode=${node.udpRelayMode}`);
      if (node.congestionControl) parts.push(`congestion-control=${node.congestionControl}`);
      if (node.disableSni) parts.push('disable-sni=true');
      if (node.reduceRtt) parts.push('reduce-rtt=true');

      return parts.join(', ');
    }

    if (format === 'clash') {
      const clashNode = {
        name: node.name,
        type: 'tuic',
        server: node.server,
        port: node.port,
        uuid: node.uuid,
        password: node.password,
        'skip-cert-verify': true
      };

      if (node.version) clashNode.version = parseInt(node.version);
      if (node.sni) clashNode.sni = safeDecodeURIComponent(node.sni);
      if (node.alpn) clashNode.alpn = node.alpn.split(',').map(s => s.trim());
      if (node.udpRelayMode) clashNode['udp-relay-mode'] = node.udpRelayMode;
      if (node.congestionControl) clashNode['congestion-control'] = node.congestionControl;
      if (node.disableSni) clashNode['disable-sni'] = true;
      if (node.reduceRtt) clashNode['reduce-rtt'] = true;

      return clashNode;
    }

    // TUIC 不支持 shadowsocks 格式
    return null;
  }

  /**
   * 从 Clash YAML 节点转换为通用格式链接
   * @param {Object} proxy Clash 节点对象
   * @returns {string|null} 通用格式字符串
   */
  convertFromClash(proxy) {
    const { name, server, port, uuid, password, sni, 'skip-cert-verify': skipCertVerify } = proxy;

    let params = new URLSearchParams();
    if (sni) params.set('sni', sni);
    if (skipCertVerify) params.set('allowInsecure', '1');

    const link = `tuic://${uuid}:${password}@${server}:${port}?${params.toString()}`;
    return name ? `${link}#${encodeURIComponent(name)}` : link;
  }
}

module.exports = TUICProtocol;