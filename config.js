// 首先加载环境变量
require('dotenv').config();

const path = require("path");

// 基础配置
const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  
  // 会话配置
  sessionSecret: process.env.SESSION_SECRET || "subscribe-manager-secret-key-change-in-production",
  
  // 路径配置
  adminPath: process.env.ADMIN_PATH || "admin",
  
  // 数据库配置
  databasePath: path.join(__dirname, "data", "subscriptions.db"),
  
  // 订阅配置
  defaultSubscriptionName: "默认订阅",
  
  // 管理员认证配置
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  
  // 安全配置
  corsOptions: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
};

module.exports = config;