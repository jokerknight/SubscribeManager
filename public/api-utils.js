/**
 * 前端 API 工具 - 统一处理 API 请求和响应
 */

/**
 * 发送 API 请求
 * @param {string} url API URL
 * @param {Object} options 请求选项
 * @returns {Promise<Object>} 响应结果
 */
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }

  return result;
}

/**
 * GET 请求
 * @param {string} url API URL
 * @returns {Promise<Object>} 响应结果
 */
async function apiGet(url) {
  return apiRequest(url, { method: 'GET' });
}

/**
 * POST 请求
 * @param {string} url API URL
 * @param {Object} data 请求数据
 * @returns {Promise<Object>} 响应结果
 */
async function apiPost(url, data) {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * PUT 请求
 * @param {string} url API URL
 * @param {Object} data 请求数据
 * @returns {Promise<Object>} 响应结果
 */
async function apiPut(url, data) {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * DELETE 请求
 * @param {string} url API URL
 * @returns {Promise<Object>} 响应结果
 */
async function apiDelete(url) {
  return apiRequest(url, { method: 'DELETE' });
}

/**
 * 显示错误提示
 * @param {Error} error 错误对象
 */
function handleApiError(error) {
  const message = error.message || '发生错误';
  console.error('API Error:', error);
  showToast(message, 'danger');
  return message;
}

// 导出工具函数（全局使用）
if (typeof globalThis !== 'undefined') {
  globalThis.apiRequest = apiRequest;
  globalThis.apiGet = apiGet;
  globalThis.apiPost = apiPost;
  globalThis.apiPut = apiPut;
  globalThis.apiDelete = apiDelete;
  globalThis.handleApiError = handleApiError;
}
