// ===== 统一入口文件 =====
// 拆分后的 utils.js 作为统一入口，导出所有必要的模块

// 导入重构后的模块 - 避免循环依赖
const databaseOps = require('./utils/database/operations');
const converters = require('./utils/converters/subscriptionConverter');
const validators = require('./utils/validators/nodeParser');
const helpers = require('./utils/helpers');
const constants = require('./utils/constants');

// 过滤掉snell节点的函数
function filterSnellNodes(content) {
  if (!content?.trim()) return '';

  return content
    .split(/\r?\n/)
    .filter(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return false;

      // 过滤掉snell节点
      return !trimmedLine.includes('snell://');
    })
    .join('\n');
}

// ===== 模块导出 =====

module.exports = {
  // 数据库操作
  ...databaseOps,
  
  // 工具函数
  ...helpers,
  
  // 节点验证和解析
  ...validators,
  
  // 节点过滤
  filterSnellNodes,
  
  // 统一转换接口
  ...converters,
  
  // 常量
  ...constants
};

