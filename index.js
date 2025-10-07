const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const routes = require('./routes/index');
const { initializeDatabase } = require('./database');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const languageHandler = require('./middleware/languageHandler');

// ******** 开始诊断代码 ********
// 把它放在所有 app.use(...) 的最前面
// app.use((req, res, next) => {
//   console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
//   next();
// });
// ******** 结束诊断代码 ********
app.set('trust proxy', 1);

// 重定向根路径到管理面板
app.get('/', (req, res) => {
  res.redirect(`/${config.adminPath}`);
});

// 中间件配置
app.use(languageHandler);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));
app.get('/config', (req, res) => {
  res.json({
    ADMIN_PATH: config.adminPath
  });
});

// 启动应用
async function startApp() {
  try {
    // 初始化数据库
    await initializeDatabase();
    
    // 路由处理
    app.use('/', routes);

    // 全局错误处理
    app.use(errorHandler);
    
    // 启动服务器
    app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`);
      console.log(`管理面板路径: /${config.adminPath}`);
      
      // 如果是生产环境，添加安全提示
      if (config.nodeEnv === 'production') {
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