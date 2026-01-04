# SubscribeManager

[EN](https://github.com/jokerknight/SubscribeManager/blob/main/README.md)|中文

## 开源地址

[SubscribeManager](https://github.com/jokerknight/SubscribeManager)动动你的小手给个 Star

### 更新日志V1.0.0

- 支持通过订阅链接导入节点
- 支持配置 Subconverter+自定义模板 或 默认模板 生成 Clash 订阅节点 
- UI 更新
- 代码重构

### 简介

SubscribeManager 是一个轻量级、简单的代理节点订阅管理系统。

通过 Docker Compose 本地部署，简单易迁移

提供直观的 Web 界面，支持多种代理协议和订阅格式。

## 🌐 线上体验

[SubscribeManager OnRender](https://subscribemanager.onrender.com/admin)

**username:** `admin`

**password:** `admin`

**path:** `admin`

  

## ✨ 功能特点

- **多协议支持**: SS, VMess, Trojan, VLESS, SOCKS5, Snell,

Hysteria2, Tuic

- **订阅管理**:

- 创建多个订阅

- 自定义路径

- 批量导入

- 拖拽排序

- **多种订阅格式**:

- 原始

- Base64 (`/v2ray`)

- Surge (`/surge`)

- Clash (`/clash`)

- Shadowsocks (`/shadowsocks`)

- **高级 Clash 功能**:

- 内置默认模板，包含 3900+ 条规则

- 自动展开规则提供商（rule-providers）

- 兼容 ClashMeta 和 ClashX

- 集成 Subconvert API 支持自定义模板

- **安全特性**:

- 管理登录认证

- 会话管理

- 安全 Cookie

- **界面设计**:

- 响应式设计

- 移动设备友好

## 🚀 部署教程

  
1. 确保已安装 **Docker** 和 **Docker Compose**

2. 克隆项目到本地

3. 在项目根目录创建 `.env` 文件或复制 `.env.example` 文件并修改


```

示例 .env:

SESSION_SECRET=你的会话密钥

ADMIN_PATH=admin

ADMIN_USERNAME=admin

ADMIN_PASSWORD=你的密码

DB_PATH=./data/subscriptions.db

```

  

4. 启动服务

  

- 使用已构建的 Docker Hub 镜像:

  

``` bash

docker compose up -d

```

  

- 从源码构建镜像并启动:

  

``` bash

docker compose up -d --build

```

  

- Makefile 方式:

  

``` bash

make up # 使用已构建镜像

make buildup # 从源码构建并启动

make down # 停止并删除容器

make logs # 查看日志

```


5. 访问管理面板: `http://localhost:3000/${ADMIN_PATH}`

## 💾 数据库


- 数据存放在 `./data/subscriptions.db`

- 初次运行会自动初始化数据库表


## 📖 使用说明
  

- **创建订阅**: 登录 → 添加订阅 → 输入名称和路径 → 创建

- **管理节点**: 选择订阅 → 添加节点 → 支持单行、多行、Base64

- 导入节点: 选择订阅-> 选择需要导入的订阅类型->输入对应的订阅链接->自动导入节点

- 生成自定义 Clash 链接规则: 选择订阅->配置 SubconverterUrl + 自定义规则模板 -> 点击生成 Clash 订阅节点 

- 生成默认模板或仅生成带有节点的 Clash 规则: 选择订阅->勾选或取消使用默认模版->保存->点击生成 Clash 订阅节点

- **节点排序**: 节点列表 → 拖拽 → 自动保存

- **批量操作**: 批量删除 → 勾选 → 确认
  

## 🎯 Clash 功能特性


### 默认模板

- 内置默认 Clash 模板，包含完整的规则集

- 8 个代理组：自动选择、媒体服务、微软服务、苹果服务、CDN 服务、AI 服务、Telegram、Speedtest

- 3900+ 条从规则提供商展开的规则

- 兼容 ClashMeta,OpenClash, Nikki 等 Clash 客户端

  

### 规则提供商

默认模板包含来自 Sukkaw 规则集的规则：

- 拦截：广告、恶意软件、追踪器

- 直连：苹果、微软、CDN、国内服务

- 代理：媒体服务、AI、Telegram、全局流量

- 基于 IP 的规则，实现精确匹配

  
### Subconvert 集成

当配置了 Subconvert URL 时：

- 订阅将通过 Subconvert (自行配置)进行转换

- 支持通过 Subconvert 使用自定义模板(自行配置)

- 出错时自动降级到本地默认模板转换


## ⚠️ 注意事项
  

- 首次部署请修改默认管理员密码

- 定期备份数据库

- 妥善保管管理面板信息

- 使用强密码
  

## 🛠️ 技术栈

- Node.js

- Express

- SQLite

- Docker & Docker Compose

- HTML5 / CSS3 / JavaScript (ES6+)

- Bootstrap 5

- Font Awesome

- SortableJS
  
## REF

[ProxyCli](https://github.com/jokerknight/ProxyCli)