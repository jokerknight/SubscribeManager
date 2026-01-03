const crypto = require('crypto');

// 安全Base64解码
function safeBase64Decode(str) {
  try {

    // 处理 URL 安全的 Base64（用 - 和 _ 替换 + 和 /）
    let normalizedStr = str
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // 补全 padding（每4字符一组，不足的补 =）
    const padding = '='.repeat((4 - normalizedStr.length % 4) % 4);
    normalizedStr += padding;


    const buffer = Buffer.from(normalizedStr, 'base64');
    const result = buffer.toString('utf-8');
    return result;
  } catch (e) {
    return str;
  }
}

// 安全Base64编码
function safeBase64Encode(str) {
  const buffer = Buffer.from(str);
  return buffer.toString('base64');
}

// 安全的URL解码辅助函数
function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

// 安全的UTF-8解码
function safeUtf8Decode(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

// 生成安全的会话令牌
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 验证订阅路径
function validateSubscriptionPath(path) {
  return /^[a-z0-9-]{5,50}$/.test(path);
}

module.exports = {
  safeBase64Decode,
  safeBase64Encode,
  safeDecodeURIComponent,
  safeUtf8Decode,
  generateSessionToken,
  validateSubscriptionPath
};