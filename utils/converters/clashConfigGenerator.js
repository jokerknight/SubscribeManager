const https = require('https');
const { getProtocolFactory } = require('../../protocols/ProtocolFactory');

/**
 * 从 URL 加载模板内容
 * @param {string} templateUrl 模板 URL
 * @returns {Promise<string>} 模板内容
 */
async function loadTemplateFromUrl(templateUrl) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(templateUrl);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/yaml, application/x-yaml, */*',
          'User-Agent': 'Subscribe-Manager'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Template URL returned status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Failed to load template: ${error.message}`));
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Template load timeout'));
      });

      req.end();
    } catch (error) {
      reject(new Error(`Invalid template URL: ${error.message}`));
    }
  });
}

/**
 * 使用 Subconvert API 和自定义模板生成 Clash 配置
 * @param {string} subconvertUrl Subconvert URL
 * @param {string} templateUrl Clash 自定义模板 URL（可选）
 * @param {string} subscriptionUrl 当前订阅 URL（可选，用于构建 Subconvert 请求）
 * @returns {Promise<string>} 生成的 Clash 配置内容
 */
async function generateClashConfig(subconvertUrl, templateUrl = null, subscriptionUrl = null) {
  // subconvertUrl 现在是基础域名（如 https://subconvert.chenqinfeng.cn）
  // 或者包含路径的 URL（如 https://subconvert.chenqinfeng.cn/sub）
  // 直接使用这个 URL 作为 Subconvert API 请求的基础
  const urlObj = new URL(subconvertUrl);

  // 构建请求参数
  const requestParams = {
    target: 'clash',
    url: subscriptionUrl || '',
    config: templateUrl || '',
    insert: 'false',
    emoji: 'true',
    list: 'false',
    udp: 'false',
    tfo: 'false',
    scv: 'false',
    fdn: 'false',
    sort: 'false',
    new_name: 'false',
    append_type: 'false',
    expand: 'true',
    'xudp': 'false',
  };

  // 构建完整请求 URL
  const queryString = new URLSearchParams(requestParams).toString();
  const fullUrl = `${urlObj.origin}${urlObj.pathname}?${queryString}`;

  console.log('Subconvert request URL:', fullUrl);
  if (templateUrl) {
    console.log('Using custom template URL:', templateUrl);
  }

  // 调用 Subconvert API
  return new Promise((resolve, reject) => {
    try {
      const reqUrl = new URL(fullUrl);

      const options = {
        hostname: reqUrl.hostname,
        port: reqUrl.port || 443,
        path: reqUrl.pathname + reqUrl.search,
        method: 'GET',
        headers: {
          'Accept': 'text/yaml, text/plain, */*',
          'User-Agent': 'Subscribe-Manager'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('Subconvert API response length:', data.length);
            resolve(data);
          } else {
            console.error('Subconvert API response status:', res.statusCode);
            console.error('Subconvert API response content:', data.substring(0, 500));
            reject(new Error(`Subconvert API returned status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Subconvert API request failed: ${error.message}`));
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Subconvert API request timeout'));
      });

      req.end();
    } catch (error) {
      reject(new Error(`Subconvert API request error: ${error.message}`));
    }
  });
}

/**
 * 验证并加载模板内容（仅加载，不生成配置）
 * @param {string} templateUrl 模板 URL
 * @returns {Promise<{content: string, length: number}>} 模板内容和长度
 */
async function validateAndLoadTemplate(templateUrl) {
  const content = await loadTemplateFromUrl(templateUrl);
  return {
    content: content,
    length: content.length
  };
}

module.exports = {
  generateClashConfig,
  loadTemplateFromUrl,
  validateAndLoadTemplate
};
