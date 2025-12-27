const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const { initializeDatabase } = require("./database");
const config = require("./config");

// 使用原有的简单路由
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

// 中间件
const languageHandler = require("./middleware/languageHandler");
const errorHandler = require("./middleware/errorHandler");

// 认证中间件
const sessionService = require("./services/sessionService");

async function requireAuth(req, res, next) {
  if (!req.session.sessionId) {
    // 如果是API调用，返回401而不是重定向
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
    }
    return res.redirect(`/${config.adminPath}/auth/login`);
  }
  
  try {
    // 验证 session 是否有效
    const isValid = await sessionService.verifyAndRenewSession(req.session.sessionId);
    if (!isValid) {
      delete req.session.sessionId;
      // 如果是API调用，返回401而不是重定向
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
      }
      return res.redirect(`/${config.adminPath}/auth/login`);
    }
    next();
  } catch (error) {
    console.error('Session verification error:', error);
    delete req.session.sessionId;
    // 如果是API调用，返回401而不是重定向
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
    }
    return res.redirect(`/${config.adminPath}/auth/login`);
  }
}



app.set("trust proxy", 1);

// 中间件配置
app.use(languageHandler);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: config.nodeEnv === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
    },
  }),
);
app.get("/config", (req, res) => {
  res.json({
    ADMIN_PATH: config.adminPath,
  });
});

// 启动应用
async function startApp() {
  try {
    // 初始化数据库
    await initializeDatabase();

    // 注册认证路由
    app.use(`/${config.adminPath}/auth`, authRoutes);

    // 管理面板路由（必须在订阅路由之前）
    app.get(`/${config.adminPath}`, requireAuth, (req, res) => {
      res.sendFile(path.join(__dirname, "public", "admin.html"));
    });

    // 配置管理页面路由
    app.get(`/${config.adminPath}/config-manager`, requireAuth, (req, res) => {
      res.sendFile(path.join(__dirname, "public", "config-manager.html"));
    });

    // 注册路由
    app.use("/api", requireAuth, apiRoutes);
    const subscriptionRoutes = require("./routes/subscriptionRoutes");
    app.use("/", subscriptionRoutes); // 订阅内容不需要认证

    // 全局错误处理
    app.use(errorHandler);

    // 启动服务器
    app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`);
      console.log(`管理面板路径: /${config.adminPath}`);

      // 如果是生产环境，添加安全提示
      if (config.nodeEnv === "production") {
        console.log(
          "\x1b[33m%s\x1b[0m",
          "安全提示: 确保已配置 HTTPS 和适当的防火墙规则",
        );
      }
    });
  } catch (error) {
    console.error("应用启动失败:", error);
    process.exit(1);
  }
}

// 启动应用
startApp();

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n收到终止信号，正在关闭应用...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n收到终止信号，正在关闭应用...");
  process.exit(0);
});
