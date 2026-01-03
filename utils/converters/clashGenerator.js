/**
 * 简化的 YAML 生成器，专门用于 Clash 配置
 */

const https = require('https');

/**
 * 使用自定义模板生成 Clash 配置
 * @param {Array} proxies 代理节点数组
 * @param {string} template 模板内容
 * @returns {string} Clash 配置文件内容
 */
function generateConfigWithTemplate(proxies, template) {
  // 生成节点配置
  const proxyConfigs = proxies.map(proxy => generateProxyConfig(proxy));

  // 替换模板中的占位符
  let config = template.replace(/{{proxies}}/g, proxyConfigs.join('\n'));
  config = config.replace(/{{proxy_names}}/g, JSON.stringify(['DIRECT', ...proxies.map(p => p.name)]));
  config = config.replace(/{{proxy_names_comma}}/g, proxies.map(p => `"${p.name}"`).join(', '));

  return config;
}

/**
 * 生成 Clash 配置文件
 * @param {Array} proxies 代理节点数组
 * @param {string} customTemplate 自定义模板内容（可选）
 * @returns {Promise<string>} Clash 配置文件内容
 */
async function generateConfig(proxies, customTemplate = null) {
  // 如果有自定义模板，使用自定义模板
  if (customTemplate && customTemplate.trim()) {
    console.log('使用自定义模板生成 Clash 配置');
    return generateConfigWithTemplate(proxies, customTemplate);
  }

  // 直接使用默认模板
  return await generateDefaultConfig(proxies);
}

/**
 * 生成简单的 Clash 配置（用于传给 Subconvert API）
 * @param {Array} proxies 代理节点数组
 * @returns {string} Clash 配置文件内容
 */
function generateSimpleConfig(proxies) {
  const proxyNames = proxies.map(proxy => proxy.name);

  return `# Clash 配置文件 - Subscribe-Manager 自动生成
# 生成时间: ${new Date().toISOString()}

mode: rule
mixed-port: 7890
allow-lan: true
external-controller: "0.0.0.0:9090"
log-level: info
secret: ""

proxies:
${proxies.map(proxy => generateProxyConfig(proxy)).join('\n')}

proxy-groups:
  - name: 节点选择
    type: select
    proxies: [${['DIRECT', ...proxyNames].map(name => `"${name}"`).join(', ')}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png"
  - name: 媒体服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png"
  - name: 微软服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png"
  - name: 苹果服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png"
  - name: CDN服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png"
  - name: AI服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png"
  - name: Telegram
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png"
  - name: Speedtest
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
    icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Speedtest.png"

rules:
  - MATCH,节点选择
`;
}

/**
 * 生成完整的 Clash 配置（展开 rule-providers 为实际规则）
 * @param {Array} proxies 代理节点数组
 * @returns {Promise<string>} Clash 配置文件内容
 */
async function generateDefaultConfig(proxies) {
  const proxyNames = proxies.map(proxy => proxy.name);

  // 定义 rule-providers 和对应的策略
  const ruleProviders = [
    { name: 'reject_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/reject.txt', policy: 'REJECT' },
    { name: 'reject_domainset', url: 'https://ruleset.skk.moe/Clash/domainset/reject.txt', policy: 'REJECT' },
    { name: 'reject_extra_domainset', url: 'https://ruleset.skk.moe/Clash/domainset/reject_extra.txt', policy: 'REJECT' },
    { name: 'reject_non_ip_drop', url: 'https://ruleset.skk.moe/Clash/non_ip/reject-drop.txt', policy: 'REJECT-DROP' },
    { name: 'reject_non_ip_no_drop', url: 'https://ruleset.skk.moe/Clash/non_ip/reject-no-drop.txt', policy: 'REJECT' },
    { name: 'speedtest', url: 'https://ruleset.skk.moe/Clash/domainset/speedtest.txt', policy: 'Speedtest' },
    { name: 'telegram_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/telegram.txt', policy: 'Telegram' },
    { name: 'apple_cdn', url: 'https://ruleset.skk.moe/Clash/domainset/apple_cdn.txt', policy: 'DIRECT' },
    { name: 'apple_cn_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/apple_cn.txt', policy: 'DIRECT' },
    { name: 'microsoft_cdn_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/microsoft_cdn.txt', policy: 'DIRECT' },
    { name: 'apple_services', url: 'https://ruleset.skk.moe/Clash/non_ip/apple_services.txt', policy: '苹果服务' },
    { name: 'microsoft_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/microsoft.txt', policy: '微软服务' },
    { name: 'download_domainset', url: 'https://ruleset.skk.moe/Clash/domainset/download.txt', policy: 'CDN服务' },
    { name: 'download_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/download.txt', policy: 'CDN服务' },
    { name: 'cdn_domainset', url: 'https://ruleset.skk.moe/Clash/domainset/cdn.txt', policy: 'CDN服务' },
    { name: 'cdn_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/cdn.txt', policy: 'CDN服务' },
    { name: 'stream_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/stream.txt', policy: '媒体服务' },
    { name: 'ai_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/ai.txt', policy: 'AI服务' },
    { name: 'global_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/global.txt', policy: '节点选择' },
    { name: 'domestic_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/domestic.txt', policy: 'DIRECT' },
    { name: 'direct_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/direct.txt', policy: 'DIRECT' },
    { name: 'lan_non_ip', url: 'https://ruleset.skk.moe/Clash/non_ip/lan.txt', policy: 'DIRECT' },
    { name: 'reject_ip', url: 'https://ruleset.skk.moe/Clash/ip/reject.txt', policy: 'REJECT' },
    { name: 'telegram_ip', url: 'https://ruleset.skk.moe/Clash/ip/telegram.txt', policy: 'Telegram' },
    { name: 'stream_ip', url: 'https://ruleset.skk.moe/Clash/ip/stream.txt', policy: '媒体服务' },
    { name: 'lan_ip', url: 'https://ruleset.skk.moe/Clash/ip/lan.txt', policy: 'DIRECT' },
    { name: 'domestic_ip', url: 'https://ruleset.skk.moe/Clash/ip/domestic.txt', policy: 'DIRECT' },
    { name: 'china_ip', url: 'https://ruleset.skk.moe/Clash/ip/china_ip.txt', policy: 'DIRECT' },
  ];

  // 并行获取所有规则集
  console.log('[clashGenerator] 开始获取规则集，数量:', ruleProviders.length);
  const rulesetPromises = ruleProviders.map(async (provider) => {
    const content = await fetchRuleset(provider.url);
    const rules = parseRuleset(content, provider.policy);
    return { name: provider.name, rules };
  });

  const rulesets = await Promise.all(rulesetPromises);

  // 展开所有规则
  const expandedRules = [];
  for (const ruleset of rulesets) {
    expandedRules.push(...ruleset.rules);
    console.log(`[clashGenerator] 规则集 ${ruleset.name} 展开 ${ruleset.rules.length} 条规则`);
  }

  console.log(`[clashGenerator] 总共展开 ${expandedRules.length} 条规则`);

  // 添加固定的规则
  const staticRules = [
    '  - GEOSITE,CN,DIRECT',
    '  - GEOIP,LAN,DIRECT',
    '  - GEOIP,CN,DIRECT',
    '  - MATCH,节点选择'
  ];

  const allRules = [...expandedRules, ...staticRules];

  return `# Clash 配置文件 - Subscribe-Manager 自动生成
# 生成时间: ${new Date().toISOString()}
# 已展开 ${expandedRules.length} 条规则

mode: rule
mixed-port: 7890
allow-lan: true
external-controller: "0.0.0.0:9090"
log-level: info
secret: ""

proxies:
${proxies.map(proxy => generateProxyConfig(proxy)).join('\n')}

proxy-groups:
  - name: 节点选择
    type: select
    proxies: [${['DIRECT', ...proxyNames].map(name => `"${name}"`).join(', ')}]
  - name: 媒体服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
  - name: 微软服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
  - name: 苹果服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
  - name: CDN服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
  - name: AI服务
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
  - name: Telegram
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]
  - name: Speedtest
    type: select
    proxies: ["节点选择", "DIRECT"${proxyNames.length > 0 ? ', ' + proxyNames.map(name => `"${name}"`).join(', ') : ''}]

rules:
${allRules.join('\n')}
`;
}

/**
 * 生成单个代理节点的配置
 * @param {Object} proxy 代理节点对象
 * @returns {string} 节点配置字符串
 */
function generateProxyConfig(proxy) {
  let config = `  - name: "${proxy.name}"\n`;
  config += `    type: ${proxy.type}\n`;
  config += `    server: ${proxy.server}\n`;
  config += `    port: ${proxy.port}\n`;

  // 根据不同类型添加特定字段
  switch (proxy.type) {
    case 'ss':
      config += `    cipher: ${proxy.cipher}\n`;
      config += `    password: "${proxy.password}"\n`;
      break;
    case 'vless':
      config += `    uuid: ${proxy.uuid}\n`;
      config += `    cipher: ${proxy.cipher}\n`;
      config += `    network: ${proxy.network}\n`;
      if (proxy.tls) {
        config += `    tls: true\n`;
      }
      if (proxy.servername) {
        config += `    servername: ${proxy.servername}\n`;
      }
      if (proxy.flow) {
        config += `    flow: ${proxy.flow}\n`;
      }
      if (proxy.fingerprint) {
        config += `    client-fingerprint: ${proxy.fingerprint}\n`;
      }
      // 处理网络选项
      if (proxy['ws-opts']) {
        config += `    ws-opts:\n`;
        if (proxy['ws-opts'].path) {
          config += `      path: "${proxy['ws-opts'].path}"\n`;
        }
        if (proxy['ws-opts'].headers) {
          config += `      headers:\n`;
          if (proxy['ws-opts'].headers.Host) {
            config += `        Host: "${proxy['ws-opts'].headers.Host}"\n`;
          }
        }
        if (proxy['ws-opts']['max-early-data']) {
          config += `      max-early-data: ${proxy['ws-opts']['max-early-data']}\n`;
        }
        if (proxy['ws-opts']['early-data-header-name']) {
          config += `      early-data-header-name: "${proxy['ws-opts']['early-data-header-name']}"\n`;
        }
      }
      
      if (proxy['grpc-opts']) {
        config += `    grpc-opts:\n`;
        if (proxy['grpc-opts']['grpc-service-name']) {
          config += `      grpc-service-name: "${proxy['grpc-opts']['grpc-service-name']}"\n`;
        }
      }
      
      // 处理 Reality 特殊配置
      if (proxy['reality-opts']) {
        config += `    reality-opts:\n`;
        if (proxy['reality-opts'].sni) {
          config += `      sni: ${proxy['reality-opts'].sni}\n`;
        }
        if (proxy['reality-opts'].fingerprint) {
          config += `      fingerprint: ${proxy['reality-opts'].fingerprint}\n`;
        }
        if (proxy['reality-opts']['public-key']) {
          config += `      public-key: ${proxy['reality-opts']['public-key']}\n`;
        }
        if (proxy['reality-opts']['short-id']) {
          config += `      short-id: ${proxy['reality-opts']['short-id']}\n`;
        }
      }
      // 处理 client-fingerprint
      if (proxy['client-fingerprint']) {
        config += `    client-fingerprint: ${proxy['client-fingerprint']}\n`;
      }
      break;
    case 'vmess':
      config += `    uuid: ${proxy.uuid}\n`;
      config += `    cipher: ${proxy.cipher}\n`;
      if (proxy.alterId !== undefined) {
        config += `    alterId: ${proxy.alterId}\n`;
      }
      if (proxy.security) {
        config += `    security: ${proxy.security}\n`;
      }
      if (proxy.network) {
        config += `    network: ${proxy.network}\n`;
      }
      if (proxy.tls) {
        config += `    tls: true\n`;
      }
      if (proxy.servername) {
        config += `    servername: ${proxy.servername}\n`;
      }
      if (proxy.fingerprint) {
        config += `    client-fingerprint: ${proxy.fingerprint}\n`;
      }
      // VMess 网络选项
      if (proxy['ws-opts']) {
        config += `    ws-opts:\n`;
        if (proxy['ws-opts'].path) {
          config += `      path: "${proxy['ws-opts'].path}"\n`;
        }
        if (proxy['ws-opts'].headers) {
          config += `      headers:\n`;
          if (proxy['ws-opts'].headers.Host) {
            config += `        Host: "${proxy['ws-opts'].headers.Host}"\n`;
          }
        }
      }
      if (proxy['grpc-opts']) {
        config += `    grpc-opts:\n`;
        if (proxy['grpc-opts']['grpc-service-name']) {
          config += `      grpc-service-name: "${proxy['grpc-opts']['grpc-service-name']}"\n`;
        }
      }
      break;
    case 'trojan':
      config += `    password: ${proxy.password}\n`;
      if (proxy.network) {
        config += `    network: ${proxy.network}\n`;
      }
      // Trojan TLS 配置
      config += `    tls: true\n`;
      if (proxy.sni) {
        config += `    servername: ${proxy.sni}\n`;
      }
      if (proxy.fingerprint) {
        config += `    client-fingerprint: ${proxy.fingerprint}\n`;
      }
      if (proxy.alpn) {
        config += `    alpn: ${proxy.alpn}\n`;
      }
      if (proxy['skip-cert-verify']) {
        config += `    skip-cert-verify: ${proxy['skip-cert-verify']}\n`;
      }
      // Trojan 网络选项
      if (proxy['ws-opts']) {
        config += `    ws-opts:\n`;
        if (proxy['ws-opts'].path) {
          config += `      path: "${proxy['ws-opts'].path}"\n`;
        }
        if (proxy['ws-opts'].headers) {
          config += `      headers:\n`;
          if (proxy['ws-opts'].headers.Host) {
            config += `        Host: "${proxy['ws-opts'].headers.Host}"\n`;
          }
        }
        if (proxy['ws-opts']['max-early-data']) {
          config += `      max-early-data: ${proxy['ws-opts']['max-early-data']}\n`;
        }
        if (proxy['ws-opts']['early-data-header-name']) {
          config += `      early-data-header-name: "${proxy['ws-opts']['early-data-header-name']}"\n`;
        }
      }
      if (proxy['grpc-opts']) {
        config += `    grpc-opts:\n`;
        if (proxy['grpc-opts']['grpc-service-name']) {
          config += `      grpc-service-name: "${proxy['grpc-opts']['grpc-service-name']}"\n`;
        }
      }
      break;
    case 'hysteria2':
      config += `    password: ${proxy.password}\n`;
      if (proxy.sni) {
        config += `    sni: ${proxy.sni}\n`;
      }
      if (proxy.obfs) {
        config += `    obfs: ${proxy.obfs}\n`;
      }
      if (proxy['obfs-password']) {
        config += `    obfs-password: "${proxy['obfs-password']}"\n`;
      }
      if (proxy['skip-cert-verify'] !== undefined) {
        config += `    skip-cert-verify: ${proxy['skip-cert-verify']}\n`;
      } else {
        config += `    skip-cert-verify: true\n`;
      }
      break;
    case 'socks':
      config += `    version: 5\n`;
      if (proxy.username) {
        config += `    username: ${proxy.username}\n`;
      }
      if (proxy.password) {
        config += `    password: ${proxy.password}\n`;
      }
      if (proxy.tls) {
        config += `    tls: true\n`;
      }
      if (proxy.skipCertVerify) {
        config += `    skip-cert-verify: true\n`;
      }
      if (proxy.sni) {
        config += `    servername: ${proxy.sni}\n`;
      }
      break;
    case 'tuic':
      config += `    uuid: ${proxy.uuid}\n`;
      config += `    password: ${proxy.password}\n`;
      if (proxy.congestionControl) {
        config += `    congestion-controller: ${proxy.congestionControl}\n`;
      }
      if (proxy.udpRelay !== undefined) {
        config += `    udp-relay: ${proxy.udpRelay}\n`;
      }
      if (proxy.alpn) {
        config += `    alpn: ${proxy.alpn}\n`;
      }
      if (proxy.sni) {
        config += `    sni: ${proxy.sni}\n`;
      }
      if (proxy['skip-cert-verify'] !== undefined) {
        config += `    skip-cert-verify: ${proxy['skip-cert-verify']}\n`;
      } else {
        config += `    skip-cert-verify: true\n`;
      }
      if (proxy.reduceRtt) {
        config += `    reduce-rtt: true\n`;
      }
      break;
  }

  return config;
}

/**
 * 生成空的 Clash 配置
 * @param {string} customTemplate 自定义模板内容（可选）
 * @returns {Promise<string>} 空的 Clash 配置文件
 */
async function generateEmptyConfig(customTemplate = null) {
  return await generateConfig([], customTemplate);
}

/**
 * 从 URL 获取规则集内容
 * @param {string} url 规则集 URL
 * @returns {Promise<string>} 规则集内容
 */
async function fetchRuleset(url) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'clash'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            console.warn(`Failed to fetch ruleset from ${url}: status ${res.statusCode}`);
            resolve(''); // 失败时返回空字符串
          }
        });
      });

      req.on('error', (error) => {
        console.warn(`Failed to fetch ruleset from ${url}: ${error.message}`);
        resolve(''); // 失败时返回空字符串
      });

      req.setTimeout(10000, () => {
        req.destroy();
        console.warn(`Timeout fetching ruleset from ${url}`);
        resolve(''); // 超时返回空字符串
      });

      req.end();
    } catch (error) {
      console.warn(`Failed to fetch ruleset from ${url}: ${error.message}`);
      resolve('');
    }
  });
}

/**
 * 解析规则集内容并应用策略和目标
 * @param {string} content 规则集内容
 * @param {string} policy 策略名称（如 REJECT, DIRECT 等）
 * @returns {Array<string>} 规则数组
 */
function parseRuleset(content, policy) {
  if (!content || !content.trim()) return [];

  const rules = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // 规则格式: type,value
    // 或者: type,value,no-resolve
    const parts = trimmed.split(',');
    if (parts.length >= 2) {
      const type = parts[0].trim();
      const value = parts[1].trim();
      const noResolve = parts[2]?.trim() === 'no-resolve';

      // 构建规则
      let rule = `  - ${type},${value},${policy}`;
      if (noResolve) {
        rule += ',no-resolve';
      }
      rules.push(rule);
    }
  }

  return rules;
}

module.exports = {
  generateConfig,
  generateSimpleConfig,
  generateDefaultConfig,
  generateEmptyConfig,
  generateProxyConfig
};
