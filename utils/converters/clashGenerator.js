/**
 * 简化的 YAML 生成器，专门用于 Clash 配置
 */

/**
 * 生成 Clash 配置文件
 * @param {Array} proxies 代理节点数组
 * @returns {string} Clash 配置文件内容
 */
function generateConfig(proxies) {
  const proxyNames = proxies.map(proxy => proxy.name);

  return `# Clash 配置文件 - Subscribe-Manager 自动生成
# 生成时间: ${new Date().toISOString()}

global-ua: clash
mode: rule
mixed-port: 7890
allow-lan: true
external-controller: "0.0.0.0:9090"

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
  - RULE-SET,reject_non_ip,REJECT
  - RULE-SET,reject_domainset,REJECT
  - RULE-SET,reject_extra_domainset,REJECT
  - RULE-SET,reject_non_ip_drop,REJECT-DROP
  - RULE-SET,reject_non_ip_no_drop,REJECT
  - RULE-SET,speedtest,Speedtest
  - RULE-SET,telegram_non_ip,Telegram
  - RULE-SET,apple_cdn,DIRECT
  - RULE-SET,apple_cn_non_ip,DIRECT
  - RULE-SET,microsoft_cdn_non_ip,DIRECT
  - RULE-SET,apple_services,苹果服务
  - RULE-SET,microsoft_non_ip,微软服务
  - RULE-SET,download_domainset,CDN服务
  - RULE-SET,download_non_ip,CDN服务
  - RULE-SET,cdn_domainset,CDN服务
  - RULE-SET,cdn_non_ip,CDN服务
  - RULE-SET,stream_non_ip,媒体服务
  - RULE-SET,ai_non_ip,AI服务
  - RULE-SET,global_non_ip,节点选择
  - RULE-SET,domestic_non_ip,DIRECT
  - RULE-SET,direct_non_ip,DIRECT
  - RULE-SET,lan_non_ip,DIRECT
  - GEOSITE,CN,DIRECT
  - RULE-SET,reject_ip,REJECT
  - RULE-SET,telegram_ip,Telegram
  - RULE-SET,stream_ip,媒体服务
  - RULE-SET,lan_ip,DIRECT
  - RULE-SET,domestic_ip,DIRECT
  - RULE-SET,china_ip,DIRECT
  - GEOIP,LAN,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,节点选择

rule-providers:
  reject_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/reject.txt
    path: ./rule_set/sukkaw_ruleset/reject_non_ip.txt
    interval: 43200
  reject_domainset:
    type: http
    url: https://ruleset.skk.moe/Clash/domainset/reject.txt
    path: ./rule_set/sukkaw_ruleset/reject_domainset.txt
    interval: 43200
  reject_extra_domainset:
    type: http
    url: https://ruleset.skk.moe/Clash/domainset/reject_extra.txt
    path: ./rule_set/sukkaw_ruleset/reject_domainset_extra.txt
    interval: 43200
  reject_non_ip_drop:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/reject-drop.txt
    path: ./rule_set/sukkaw_ruleset/reject_non_ip_drop.txt
    interval: 43200
  reject_non_ip_no_drop:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/reject-no-drop.txt
    path: ./rule_set/sukkaw_ruleset/reject_non_ip_no_drop.txt
    interval: 43200
  speedtest:
    type: http
    url: https://ruleset.skk.moe/Clash/domainset/speedtest.txt
    path: ./rule_set/sukkaw_ruleset/speedtest.txt
    interval: 43200
  telegram_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/telegram.txt
    path: ./rule_set/sukkaw_ruleset/telegram_non_ip.txt
    interval: 43200
  apple_cdn:
    type: http
    url: https://ruleset.skk.moe/Clash/domainset/apple_cdn.txt
    path: ./rule_set/sukkaw_ruleset/apple_cdn.txt
    interval: 43200
  apple_cn_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/apple_cn.txt
    path: ./rule_set/sukkaw_ruleset/apple_cn_non_ip.txt
    interval: 43200
  microsoft_cdn_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/microsoft_cdn.txt
    path: ./rule_set/sukkaw_ruleset/microsoft_cdn_non_ip.txt
    interval: 43200
  apple_services:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/apple_services.txt
    path: ./rule_set/sukkaw_ruleset/apple_services.txt
    interval: 43200
  microsoft_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/microsoft.txt
    path: ./rule_set/sukkaw_ruleset/microsoft_non_ip.txt
    interval: 43200
  download_domainset:
    type: http
    url: https://ruleset.skk.moe/Clash/domainset/download.txt
    path: ./rule_set/sukkaw_ruleset/download_domainset.txt
    interval: 43200
  download_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/download.txt
    path: ./rule_set/sukkaw_ruleset/download_non_ip.txt
    interval: 43200
  cdn_domainset:
    type: http
    url: https://ruleset.skk.moe/Clash/domainset/cdn.txt
    path: ./rule_set/sukkaw_ruleset/cdn_domainset.txt
    interval: 43200
  cdn_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/cdn.txt
    path: ./rule_set/sukkaw_ruleset/cdn_non_ip.txt
    interval: 43200
  stream_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/stream.txt
    path: ./rule_set/sukkaw_ruleset/stream_non_ip.txt
    interval: 43200
  stream_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/ip/stream.txt
    path: ./rule_set/sukkaw_ruleset/stream_ip.txt
    interval: 43200
  ai_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/ai.txt
    path: ./rule_set/sukkaw_ruleset/ai_non_ip.txt
    interval: 43200
  telegram_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/ip/telegram.txt
    path: ./rule_set/sukkaw_ruleset/telegram_ip.txt
    interval: 43200
  lan_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/lan.txt
    path: ./rule_set/sukkaw_ruleset/lan_non_ip.txt
    interval: 43200
  lan_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/ip/lan.txt
    path: ./rule_set/sukkaw_ruleset/lan_ip.txt
    interval: 43200
  domestic_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/domestic.txt
    path: ./rule_set/sukkaw_ruleset/domestic_non_ip.txt
    interval: 43200
  domestic_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/ip/domestic.txt
    path: ./rule_set/sukkaw_ruleset/domestic_ip.txt
    interval: 43200
  china_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/ip/china_ip.txt
    path: ./rule_set/sukkaw_ruleset/china_ip.txt
    interval: 43200
  direct_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/direct.txt
    path: ./rule_set/sukkaw_ruleset/direct_non_ip.txt
    interval: 43200
  global_non_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/non_ip/global.txt
    path: ./rule_set/sukkaw_ruleset/global_non_ip.txt
    interval: 43200
  reject_ip:
    type: http
    url: https://ruleset.skk.moe/Clash/ip/reject.txt
    path: ./rule_set/sukkaw_ruleset/reject_ip.txt
    interval: 43200
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
        config += `    fingerprint: ${proxy.fingerprint}\n`;
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
        config += `    fingerprint: ${proxy.fingerprint}\n`;
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
        config += `    fingerprint: ${proxy.fingerprint}\n`;
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
 * @returns {string} 空的 Clash 配置文件
 */
function generateEmptyConfig() {
  return generateConfig([]);
}

module.exports = {
  generateConfig,
  generateEmptyConfig,
  generateProxyConfig
};