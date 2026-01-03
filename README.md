# SubscribeManager

[中文](https://github.com/jokerknight/SubscribeManager/blob/main/REAME_ZH.md) | EN

### Overview

SubscribeManager is the Node.js version of [Sub-Hub](https://github.com/shiyi11yi/Sub-Hub),  
a lightweight and simple proxy node subscription management system.  
It can now be deployed locally via Docker Compose, without Cloudflare Workers.  
It provides an intuitive web interface and supports multiple proxy protocols and subscription formats.

## 🌐 Live Demo

[SubscribeManager On Render](https://subscribemanager.onrender.com/admin)  
**username:** `admin`  
**password:** `admin`  
**path:** `admin`

## ✨ Features

-   **Multiple Protocols Supported**: SS, SS2022, VMess, Trojan, VLESS, SOCKS5, Snell, Hysteria2, Tuic
-   **Subscription Management**:
    -   Create multiple subscriptions
    -   Custom paths
    -   Bulk import
    -   Drag-and-drop sorting
-   **Multiple Subscription Formats**:
    -   Raw
    -   Base64 (`/v2ray`)
    -   Surge (`/surge`)
    -   Clash (`/clash`)
-   **Advanced Clash Features**:
    -   Built-in default template with 3900+ rules
    -   Automatic rule expansion from rule-providers
    -   Compatible with ClashMeta, ClashX, OpenClash, Nikki and other Clash clients
    -   Subconvert API integration for custom templates
-   **Security Features**:
    -   Admin login authentication
    -   Session management
    -   Secure cookies
-   **Interface Design**:
    -   Responsive design
    -   Mobile-friendly

## 🚀 Deployment Guide

1.  Ensure **Docker** and **Docker Compose** are installed
2.  Clone the project locally
3.  Create a `.env` file in the project root or copy `.env.example` and modify

```
    Example .env:
    SESSION_SECRET=your_session_secret
    ADMIN_PATH=admin
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=your_password
    DB_PATH=./data/subscriptions.db
```

4.  Start the service

-   Using pre-built Docker Hub image:

    ```bash
    docker compose up -d
    ```

-   Build from source and start:

    ```bash
    docker compose up -d --build
    ```

-   Makefile commands:

    ```bash
    make up       # Use pre-built image
    make buildup  # Build from source and start
    make down     # Stop and remove containers
    make logs     # View logs
    ```

5.  Access the admin panel: `http://localhost:3000/${ADMIN_PATH}`

## 💾 Database

-   Data is stored in `./data/subscriptions.db`
-   Tables will be automatically initialized on first run

## 📖 Usage Instructions

-   **Create Subscription**: Login → Add Subscription → Enter name and path → Create
-   **Manage Nodes**: Select subscription → Add nodes → Supports single line, multiple lines, Base64
-   **Node Sorting**: Node list → Drag-and-drop → Auto-save
-   **Bulk Actions**: Bulk delete → Select → Confirm
-   **Subconvert Integration**: Configure Subconvert URL and template URL for custom Clash subscription template generation

## 🎯 Clash Features

### Default Template
- Built-in default Clash template with comprehensive rules
- 8 proxy groups: Auto-select, Media, Microsoft, Apple, CDN, AI, Telegram, Speedtest
- 3900+ rules expanded from rule-providers
- Compatible with ClashMeta, ClashX, OpenClash, Nikki and other Clash clients

### Rule Providers
The default template includes rules from Sukkaw's ruleset:
- Reject: Ads, malware, tracking
- Direct: Apple, Microsoft, CDNs, domestic services
- Proxy: Media services, AI, Telegram, global
- IP-based rules for precise matching

### Subconvert Integration
When a Subconvert URL is configured:
- Subscriptions will be converted via Subconvert
- Passes locally generated Clash subscription as input
- Supports custom templates via Subconvert
- Falls back to local default template conversion on error

## ⚠️ Notes

-   Change the default admin password after first deployment
-   Regularly back up the database
-   Keep admin panel credentials safe
-   Use strong passwords

## 🛠️ Tech Stack

-   Node.js
-   Express
-   SQLite
-   Docker & Docker Compose
-   HTML5 / CSS3 / JavaScript (ES6+)
-   Bootstrap 5
-   Font Awesome
-   SortableJS

