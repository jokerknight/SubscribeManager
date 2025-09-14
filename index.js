require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const app = express();
const routes = require('./routes');
const { initializeDatabase } = require('./database');

const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
// 中间件配置
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 确保数据目录存在
function ensureDataDirectory() {
  const dbPath = process.env.DB_PATH || './data/subscriptions.db';
  const dataDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`创建数据目录: ${dataDir}`);
  }
  
  return dbPath;
}

// 启动应用
async function startApp() {
  try {
    // 确保数据目录存在
    const dbPath = ensureDataDirectory();
    console.log(`数据库路径: ${dbPath}`);
    
    // 初始化数据库
    await initializeDatabase();
    
    // 路由处理
    app.use('/', routes);
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`管理面板路径: /${process.env.ADMIN_PATH || 'admin'}`);
      
      // 如果是生产环境，添加安全提示
      if (process.env.NODE_ENV === 'production') {
        console.log('\x1b[33m%s\x1b[0m', '安全提示: 确保已配置 HTTPS 和适当的防火墙规则');
      }
    });
  } catch (error) {
    console.error('应用启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
startApp();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n收到终止信号，正在关闭应用...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭应用...');
  process.exit(0);
});