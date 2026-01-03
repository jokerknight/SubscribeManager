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
   * 将节点转换为指定目标格式
   * @param {Object} node 节点信息
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    // 从 Clash YAML 转换为通用格式链接
    if (format === 'universal') {
      return this.convertFromClash(node);
    }

    if (format === 'clash') {
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
          clashNode['client-fingerprint'] = node.fingerprint;
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
          if (node.fingerprint) {
            clashNode['reality-opts'].fingerprint = node.fingerprint;
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

    // VLESS 不支持 surge 和 shadowsocks 格式
    return null;
  }

  /**
   * 从 Clash YAML 节点转换为通用格式链接
   * @param {Object} proxy Clash 节点对象
   * @returns {string|null} 通用格式字符串
   */
  convertFromClash(proxy) {
    const { name, server, port, uuid, cipher, encryption, network, tls, 'skip-cert-verify': skipCertVerify, servername, 'ws-opts': wsOpts, 'grpc-opts': grpcOpts, flow, fingerprint, 'client-fingerprint': clientFingerprint, 'reality-opts': realityOpts, udp, alpn, 'allowInsecure': allowInsecure } = proxy;

    let params = new URLSearchParams();
    params.set('type', network || 'tcp');
    params.set('encryption', encryption || cipher || 'none');

    // 处理 security 参数
    if (tls) {
      params.set('security', realityOpts ? 'reality' : 'tls');
    }

    // 处理网络路径
    if (wsOpts?.path) params.set('path', wsOpts.path);
    if (wsOpts?.headers?.Host) params.set('host', wsOpts.headers.Host);
    if (grpcOpts?.['grpc-service-name']) params.set('serviceName', grpcOpts['grpc-service-name']);

    // 处理 SNI
    if (servername) params.set('sni', servername);

    // 处理 Reality 特有参数
    if (realityOpts) {
      if (realityOpts['public-key']) params.set('pbk', realityOpts['public-key']);
      if (realityOpts['short-id']) params.set('sid', realityOpts['short-id']);
      if (realityOpts.fingerprint) params.set('fp', realityOpts.fingerprint);
    }

    // 处理 flow 参数
    if (flow) params.set('flow', flow);

    // 处理指纹参数
    if (clientFingerprint) params.set('fp', clientFingerprint);
    if (fingerprint && !realityOpts?.fingerprint) params.set('fp', fingerprint);

    // 处理 UDP 参数
    if (udp !== undefined) params.set('udp', udp.toString());

    // 处理 ALPN 参数
    if (alpn) params.set('alpn', Array.isArray(alpn) ? alpn.join(',') : alpn);

    // 处理证书验证
    if (skipCertVerify || allowInsecure) {
      params.set('allowInsecure', '1');
    }

    const link = `vless://${uuid}@${server}:${port}?${params.toString()}`;
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

    // 格式: name = vless, server, port, uuid=xxx, flow=xxx, sni=xxx
    const uuid = keyValuePairs['uuid'] || params[3];
    const flow = keyValuePairs['flow'];
    const sni = keyValuePairs['sni'] || keyValuePairs['sni-name'];
    const skipCertVerify = keyValuePairs['skip-cert-verify'];
    const pbk = keyValuePairs['pbk'];
    const sid = keyValuePairs['sid'];
    const fp = keyValuePairs['fp'];
    const encryption = keyValuePairs['encryption'];

    if (!uuid) {
      return null;
    }

    const proxyConfig = {
      name,
      server,
      port: parseInt(port),
      uuid,
      flow,
      network: 'tcp',
      sni,
      'skip-cert-verify': skipCertVerify === 'true',
      'reality-opts': pbk ? {
        'public-key': pbk,
        'short-id': sid,
        fingerprint: fp
      } : undefined,
      encryption
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
      uuid: parts[4]
    };

    if (!proxyConfig.server || !proxyConfig.port || !proxyConfig.uuid) {
      return null;
    }

    return this.convertFromClash(proxyConfig);
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