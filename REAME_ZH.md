[EN](https://github.com/jokerknight/SubscribeManager/blob/main/README.md)|中文
### 简介
SubscribeManager 是 [Sub-Hub](https://github.com/shiyi11yi/Sub-Hub) 的 Node.js 版本，是一个轻量级、简单的代理节点订阅管理系统。现在可以通过 Docker Compose 本地部署，无需 Cloudflare Workers。提供直观的 Web 界面，支持多种代理协议和订阅格式。

## 功能特点

- 支持多种代理协议: SS, SS2022, VMess, Trojan, VLESS, SOCKS5, Snell, Hysteria2, Tuic
- 订阅管理:
  - 创建多个订阅
  - 自定义路径
  - 批量导入
  - 拖拽排序
- 多种订阅格式:
  - 原始
  - Base64 (/v2ray)
  - Surge (/surge)
  - Clash (/clash)
- 安全特性:
  - 管理登录认证
  - 会话管理
  - 安全 Cookie
- 界面设计:
  - 响应式设计
  - 移动设备友好

## 部署教程

1. 确保已安装 Docker 和 Docker Compose
2. 克隆项目到本地
3. 在项目根目录创建 .env 文件或复制 .env.example 文件并修改

```
示例 .env:
SESSION_SECRET=你的会话密钥
ADMIN_PATH=admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的密码
DB_PATH=./data/subscriptions.db
```

4. 启动服务

使用已构建的 Docker Hub 镜像:
> docker compose up -d

从源码构建镜像并启动:
> docker compose up -d --build

Makefile 方式:
- make up          # 使用已构建镜像
- make build       # 从源码构建并启动
- make down        # 停止并删除容器
- make logs        # 查看日志

5. 访问管理面板: http://localhost:3000/${ADMIN_PATH}

## 数据库

- 数据存放在 ./data/subscriptions.db
- 初次运行会自动初始化数据库表

## 使用说明

- 创建订阅: 登录 → 添加订阅 → 输入名称和路径 → 创建
- 管理节点: 选择订阅 → 添加节点 → 支持单行、多行、Base64
- 节点排序: 节点列表 → 拖拽 → 自动保存
- 批量操作: 批量删除 → 勾选 → 确认

## 注意事项

- 首次部署请修改默认管理员密码
- 定期备份数据库
- 妥善保管管理面板信息
- 使用强密码

## 技术栈

Node.js, Express, SQLite, Docker, Docker Compose, HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Font Awesome, SortableJS
