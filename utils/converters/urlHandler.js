/**
 * URL 处理工具 - 统一处理订阅和 Subconvert 相关的 URL 逻辑
 */

/**
 * 检查 URL 是否为本地地址
 * @param {string|URL} url URL 对象或字符串
 * @returns {boolean} 是否为本地地址
 */
function isLocalUrl(url) {
  if (!url) return false;

  try {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const hostname = urlObj.hostname.toLowerCase();
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname === '[::1]';
  } catch (e) {
    return false;
  }
}

/**
 * 从 Subconvert URL 中提取外部订阅源 URL
 * @param {string} subconvertUrl Subconvert URL
 * @returns {string|null} 外部订阅源 URL，如果没有则返回 null
 */
function extractExternalUrl(subconvertUrl) {
  if (!subconvertUrl) return null;

  try {
    const urlObj = new URL(subconvertUrl);
    return urlObj.searchParams.get('url');
  } catch (e) {
    return null;
  }
}

/**
 * 检查 Subconvert URL 是否包含外部订阅源
 * @param {string} subconvertUrl Subconvert URL
 * @returns {boolean} 是否包含外部订阅源
 */
function hasExternalUrl(subconvertUrl) {
  return extractExternalUrl(subconvertUrl) !== null;
}

/**
 * 构建用于 Subconvert API 的目标 URL
 * @param {string} subscriptionUrl 当前订阅 URL
 * @param {string} subconvertUrl Subconvert URL
 * @returns {string} Subconvert 使用的目标 URL
 */
function buildSubconvertTargetUrl(subscriptionUrl, subconvertUrl) {
  // 如果 Subconvert URL 配置了外部订阅源，直接使用
  const externalUrl = extractExternalUrl(subconvertUrl);
  if (externalUrl) {
    return externalUrl;
  }

  // 如果没有订阅 URL，返回 null
  if (!subscriptionUrl) return null;

  // 如果是 data: URL（Base64 编码的内容），直接返回
  if (subscriptionUrl.startsWith('data:')) {
    return subscriptionUrl;
  }

  // 否则，从当前订阅 URL 移除格式后缀
  try {
    const urlObj = new URL(subscriptionUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // 提取订阅路径部分，移除 /clash, /surge 等后缀
    if (pathParts.length >= 1) {
      const subscriptionPath = pathParts[0];
      return `${urlObj.origin}/${subscriptionPath}`;
    }

    return subscriptionUrl;
  } catch (e) {
    return subscriptionUrl;
  }
}

/**
 * 判断应该使用 Subconvert 还是本地转换
 * @param {string} subscriptionUrl 订阅 URL
 * @param {string} subconvertUrl Subconvert URL
 * @param {string} targetFormat 目标格式
 * @param {boolean} hasCustomTemplate 是否有自定义模板
 * @returns {Object} { useSubconvert: boolean, reason: string }
 */
function determineConversionStrategy(subscriptionUrl, subconvertUrl, targetFormat, hasCustomTemplate = false) {
  // Subconvert API 不支持 surge 和 shadowsocks 格式
  if (targetFormat === 'surge' || targetFormat === 'shadowsocks') {
    return {
      useSubconvert: false,
      reason: 'Subconvert API does not support this format'
    };
  }

  // 如果没有配置 Subconvert URL，使用本地转换（默认模板）
  if (!subconvertUrl || !subconvertUrl.trim()) {
    return {
      useSubconvert: false,
      reason: 'No Subconvert URL configured, using local default template'
    };
  }

  // 如果配置了 Subconvert URL，使用 Subconvert API
  return {
    useSubconvert: true,
    reason: 'Using Subconvert API'
  };
}

/**
 * 构建完整的 Subconvert API URL
 * @param {string} subconvertUrl Subconvert URL
 * @param {string} subscriptionUrl 订阅 URL
 * @param {string} targetFormat 目标格式
 * @param {string} customTemplateUrl 自定义模板 URL（可选）
 * @param {string} directUrl 直接使用的 URL（可选，如果提供则忽略 subscriptionUrl）
 * @returns {string} 完整的 Subconvert API URL
 */
function buildSubconvertApiUrl(subconvertUrl, subscriptionUrl, targetFormat, customTemplateUrl = null, directUrl = null) {
  const urlObj = new URL(subconvertUrl);

  // 提取 base URL（保留路径，如果路径为 / 则默认使用 /sub）
  let basePath = urlObj.pathname;
  if (basePath === '/' || basePath === '') {
    basePath = '/sub';
  }
  const baseUrl = urlObj.origin + basePath;

  // 构建请求参数 - 保留原有参数，但允许覆盖
  const params = new URLSearchParams(urlObj.search);
  const requestParams = new URLSearchParams();

  // 设置基本参数
  requestParams.set('target', params.get('target') || targetFormat);

  // 设置 URL 参数
  const externalUrl = extractExternalUrl(subconvertUrl);
  if (externalUrl) {
    // 优先使用 Subconvert URL 中的外部订阅源
    requestParams.set('url', externalUrl);
  } else if (directUrl) {
    // 如果提供了直接 URL，使用它
    requestParams.set('url', directUrl);
  } else if (subscriptionUrl) {
    // 否则构建默认 Clash 订阅链接
    // 移除格式后缀，添加 /clash
    try {
      const urlObj = new URL(subscriptionUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 1) {
        const subscriptionPath = pathParts[0];
        const clashUrl = `${urlObj.origin}/${subscriptionPath}/clash`;
        requestParams.set('url', clashUrl);
      } else {
        // 如果路径不符合预期，使用原始 URL
        requestParams.set('url', subscriptionUrl);
      }
    } catch (e) {
      // URL 解析失败，使用原始 subscriptionUrl
      if (subscriptionUrl) {
        requestParams.set('url', subscriptionUrl);
      }
    }
  }

  // 设置其他参数
  const paramDefaults = {
    insert: 'false',
    emoji: 'true',
    list: 'false',
    udp: 'false',
    tfo: 'false',
    scv: 'false',
    fdn: 'false',
    sort: 'false',
    new_name: 'true',
    append_type: 'false',
    expand: 'true',
    'xudp': 'false'
  };

  for (const [key, defaultValue] of Object.entries(paramDefaults)) {
    requestParams.set(key, params.get(key) || defaultValue);
  }

  // 设置 config 参数：优先使用自定义模板 URL，否则使用原 config
  if (customTemplateUrl) {
    requestParams.set('config', customTemplateUrl);
  } else if (params.get('config')) {
    requestParams.set('config', params.get('config'));
  } else {
    requestParams.set('config', '');
  }

  return `${baseUrl}?${requestParams.toString()}`;
}

module.exports = {
  isLocalUrl,
  extractExternalUrl,
  hasExternalUrl,
  buildSubconvertTargetUrl,
  determineConversionStrategy,
  buildSubconvertApiUrl
};
