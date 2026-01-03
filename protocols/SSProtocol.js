const BaseProtocol = require('./BaseProtocol');
const { safeBase64Decode, safeDecodeURIComponent } = require('../utils/helpers');

class SSProtocol extends BaseProtocol {
  constructor() {
    super({
      prefix: 'ss://',
      defaults: {
        name: '未命名节点'
      },
      transformers: {
        name: (name) => name ? decodeURIComponent(name) : '未命名节点',
        port: (port) => parseInt(port)
      }
    });
  }

  extractElements(nodeLink) {
    const [base, name] = nodeLink.split('#');
    const prefixRemoved = base.substring(5);

    // 格式1 (SIP002): ss://base64(method:password@server:port)#name
    // 格式2 (旧格式): ss://base64(method:password)@server:port#name

    // 先尝试解码整个 base64 部分
    try {
      const decoded = safeBase64Decode(prefixRemoved);

      // 检查解码后是否包含 @ (SIP002 格式)
      const decodedAtIndex = decoded.indexOf('@');
      if (decodedAtIndex !== -1) {
        const [authPart, serverPort] = decoded.split('@');

        // 处理 authPart，可能以 ss: 开头
        let method, password;
        if (authPart.startsWith('ss:')) {
          const parts = authPart.substring(3).split(':');
          method = parts[0];
          password = parts.slice(1).join(':'); // 密码可能包含冒号
        } else {
          const parts = authPart.split(':');
          method = parts[0];
          password = parts.slice(1).join(':');
        }

        const [server, port] = serverPort.split(':');
        if (method && password && server && port) {
          return { name, server, port, method, password };
        }
      }
    } catch {
      // base64 解码失败，继续尝试其他格式
    }

    // 尝试格式2: base64(method:password)@server:port
    const atIndex = prefixRemoved.indexOf('@');
    if (atIndex !== -1) {
      const [server, port] = prefixRemoved.substring(atIndex + 1).split(':');
      const methodPassBase64 = prefixRemoved.substring(0, atIndex);

      try {
        const decoded = safeBase64Decode(methodPassBase64);
        let method, password;
        if (decoded.startsWith('ss:')) {
          const parts = decoded.substring(3).split(':');
          method = parts[0];
          password = parts.slice(1).join(':');
        } else {
          const parts = decoded.split(':');
          method = parts[0];
          password = parts.slice(1).join(':');
        }

        if (method && password) {
          return { name, server, port, method, password };
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  /**
   * 将节点转换为指定目标格式
   * @param {Object} node 节点对象
   * @param {string} targetFormat 目标格式 ('surge', 'shadowsocks', 'clash', 'universal')
   * @returns {string|Object|null} 转换后的内容
   */
  convertToFormat(node, targetFormat) {
    const format = targetFormat.toLowerCase();

    // 如果 node 是从 Clash YAML 解析的（有 server/port 等 Clash 字段），使用 convertFromClash
    if (format === 'universal' && node.server && node.port && node.password) {
      return this.convertFromClash(node);
    }

    // Shadowsocks 协议支持 universal（原始 ss:// 链接）、surge、clash 三种格式
    if (format === 'shadowsocks' || format === 'universal') {
      // 返回原始 ss:// 链接
      const auth = Buffer.from(`${node.method}:${node.password}@${node.server}:${node.port}`).toString('base64');
      let link = `ss://${auth}`;
      if (node.name) {
        link += `#${encodeURIComponent(node.name)}`;
      }
      return link;
    }

    if (format === 'surge') {
      return `${node.name} = ss, ${node.server}, ${node.port}, encrypt-method=${node.method}, password=${node.password}`;
    }

    if (format === 'clash') {
      return {
        name: node.name,
        type: 'ss',
        server: node.server,
        port: node.port,
        cipher: node.method,
        password: node.password
      };
    }

    return null;
  }

  /**
   * 从 Clash YAML 节点转换为通用格式链接
   * @param {Object} proxy Clash 节点对象
   * @returns {string|null} 通用格式字符串
   */
  convertFromClash(proxy) {
    const { name, server, port, cipher = 'aes-256-gcm', password } = proxy;
    const auth = Buffer.from(`${cipher}:${password}@${server}:${port}`).toString('base64');
    let link = `ss://${auth}`;
    if (name) {
      link += `#${encodeURIComponent(name)}`;
    }
    return link;
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

    // 格式: name = ss, server, port, cipher, password
    // 或: name = ss, server, port, encrypt-method=xxx, password=xxx

    let cipher, password;

    // 检查是否包含键值对（有 = 号）
    const hasKeyValue = rest.some(item => item.includes('='));

    if (hasKeyValue) {
      const keyValuePairs = {};
      for (const item of rest) {
        const eqIndex = item.indexOf('=');
        if (eqIndex !== -1) {
          const key = item.substring(0, eqIndex).trim();
          const value = item.substring(eqIndex + 1).trim();
          if (key) {
            keyValuePairs[key] = value;
          }
        }
      }
      cipher = keyValuePairs['encrypt-method'] || keyValuePairs['cipher'];
      password = keyValuePairs['password'];
    } else {
      // 直接值格式: cipher, password
      if (rest.length >= 2) {
        cipher = rest[0];
        password = rest[1];
      } else {
        cipher = params[3];
        password = params[4];
      }
    }

    if (!cipher || !password) {
      return null;
    }

    const proxyConfig = {
      name,
      server,
      port: parseInt(port),
      cipher,
      password
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
      cipher: parts[4],
      password: parts[5]
    };

    if (!proxyConfig.server || !proxyConfig.port || !proxyConfig.cipher || !proxyConfig.password) {
      return null;
    }

    return this.convertFromClash(proxyConfig);
  }
}

module.exports = SSProtocol;