const { getDB } = require('./database');
const crypto = require('crypto');
// 生成安全的会话令牌
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 安全Base64解码
function safeBase64Decode(str) {
  try {
    const buffer = Buffer.from(str, 'base64');
    return buffer.toString('utf-8');
  } catch (e) {
    return str;
  }
}

// 安全Base64编码
function safeBase64Encode(str) {
  const buffer = Buffer.from(str);
  return buffer.toString('base64');
}

// 验证订阅路径
function validateSubscriptionPath(path) {
  return /^[a-z0-9-]{5,50}$/.test(path);
}
// 生成空的 Clash 配置
function generateEmptyClashConfig() {
  return generateClashConfig([]);
}

// 生成 Clash 配置文件
function generateClashConfig(proxies) {
  const proxyNames = proxies.map(proxy => proxy.name);

  const config = {
    // 用于下载订阅时指定UA
    'global-ua': 'clash',

    // 全局配置
    mode: 'rule',
    'mixed-port': 7890,
    'allow-lan': true,

    // 控制面板
    'external-controller': '0.0.0.0:9090',


    // 如果有代理节点，则包含代理节点配置
    proxies: proxies.length > 0 ? proxies : [],

    // 策略组
    'proxy-groups': [
      {
        name: '节点选择',
        type: 'select',
        proxies: ['DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png'
      },
      {
        name: '媒体服务',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png'
      },
      {
        name: '微软服务',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png'
      },
      {
        name: '苹果服务',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png'
      },
      {
        name: 'CDN服务',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png'
      },
      {
        name: 'AI服务',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png'
      },
      {
        name: 'Telegram',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png'
      },
      {
        name: 'Speedtest',
        type: 'select',
        proxies: ['节点选择', 'DIRECT'].concat(proxyNames),
        icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Speedtest.png'
      },
    ],

    // 分流规则
    rules: [
      'RULE-SET,reject_non_ip,REJECT',
      'RULE-SET,reject_domainset,REJECT',
      'RULE-SET,reject_extra_domainset,REJECT',
      'RULE-SET,reject_non_ip_drop,REJECT-DROP',
      'RULE-SET,reject_non_ip_no_drop,REJECT',


      // 域名类规则
      'RULE-SET,speedtest,Speedtest',
      'RULE-SET,telegram_non_ip,Telegram',
      'RULE-SET,apple_cdn,DIRECT',
      'RULE-SET,apple_cn_non_ip,DIRECT',
      'RULE-SET,microsoft_cdn_non_ip,DIRECT',
      'RULE-SET,apple_services,苹果服务',
      'RULE-SET,microsoft_non_ip,微软服务',
      'RULE-SET,download_domainset,CDN服务',
      'RULE-SET,download_non_ip,CDN服务',
      'RULE-SET,cdn_domainset,CDN服务',
      'RULE-SET,cdn_non_ip,CDN服务',
      'RULE-SET,stream_non_ip,媒体服务',
      'RULE-SET,ai_non_ip,AI服务',
      'RULE-SET,global_non_ip,节点选择',
      'RULE-SET,domestic_non_ip,DIRECT',
      'RULE-SET,direct_non_ip,DIRECT',
      'RULE-SET,lan_non_ip,DIRECT',
      'GEOSITE,CN,DIRECT',

      // IP 类规则
      'RULE-SET,reject_ip,REJECT',
      'RULE-SET,telegram_ip,Telegram',
      'RULE-SET,stream_ip,媒体服务',
      'RULE-SET,lan_ip,DIRECT',
      'RULE-SET,domestic_ip,DIRECT',
      'RULE-SET,china_ip,DIRECT',
      'GEOIP,LAN,DIRECT',
      'GEOIP,CN,DIRECT',

      // 兜底规则
      'MATCH,节点选择'
    ],

    // 规则提供者
    'rule-providers': {
      reject_non_ip_no_drop: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/reject-no-drop.txt',
        path: './rule_set/sukkaw_ruleset/reject_non_ip_no_drop.txt'
      },
      reject_non_ip_drop: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/reject-drop.txt',
        path: './rule_set/sukkaw_ruleset/reject_non_ip_drop.txt'
      },
      reject_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/reject.txt',
        path: './rule_set/sukkaw_ruleset/reject_non_ip.txt'
      },
      reject_domainset: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/domainset/reject.txt',
        path: './rule_set/sukkaw_ruleset/reject_domainset.txt'
      },
      reject_extra_domainset: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/domainset/reject_extra.txt',
        path: './sukkaw_ruleset/reject_domainset_extra.txt'
      },
      reject_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/ip/reject.txt',
        path: './rule_set/sukkaw_ruleset/reject_ip.txt'
      },
      speedtest: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: 'Speedtest',
        url: 'https://ruleset.skk.moe/Clash/domainset/speedtest.txt',
        path: './rule_set/sukkaw_ruleset/speedtest.txt'
      },
      cdn_domainset: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/domainset/cdn.txt',
        path: './rule_set/sukkaw_ruleset/cdn_domainset.txt'
      },
      cdn_non_ip: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/cdn.txt',
        path: './rule_set/sukkaw_ruleset/cdn_non_ip.txt'
      },
      stream_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/stream.txt',
        path: './rule_set/sukkaw_ruleset/stream_non_ip.txt'
      },
      stream_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/ip/stream.txt',
        path: './rule_set/sukkaw_ruleset/stream_ip.txt'
      },
      ai_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/ai.txt',
        path: './rule_set/sukkaw_ruleset/ai_non_ip.txt'
      },
      telegram_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/telegram.txt',
        path: './rule_set/sukkaw_ruleset/telegram_non_ip.txt'
      },
      telegram_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/ip/telegram.txt',
        path: './rule_set/sukkaw_ruleset/telegram_ip.txt'
      },
      apple_cdn: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/domainset/apple_cdn.txt',
        path: './rule_set/sukkaw_ruleset/apple_cdn.txt'
      },
      apple_services: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/apple_services.txt',
        path: './rule_set/sukkaw_ruleset/apple_services.txt'
      },
      apple_cn_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/apple_cn.txt',
        path: './rule_set/sukkaw_ruleset/apple_cn_non_ip.txt'
      },
      microsoft_cdn_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/microsoft_cdn.txt',
        path: './rule_set/sukkaw_ruleset/microsoft_cdn_non_ip.txt'
      },
      microsoft_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/microsoft.txt',
        path: './rule_set/sukkaw_ruleset/microsoft_non_ip.txt'
      },
      download_domainset: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/domainset/download.txt',
        path: './rule_set/sukkaw_ruleset/download_domainset.txt'
      },
      download_non_ip: {
        type: 'http',
        behavior: 'domain',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/download.txt',
        path: './rule_set/sukkaw_ruleset/download_non_ip.txt'
      },
      lan_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/lan.txt',
        path: './rule_set/sukkaw_ruleset/lan_non_ip.txt'
      },
      lan_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/ip/lan.txt',
        path: './rule_set/sukkaw_ruleset/lan_ip.txt'
      },
      domestic_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/domestic.txt',
        path: './rule_set/sukkaw_ruleset/domestic_non_ip.txt'
      },
      direct_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/direct.txt',
        path: './rule_set/sukkaw_ruleset/direct_non_ip.txt'
      },
      global_non_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/non_ip/global.txt',
        path: './rule_set/sukkaw_ruleset/global_non_ip.txt'
      },
      domestic_ip: {
        type: 'http',
        behavior: 'classical',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/ip/domestic.txt',
        path: './rule_set/sukkaw_ruleset/domestic_ip.txt'
      },
      china_ip: {
        type: 'http',
        behavior: 'ipcidr',
        interval: 43200,
        format: 'text',
        proxy: '节点选择',
        url: 'https://ruleset.skk.moe/Clash/ip/china_ip.txt',
        path: './rule_set/sukkaw_ruleset/china_ip.txt'
      }
    }
  };

  return `# Clash 配置文件 - Subscribe-Manager 自动生成
# 生成时间: ${new Date().toISOString()}

${convertToYaml(config)}`;
}

// 简化的对象转 YAML 函数，针对 Clash 配置优化
function convertToYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    // 处理键名，只对真正需要的情况加引号
    let yamlKey = key;
    if (key.includes(' ') || key.includes('@') || key.includes('&') ||
      key.includes('*') || key.includes('?') || key.includes('>') ||
      key.includes('<') || key.includes('!') || key.includes('%') ||
      key.includes('^') || key.includes('`') || /^\d/.test(key) ||
      key === '' || /^(true|false|null|yes|no|on|off)$/i.test(key)) {
      yamlKey = `"${key.replace(/"/g, '\\"')}"`;
    }

    if (value === null || value === undefined) {
      yaml += `${spaces}${yamlKey}: null\n`;
    } else if (typeof value === 'boolean') {
      yaml += `${spaces}${yamlKey}: ${value}\n`;
    } else if (typeof value === 'number') {
      yaml += `${spaces}${yamlKey}: ${value}\n`;
    } else if (typeof value === 'string') {
      // 对字符串值更宽松的引号判断，主要针对真正会导致 YAML 解析问题的字符
      const needsQuotes = value.includes(':') || value.includes('#') ||
        value.includes('"') || value.includes('\n') ||
        value.includes('&') || value.includes('*') ||
        value.includes('[') || value.includes(']') ||
        value.includes('{') || value.includes('}') ||
        value.includes('@') || value.includes('`') ||
        /^\s/.test(value) || /\s$/.test(value) ||
        value === '' || /^(true|false|null|yes|no|on|off)$/i.test(value) ||
        (/^\d+$/.test(value) && value.length > 1) ||
        (/^\d+\.\d+$/.test(value) && value.length > 1);

      if (needsQuotes) {
        const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        yaml += `${spaces}${yamlKey}: "${escapedValue}"\n`;
      } else {
        yaml += `${spaces}${yamlKey}: ${value}\n`;
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        yaml += `${spaces}${yamlKey}: []\n`;
      } else {
        yaml += `${spaces}${yamlKey}:\n`;
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            yaml += `${spaces}  -\n`;
            const itemYaml = convertToYaml(item, 0);
            yaml += itemYaml.split('\n').map(line =>
              line.trim() ? `${spaces}    ${line}` : ''
            ).filter(line => line).join('\n') + '\n';
          } else if (typeof item === 'string') {
            // 对数组中的字符串项（如节点名称）更宽松的引号判断
            const needsQuotes = item.includes(':') || item.includes('#') ||
              item.includes('"') || item.includes('\n') ||
              item.includes('&') || item.includes('*') ||
              item.includes('[') || item.includes(']') ||
              item.includes('{') || item.includes('}') ||
              item.includes('@') || item.includes('`') ||
              /^\s/.test(item) || /\s$/.test(item) ||
              item === '' || /^(true|false|null|yes|no|on|off)$/i.test(item) ||
              (/^\d+$/.test(item) && item.length > 1) ||
              (/^\d+\.\d+$/.test(item) && item.length > 1);

            if (needsQuotes) {
              const escapedItem = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
              yaml += `${spaces}  - "${escapedItem}"\n`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      yaml += `${spaces}${yamlKey}:\n`;
      yaml += convertToYaml(value, indent + 1);
    }
  }

  return yaml;
}

// 解析SIP002格式
function parseSIP002Format(ssLink) {
  try {
    const [base, name = ''] = ssLink.split('#');
    if (!base.startsWith(NODE_TYPES.SS)) return null;

    const prefixRemoved = base.substring(5);
    const atIndex = prefixRemoved.indexOf('@');
    if (atIndex === -1) return null;

    const [server, port] = prefixRemoved.substring(atIndex + 1).split(':');
    if (!server || !port) return null;

    let method, password;
    const methodPassBase64 = prefixRemoved.substring(0, atIndex);
    try {
      [method, password] = safeBase64Decode(methodPassBase64).split(':');
    } catch {
      [method, password] = safeDecodeURIComponent(methodPassBase64).split(':');
    }

    if (!method || !password) return null;

    const nodeName = name ? decodeURIComponent(name) : '未命名节点';
    return `${nodeName} = ss, ${server}, ${port}, encrypt-method=${method}, password=${password}`;
  } catch {
    return null;
  }
}
// 安全的URL解码辅助函数
function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}


// 解析Vmess链接为Surge格式
function parseVmessLink(vmessLink) {
  if (!vmessLink.startsWith(NODE_TYPES.VMESS)) return null;

  try {
    const config = JSON.parse(safeBase64Decode(vmessLink.substring(8)));
    if (!config.add || !config.port || !config.id) return null;

    // 正确处理UTF-8编码的中文字符
    const name = config.ps ? safeUtf8Decode(config.ps) : '未命名节点';
    const configParts = [
      `${name} = vmess`,
      config.add,
      config.port,
      `username=${config.id}`,
      'vmess-aead=true',
      `tls=${config.tls === 'tls'}`,
      `sni=${config.add}`,
      'skip-cert-verify=true',
      'tfo=false'
    ];

    if (config.tls === 'tls' && config.alpn) {
      configParts.push(`alpn=${config.alpn.replace(/,/g, ':')}`);
    }

    if (config.net === 'ws') {
      configParts.push('ws=true');
      if (config.path) configParts.push(`ws-path=${config.path}`);
      configParts.push(`ws-headers=Host:${config.host || config.add}`);
    }

    return configParts.join(', ');
  } catch {
    return null;
  }
}

// 解析Trojan链接为Surge格式
function parseTrojanLink(trojanLink) {
  if (!trojanLink.startsWith(NODE_TYPES.TROJAN)) return null;

  try {
    const url = new URL(trojanLink);
    if (!url.hostname || !url.port || !url.username) return null;

    const params = new URLSearchParams(url.search);
    const nodeName = url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点';

    const configParts = [
      `${nodeName} = trojan`,
      url.hostname,
      url.port,
      `password=${url.username}`,
      'tls=true',
      `sni=${url.hostname}`,
      'skip-cert-verify=true',
      'tfo=false'
    ];

    const alpn = params.get('alpn');
    if (alpn) {
      configParts.push(`alpn=${safeDecodeURIComponent(alpn).replace(/,/g, ':')}`);
    }

    if (params.get('type') === 'ws') {
      configParts.push('ws=true');
      const path = params.get('path');
      if (path) {
        configParts.push(`ws-path=${safeDecodeURIComponent(path)}`);
      }
      const host = params.get('host');
      configParts.push(`ws-headers=Host:${host ? safeDecodeURIComponent(host) : url.hostname}`);
    }

    return configParts.join(', ');
  } catch {
    return null;
  }
}

// 解析SOCKS链接为Surge格式
function parseSocksLink(socksLink) {
  if (!socksLink.startsWith(NODE_TYPES.SOCKS)) return null;

  try {
    // 处理标准格式：socks://username:password@server:port#name
    // 或者 socks://base64encoded@server:port#name
    const url = new URL(socksLink);
    if (!url.hostname || !url.port) return null;

    // 提取节点名称
    const nodeName = url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点';

    // 处理认证信息
    let username = '', password = '';

    // 专门处理 socks://base64auth@server:port 这样的格式
    if (url.username) {
      // 首先对username进行URL解码
      let decodedUsername = safeDecodeURIComponent(url.username);

      // 特殊处理 dXNlcm5hbWUxMjM6cGFzc3dvcmQxMjM= 这样的Base64编码认证信息
      try {
        // 尝试Base64解码
        const decoded = safeBase64Decode(decodedUsername);
        if (decoded.includes(':')) {
          // 成功解码为 username:password 格式
          const parts = decoded.split(':');
          if (parts.length >= 2) {
            username = parts[0];
            password = parts[1];
          } else {
            username = decodedUsername;
          }
        } else {
          // 不是预期的格式，使用原始值
          username = decodedUsername;
          if (url.password) {
            password = safeDecodeURIComponent(url.password);
          }
        }
      } catch (e) {
        username = decodedUsername;
        if (url.password) {
          password = safeDecodeURIComponent(url.password);
        }
      }
    }

    // 构建Surge格式
    const configParts = [
      nodeName + " = socks5",
      url.hostname,
      url.port
    ];

    // 如果有用户名密码，添加到配置中
    if (username) configParts.push(username);
    if (password) configParts.push(password);

    return configParts.join(', ');
  } catch (error) {
    return null;
  }
}

// 解析 Hysteria2 链接为 Surge 格式
function parseHysteria2ToSurge(hysteria2Link) {
  if (!hysteria2Link.startsWith(NODE_TYPES.HYSTERIA2) && !hysteria2Link.startsWith(NODE_TYPES.HY2)) return null;

  try {
    const url = new URL(hysteria2Link);
    if (!url.hostname || !url.port) return null;

    const params = new URLSearchParams(url.search);
    const nodeName = url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点';
    const password = url.username || params.get('password') || '';

    // 构建 Surge 格式的 Hysteria2 配置
    const configParts = [
      `${nodeName} = hysteria2`,
      url.hostname,
      url.port,
      `password=${password}`
    ];

    // 添加可选参数
    const upMbps = params.get('upmbps') || params.get('up');
    const downMbps = params.get('downmbps') || params.get('down');
    if (upMbps) configParts.push(`up=${upMbps}`);
    if (downMbps) configParts.push(`down=${downMbps}`);

    const sni = params.get('sni');
    if (sni) configParts.push(`sni=${safeDecodeURIComponent(sni)}`);

    const alpn = params.get('alpn');
    if (alpn) configParts.push(`alpn=${alpn}`);

    const obfs = params.get('obfs');
    if (obfs) {
      configParts.push(`obfs=${safeDecodeURIComponent(obfs)}`);
      const obfsPassword = params.get('obfs-password');
      if (obfsPassword) {
        configParts.push(`obfs-password=${safeDecodeURIComponent(obfsPassword)}`);
      }
    }

    const cc = params.get('cc');
    if (cc) configParts.push(`cc=${cc}`);

    // 默认跳过证书验证
    configParts.push('skip-cert-verify=true');

    return configParts.join(', ');
  } catch (error) {
    return null;
  }
}

// 过滤掉snell节点的函数
function filterSnellNodes(content) {
  if (!content?.trim()) return '';

  return content
    .split(/\r?\n/)
    .filter(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return false;

      // 过滤掉snell节点
      return !trimmedLine.includes(NODE_TYPES.SNELL);
    })
    .join('\n');
}
// 解析 TUIC 链接为 Surge 格式
function parseTuicToSurge(tuicLink) {
  if (!tuicLink.startsWith(NODE_TYPES.TUIC)) return null;

  try {
    const url = new URL(tuicLink);
    if (!url.hostname || !url.port) return null;

    const params = new URLSearchParams(url.search);
    const nodeName = url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点';
    const uuid = url.username || params.get('uuid') || '';
    const password = url.password || params.get('password') || '';

    // 构建 Surge 格式的 TUIC 配置
    const configParts = [
      `${nodeName} = tuic`,
      url.hostname,
      url.port,
      `uuid=${uuid}`,
      `password=${password}`
    ];

    // TUIC 版本 - 如果没有指定版本，默认使用版本 5
    const version = params.get('version') || params.get('v') || '5';
    configParts.push(`version=${version}`);

    // SNI 配置 - 如果没有指定 SNI，使用服务器地址作为 SNI
    const sni = params.get('sni') || url.hostname;
    configParts.push(`sni=${safeDecodeURIComponent(sni)}`);

    const alpn = params.get('alpn');
    if (alpn) configParts.push(`alpn=${alpn}`);

    // 处理 allow_insecure 参数
    const allowInsecure = params.get('allow_insecure') || params.get('allowInsecure');
    if (allowInsecure === 'true' || allowInsecure === '1') {
      configParts.push('skip-cert-verify=true');
    } else {
      // 如果没有明确设置 allow_insecure，默认为 false
      configParts.push('skip-cert-verify=false');
    }

    const udpRelayMode = params.get('udp_relay_mode') || params.get('udp-relay-mode');
    if (udpRelayMode) configParts.push(`udp-relay-mode=${udpRelayMode}`);

    const cc = params.get('congestion_control') || params.get('congestion-control') || params.get('cc');
    if (cc) configParts.push(`congestion-control=${cc}`);

    const disableSni = params.get('disable_sni');
    if (disableSni === 'true' || disableSni === '1') {
      configParts.push('disable-sni=true');
    }

    const reduceRtt = params.get('reduce_rtt');
    if (reduceRtt === 'true' || reduceRtt === '1') {
      configParts.push('reduce-rtt=true');
    }

    return configParts.join(', ');
  } catch (error) {
    return null;
  }
}
// 将订阅内容转换为surge格式
function convertToSurge(content) {
  if (!content?.trim()) return '';

  const nodeParserMap = new Map([
    [NODE_TYPES.SS, parseSIP002Format],
    [NODE_TYPES.VMESS, parseVmessLink],
    [NODE_TYPES.TROJAN, parseTrojanLink],
    [NODE_TYPES.SOCKS, parseSocksLink],
    [NODE_TYPES.HYSTERIA2, parseHysteria2ToSurge],
    [NODE_TYPES.HY2, parseHysteria2ToSurge],
    [NODE_TYPES.TUIC, parseTuicToSurge]
  ]);

  return content
    .split(/\r?\n/)
    .map(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;

      if (trimmedLine.includes(NODE_TYPES.SNELL)) {
        return formatSnellConfig(trimmedLine);
      }

      if (trimmedLine.toLowerCase().startsWith(NODE_TYPES.VLESS)) {
        return null;
      }

      for (const [prefix, parser] of nodeParserMap.entries()) {
        if (trimmedLine.startsWith(prefix)) {
          return parser(trimmedLine);
        }
      }
      
      return null;
    })
    .filter(Boolean)
    .join('\n');
}
// 将订阅内容转换为 Clash 格式
function convertToClash(content) {
  if (!content?.trim()) {
    return generateEmptyClashConfig();
  }

  const nodes = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(parseNodeToClash)
    .filter(Boolean);

  return generateClashConfig(nodes);
}
// 解析 SS 节点为 Clash 格式
function parseSSToClash(ssLink) {
  try {
    const [base, name = ''] = ssLink.split('#');
    if (!base.startsWith(NODE_TYPES.SS)) return null;

    const prefixRemoved = base.substring(5);
    const atIndex = prefixRemoved.indexOf('@');
    if (atIndex === -1) return null;

    const [server, port] = prefixRemoved.substring(atIndex + 1).split(':');
    if (!server || !port) return null;

    let method, password;
    const methodPassBase64 = prefixRemoved.substring(0, atIndex);
    try {
      [method, password] = safeBase64Decode(methodPassBase64).split(':');
    } catch {
      [method, password] = safeDecodeURIComponent(methodPassBase64).split(':');
    }

    if (!method || !password) return null;

    return {
      name: name ? decodeURIComponent(name) : '未命名节点',
      type: 'ss',
      server: server,
      port: parseInt(port),
      cipher: method,
      password: password
    };
  } catch {
    return null;
  }
}

// 解析 VMess 节点为 Clash 格式
function parseVmessToClash(vmessLink) {
  if (!vmessLink.startsWith(NODE_TYPES.VMESS)) return null;

  try {
    const config = JSON.parse(safeBase64Decode(vmessLink.substring(8)));
    if (!config.add || !config.port || !config.id) return null;

    const node = {
      name: config.ps ? safeUtf8Decode(config.ps) : '未命名节点',
      type: 'vmess',
      server: config.add,
      port: parseInt(config.port),
      uuid: config.id,
      alterId: parseInt(config.aid) || 0,
      cipher: 'auto',
      tls: config.tls === 'tls'
    };

    // 添加网络类型配置
    if (config.net === 'ws') {
      node.network = 'ws';
      if (config.path) {
        node['ws-opts'] = {
          path: config.path,
          headers: {
            Host: config.host || config.add
          }
        };
      }
    } else if (config.net === 'grpc') {
      node.network = 'grpc';
      if (config.path) {
        node['grpc-opts'] = {
          'grpc-service-name': config.path
        };
      }
    }

    // TLS 配置
    if (config.tls === 'tls') {
      node['skip-cert-verify'] = true;
      if (config.sni) {
        node.servername = config.sni;
      }
    }

    return node;
  } catch {
    return null;
  }
}

// 解析 Trojan 节点为 Clash 格式
function parseTrojanToClash(trojanLink) {
  if (!trojanLink.startsWith(NODE_TYPES.TROJAN)) return null;

  try {
    const url = new URL(trojanLink);
    if (!url.hostname || !url.port || !url.username) return null;

    const params = new URLSearchParams(url.search);
    const node = {
      name: url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点',
      type: 'trojan',
      server: url.hostname,
      port: parseInt(url.port),
      password: url.username,
      'skip-cert-verify': true
    };

    // 添加网络类型配置
    if (params.get('type') === 'ws') {
      node.network = 'ws';
      const path = params.get('path');
      const host = params.get('host');
      if (path || host) {
        node['ws-opts'] = {};
        if (path) node['ws-opts'].path = safeDecodeURIComponent(path);
        if (host) {
          node['ws-opts'].headers = { Host: safeDecodeURIComponent(host) };
        }
      }
    } else if (params.get('type') === 'grpc') {
      node.network = 'grpc';
      const serviceName = params.get('serviceName') || params.get('path');
      if (serviceName) {
        node['grpc-opts'] = {
          'grpc-service-name': safeDecodeURIComponent(serviceName)
        };
      }
    }

    // SNI 配置
    const sni = params.get('sni');
    if (sni) {
      node.sni = safeDecodeURIComponent(sni);
    }

    return node;
  } catch {
    return null;
  }
}

// 解析 VLESS 节点为 Clash 格式
function parseVlessToClash(vlessLink) {
  if (!vlessLink.startsWith(NODE_TYPES.VLESS)) return null;

  try {
    const url = new URL(vlessLink);
    if (!url.hostname || !url.port || !url.username) return null;

    const params = new URLSearchParams(url.search);
    const node = {
      name: url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点',
      type: 'vless',
      server: url.hostname,
      port: parseInt(url.port),
      uuid: url.username,
      tls: params.get('security') === 'tls' || params.get('security') === 'reality',
      'client-fingerprint': 'chrome',
      tfo: false,
      'skip-cert-verify': false
    };

    // 添加 flow 参数
    const flow = params.get('flow');
    if (flow) {
      node.flow = flow;
    }
    // Reality 配置
    if (params.get('security') === 'reality') {
      const publicKey = params.get('pbk');
      const shortId = params.get('sid');
      if (publicKey || shortId) {
        node['reality-opts'] = {};
        if (publicKey) node['reality-opts']['public-key'] = publicKey;
        if (shortId) node['reality-opts']['short-id'] = shortId;
      }
    }

    // 添加网络类型配置
    const type = params.get('type');
    if (type === 'ws') {
      node.network = 'ws';
      const path = params.get('path');
      const host = params.get('host');
      if (path || host) {
        node['ws-opts'] = {};
        if (path) node['ws-opts'].path = safeDecodeURIComponent(path);
        if (host) {
          node['ws-opts'].headers = { Host: safeDecodeURIComponent(host) };
        }
      }
    } else if (type === 'grpc') {
      node.network = 'grpc';
      const serviceName = params.get('serviceName') || params.get('path');
      if (serviceName) {
        node['grpc-opts'] = {
          'grpc-service-name': safeDecodeURIComponent(serviceName)
        };
      }
    } else if (type === 'tcp') {
      node.network = 'tcp';
    } else {
      // 默认设置为 tcp
      node.network = 'tcp';
    }

    // SNI 配置
    const sni = params.get('sni');

    if (sni) {
      node.servername = safeDecodeURIComponent(sni);
    }

    return node;
  } catch {
    return null;
  }
}

// 解析 SOCKS 节点为 Clash 格式
function parseSocksToClash(socksLink) {
  if (!socksLink.startsWith(NODE_TYPES.SOCKS)) return null;

  try {
    const url = new URL(socksLink);
    if (!url.hostname || !url.port) return null;

    const node = {
      name: url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点',
      type: 'socks5',
      server: url.hostname,
      port: parseInt(url.port)
    };

    // 处理认证信息
    if (url.username) {
      let username = '', password = '';
      let decodedUsername = safeDecodeURIComponent(url.username);

      try {
        const decoded = safeBase64Decode(decodedUsername);
        if (decoded.includes(':')) {
          const parts = decoded.split(':');
          if (parts.length >= 2) {
            username = parts[0];
            password = parts[1];
          }
        } else {
          username = decodedUsername;
          if (url.password) {
            password = safeDecodeURIComponent(url.password);
          }
        }
      } catch (e) {
        username = decodedUsername;
        if (url.password) {
          password = safeDecodeURIComponent(url.password);
        }
      }

      if (username) node.username = username;
      if (password) node.password = password;
    }

    return node;
  } catch {
    return null;
  }
}
// 解析单个节点为 Clash 格式
function parseNodeToClash(nodeLink) {
  if (!nodeLink) return null;

  const lowerLink = nodeLink.toLowerCase();

  // 跳过 snell 节点，Clash 不支持
  if (nodeLink.includes(NODE_TYPES.SNELL)) {
    return null;
  }

  // 解析 SS 节点
  if (lowerLink.startsWith(NODE_TYPES.SS)) {
    return parseSSToClash(nodeLink);
  }

  // 解析 VMess 节点
  if (lowerLink.startsWith(NODE_TYPES.VMESS)) {
    return parseVmessToClash(nodeLink);
  }

  // 解析 Trojan 节点
  if (lowerLink.startsWith(NODE_TYPES.TROJAN)) {
    return parseTrojanToClash(nodeLink);
  }

  // 解析 VLESS 节点
  if (lowerLink.startsWith(NODE_TYPES.VLESS)) {
    return parseVlessToClash(nodeLink);
  }

  // 解析 SOCKS 节点
  if (lowerLink.startsWith(NODE_TYPES.SOCKS)) {
    return parseSocksToClash(nodeLink);
  }

  // 解析 Hysteria2 节点
  if (lowerLink.startsWith(NODE_TYPES.HYSTERIA2) || lowerLink.startsWith(NODE_TYPES.HY2)) {
    return parseHysteria2ToClash(nodeLink);
  }

  // 解析 TUIC 节点
  if (lowerLink.startsWith(NODE_TYPES.TUIC)) {
    return parseTuicToClash(nodeLink);
  }

  return null;
}


// 解析 TUIC 节点为 Clash 格式
function parseTuicToClash(tuicLink) {
  if (!tuicLink.startsWith(NODE_TYPES.TUIC)) return null;

  try {
    const url = new URL(tuicLink);
    if (!url.hostname || !url.port) return null;

    const params = new URLSearchParams(url.search);
    const node = {
      name: url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点',
      type: 'tuic',
      server: url.hostname,
      port: parseInt(url.port),
      uuid: url.username || params.get('uuid') || '',
      password: url.password || params.get('password') || '',
      'skip-cert-verify': true
    };

    // TUIC 版本
    const version = params.get('version') || params.get('v');
    if (version) {
      node.version = parseInt(version);
    }

    // SNI 配置
    const sni = params.get('sni');
    if (sni) {
      node.sni = safeDecodeURIComponent(sni);
    }

    // ALPN 配置
    const alpn = params.get('alpn');
    if (alpn) {
      node.alpn = alpn.split(',').map(s => s.trim());
    }

    // UDP Relay 模式
    const udpRelayMode = params.get('udp_relay_mode') || params.get('udp-relay-mode');
    if (udpRelayMode) {
      node['udp-relay-mode'] = udpRelayMode;
    }

    // 拥塞控制算法
    const cc = params.get('congestion_control') || params.get('cc');
    if (cc) {
      node['congestion-control'] = cc;
    }

    // 禁用 SNI
    const disableSni = params.get('disable_sni');
    if (disableSni === 'true' || disableSni === '1') {
      node['disable-sni'] = true;
    }

    // 减少 RTT
    const reduceRtt = params.get('reduce_rtt');
    if (reduceRtt === 'true' || reduceRtt === '1') {
      node['reduce-rtt'] = true;
    }

    return node;
  } catch {
    return null;
  }
}

// 解析 Hysteria2 节点为 Clash 格式
function parseHysteria2ToClash(hysteria2Link) {
  if (!hysteria2Link.startsWith(NODE_TYPES.HYSTERIA2)||!hysteria2Link.startsWith(NODE_TYPES.HY2)) return null;

  try {
    const url = new URL(hysteria2Link);
    if (!url.hostname || !url.port) return null;

    const params = new URLSearchParams(url.search);
    const node = {
      name: url.hash ? decodeURIComponent(url.hash.substring(1)) : '未命名节点',
      type: 'hysteria2',
      server: url.hostname,
      port: parseInt(url.port),
      password: url.username || params.get('password') || '',
      'skip-cert-verify': true
    };

    // 上传和下载速度配置
    const upMbps = params.get('upmbps') || params.get('up');
    const downMbps = params.get('downmbps') || params.get('down');
    if (upMbps) node.up = upMbps;
    if (downMbps) node.down = downMbps;

    // SNI 配置
    const sni = params.get('sni');
    if (sni) {
      node.sni = safeDecodeURIComponent(sni);
    }

    // ALPN 配置
    const alpn = params.get('alpn');
    if (alpn) {
      node.alpn = alpn.split(',').map(s => s.trim());
    }

    // 混淆配置
    const obfs = params.get('obfs');
    if (obfs) {
      node.obfs = safeDecodeURIComponent(obfs);
      const obfsPassword = params.get('obfs-password');
      if (obfsPassword) {
        node['obfs-password'] = safeDecodeURIComponent(obfsPassword);
      }
    }

    // 拥塞控制算法
    const cc = params.get('cc');
    if (cc) {
      node.cc = cc;
    }

    return node;
  } catch {
    return null;
  }
}
// 节点类型常量
const NODE_TYPES = {
  SS: 'ss://',
  VMESS: 'vmess://',
  TROJAN: 'trojan://',
  VLESS: 'vless://',
  SOCKS: 'socks://',
  SOCKS5: 'socks5://',
  HYSTERIA2: 'hysteria2://',
  HY2: 'hy2://',
  TUIC: 'tuic://',
  SNELL: 'snell,'
};

// 提取节点名称
function extractNodeName(nodeLink) {
  if (!nodeLink) return '未命名节点';

  // 处理snell节点
  if (nodeLink.includes(NODE_TYPES.SNELL)) {
    const name = nodeLink.split('=')[0].trim();
    return name || '未命名节点';
  }

  // 处理 VMess 链接
  if (nodeLink.toLowerCase().startsWith(NODE_TYPES.VMESS)) {
    try {
      const config = JSON.parse(safeBase64Decode(nodeLink.substring(8)));
      if (config.ps) {
        return config.ps;
      }
    } catch { }
    return '未命名节点';
  }

  // 处理其他使用哈希标记名称的链接类型
  const hashIndex = nodeLink.indexOf('#');
  if (hashIndex !== -1) {
    try {
      return decodeURIComponent(nodeLink.substring(hashIndex + 1));
    } catch {
      return nodeLink.substring(hashIndex + 1) || '未命名节点';
    }
  }
  return '未命名节点';
}

// 数据库查询
async function dbQuery(sql, params) {
  const db = getDB();
  return db.all(sql, params);
}

// 数据库执行
async function dbRun(sql, params) {
  const db = getDB();
  return db.run(sql, params);
}

// 事务处理
async function withTransaction(callback) {
  const db = getDB();
  await db.run('BEGIN TRANSACTION');
  try {
    await callback(db);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

module.exports = {
  withTransaction,
  safeBase64Decode,
  safeBase64Encode,
  validateSubscriptionPath,
  extractNodeName,
  NODE_TYPES,
  dbQuery,
  dbRun,
  generateSessionToken,
  convertToClash,
  convertToSurge,
  filterSnellNodes
};