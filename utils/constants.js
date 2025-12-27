// 项目常量定义

// 节点类型常量
const NODE_TYPES = {
  SS: 'ss://',
  VMESS: 'vmess://',
  VLESS: 'vless://',
  TROJAN: 'trojan://',
  HYTESE: 'hysteria://',
  HYTESE2: 'hysteria2://',
  TUIC: 'tuic://',
  SOCKS: 'socks://',
  SOCKS5: 'socks5://',
  SOCKS4: 'socks4://',
  HTTP: 'http://',
  HTTPS: 'https://',
  SNELL: 'snell://',
  WIREGUARD: 'wireguard://'
};

// 支持的格式类型
const SUPPORTED_FORMATS = {
  CLASH: 'clash',
  SURGE: 'surge',
  V2RAY: 'v2ray',
  DEFAULT: 'default'
};

// 数据库相关常量
const DB_CONSTANTS = {
  MAX_SUBSCRIPTION_NAME_LENGTH: 100,
  MAX_NODE_NAME_LENGTH: 200,
  MAX_ORIGINAL_LINK_LENGTH: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// 错误代码
const ERROR_CODES = {
  SUBSCRIPTION_NOT_FOUND: 'subscription.not_found',
  NODE_NOT_FOUND: 'node.not_found',
  INVALID_SUBSCRIPTION_PATH: 'subscription.invalid_path',
  INVALID_NODE_LINK: 'node.invalid_link',
  DUPLICATE_SUBSCRIPTION_PATH: 'subscription.duplicate_path'
};

module.exports = {
  NODE_TYPES,
  SUPPORTED_FORMATS,
  DB_CONSTANTS,
  ERROR_CODES
};