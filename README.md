
[中文](https://github.com/jokerknight/SubscribeManager/blob/main/REAME_ZH.md)|English
### Overview
SubscribeManager is the Node.js version of [Sub-Hub](https://github.com/shiyi11yi/Sub-Hub), a lightweight and simple proxy node subscription management system. It can now be deployed locally via Docker Compose, without Cloudflare Workers. Provides an intuitive web interface and supports multiple proxy protocols and subscription formats.

## Features

- Supports multiple proxy protocols: SS, SS2022, VMess, Trojan, VLESS, SOCKS5, Snell, Hysteria2, Tuic
- Subscription management:
  - Create multiple subscriptions
  - Custom paths
  - Bulk import
  - Drag-and-drop sorting
- Multiple subscription formats:
  - Raw
  - Base64 (/v2ray)
  - Surge (/surge)
  - Clash (/clash)
- Security features:
  - Admin login authentication
  - Session management
  - Secure cookies
- Interface design:
  - Responsive
  - Mobile-friendly

## Deployment Guide

1. Make sure Docker and Docker Compose are installed
2. Clone the project locally
3. Create a .env file in the project root or copy .env.example and modify

Example .env:
SESSION_SECRET=your_session_secret
ADMIN_PATH=admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
DB_PATH=./data/subscriptions.db

4. Start the service

- Use pre-built Docker Hub image:
docker compose up -d

- Build from source and start:
docker compose up -d --build

- Makefile commands:
make up          # Use existing image
make build       # Build from source and start
make down        # Stop and remove containers
make logs        # View logs

5. Access the admin panel: http://localhost:3000/${ADMIN_PATH}

## Database

- Data is stored in ./data/subscriptions.db
- Tables will be initialized automatically on first run

## Usage

- Create Subscription: Login → Add Subscription → Enter name and path → Create
- Manage Nodes: Select a subscription → Add nodes (supports single line, multiple lines, Base64)
- Sort Nodes: Node list → Drag-and-drop → Auto-save
- Bulk Actions: Bulk delete → Select → Confirm

## Notes

- Change default admin password after first deployment
- Regularly backup your database
- Keep your admin panel info safe
- Use strong passwords

## Tech Stack

Node.js, Express, SQLite, Docker, Docker Compose, HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Font Awesome, SortableJS

