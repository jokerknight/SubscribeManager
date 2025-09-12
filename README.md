
[中文](https://github.com/jokerknight/SubscribeManager/blob/main/REAME_ZH.md)|English
### Overview
SubscribeManager is a Node.js version of [Sub-Hub](https://github.com/shiyi11yi/Sub-Hub), a lightweight proxy subscription manager. It can now be deployed locally using Docker Compose, no Cloudflare Workers needed. It provides an intuitive web interface to manage multiple subscriptions and nodes, supporting various proxy protocols and subscription formats.

### Features
- **Supported Proxy Protocols**: SS, SS2022, VMess, Trojan, VLESS, SOCKS5, Snell, Hysteria2, Tuic
- **Subscription Management**: Create multiple subscriptions, custom paths, bulk import, drag-and-drop ordering
- **Multiple Subscription Formats**: Original, Base64(/v2ray), Surge(/surge), Clash(/clash)
- **Security**: Admin login, session management, secure cookies
- **Modern UI**: Responsive, mobile-friendly

### Deployment
1. Make sure Docker and Docker Compose are installed
2. Clone the project
3. Create a `.env` file in the project root or renmame .env.example to .env and configure environment variables:
```env
SESSION_SECRET=your_session_secret
ADMIN_PATH=admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
DB_PATH=./data/subscriptions.db
```
4. Start the service:
```bash
docker-compose up -d --build
```
5. Access admin panel: `http://localhost:3000/${ADMIN_PATH}`

### Database
- Data stored in `./data/subscriptions.db`
- Database tables will be initialized automatically on first run

### Usage
- **Create Subscription**: Login → Add Subscription → Enter name & path → Create
- **Manage Nodes**: Select subscription → Add Node → Supports single/multi-line/Base64
- **Node Ordering**: Node List → Drag & Drop → Auto-save
- **Bulk Operations**: Bulk Delete → Select → Confirm

### Notes
- Change default admin password after first deployment
- Backup database regularly
- Keep admin panel info safe
- Use strong passwords

### Tech Stack
Node.js, Express, SQLite, Docker, Docker Compose, HTML5, CSS3, JS(ES6+), Bootstrap 5, Font Awesome, SortableJS
