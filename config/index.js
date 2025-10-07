require('dotenv').config();
const path = require('path');

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',

  // Admin path
  adminPath: process.env.ADMIN_PATH || 'admin',

  // Database path
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/subscriptions.db'),

  // Credentials
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',

  // Language
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'zh-CN',
};

module.exports = config;