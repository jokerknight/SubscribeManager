

# SubscribeManager

[中文](https://github.com/baixiaoshengofficial/SubscribeManager/blob/main/README_ZH.md) | EN

## Repository

[SubscribeManager](https://github.com/baixiaoshengofficial/SubscribeManager) Give it a Star

### Star History

[![Star History Chart](https://api.star-history.com/chart?repos=baixiaoshengofficial/SubscribeManager&type=date&legend=top-left&sealed_token=2peV2a45tGf7yz035wsoXznGaNFhrO4lazzvWAYyfADzjkutP4VkssZh6oymwbd77Z1aZiVBni_T73HL4y_GfL9mPbdFh2uuYGNAyN4CpOGBIyStGuQipJdGcrFEmCWhQHMGrBwzcR5HKRK7KJJibCeVbhuJwKXshj4dfV7oacAl0zE2q8gYRM3n_WLF)](https://www.star-history.com/?repos=baixiaoshengofficial%2FSubscribeManager&type=date&legend=top-left)

### Changelog

[View full changelog →](https://github.com/baixiaoshengofficial/SubscribeManager/blob/main/CHANGELOG.md)

### Overview

SubscribeManager is a lightweight and simple proxy node subscription management system.

Deploy locally via Docker Compose, simple and easy to migrate.

Provides an intuitive web interface and supports multiple proxy protocols and subscription formats.

## 🌐 Live Demo

[SubscribeManager Sponsor By FOSSVPS](https://subscribe.baixiaosheng.de)
**username:** `admin`
**password:** `admin`

## ✨ Features

-   **Multiple Protocols Supported**: SS, VMess, Trojan, VLESS, SOCKS5, Snell,
    Hysteria2, Tuic
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
    -   Compatible with ClashMeta and ClashX
    -   Subconvert API integration for custom templates
-   **Security Features**:
    -   Admin login authentication
    -   Session management
    -   Secure cookies
-   **Interface Design**:
    -   Responsive design
    -   Mobile-friendly

## 🚀 Deployment Guide

SubscribeManager supports two deployment shapes:

- **Source deploy**: a single Node process where `backend` serves both the API and the built `frontend/dist` on one port.
- **Docker deploy (split)**: `backend` (API + subscription output) and `frontend` (Nginx serving the static app and reverse-proxying `/api`) run as separate containers on separate ports, orchestrated by Docker Compose.

### Prerequisites

**Requirements**

| Method | Requirements |
|--------|----------------|
| Build from source | Node.js **20+**, npm |
| Docker Compose | Docker **20+**, Docker Compose **v2+** |

**Environment variables**

Copy and edit `.env` at the project root:

```bash
cp .env.example .env
```

```ini
# Required — change defaults in production
SESSION_SECRET=use-a-long-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-strong-password

# Backend port (API, subscription output)
BACKEND_PORT=5100
# Frontend port (Vite in dev; Nginx container in Docker)
FRONTEND_PORT=5101

# Database path (relative to the run directory). Shared by source and Docker;
# Docker mounts host ./data into the container so the db is visible under ./data
DB_PATH=./data/subscriptions.db

# Set to true behind HTTPS; keep false for local / Docker HTTP
# COOKIE_SECURE=false

# Optional: only if remote Subconverter cannot reach your public domain
# PUBLIC_BASE_URL=https://sub.example.com
```

> Dev (`make dev`) and Docker use both ports (frontend on `FRONTEND_PORT`, backend on `BACKEND_PORT`). For a source **production** deploy the single Node process serves everything on `BACKEND_PORT`, and `FRONTEND_PORT` only affects the Vite dev server.

**Access URL**: after deployment, open `http://<host>:<FRONTEND_PORT>/`.

---

### Option 1: Build from source

Run Node directly on the host or a VPS without Docker. The backend builds and serves the frontend as a single process.

```bash
# 1. Clone
git clone https://github.com/baixiaoshengofficial/SubscribeManager.git
cd SubscribeManager

# 2. Configure .env (use the same value for both ports here)
cp .env.example .env

# 3. Install dependencies and build frontend
make install
make frontend-build

# 4. Start backend (reads root .env, serves frontend/dist)
make backend-dev
```

**Common commands**

| Command | Description |
|---------|-------------|
| `make install` | Install `backend/` and `frontend/` dependencies |
| `make frontend-build` | Build frontend to `frontend/dist` |
| `make backend-dev` | Start production backend (port from `BACKEND_PORT` in `.env`) |
| `make test` | Run backend tests |
| `make test-frontend` | Run frontend tests (vitest) |
| `make check` | Backend + frontend tests + frontend build verification |

**Notes**

- After frontend changes, run `make frontend-build` and restart the backend.
- Database defaults to `./data/subscriptions.db` (controlled by `DB_PATH`, relative to the run directory).
- For **local development** with hot reload and split ports, see [Frontend / backend development](#-frontend--backend-development) below.

---

### Option 2: Docker Compose (recommended)

`docker-compose.yaml` starts **backend** and **frontend** as two services, each mapping one port:

| Service | Port mapping | Purpose |
|---------|--------------|---------|
| `backend` | `BACKEND_PORT:BACKEND_PORT` | API, `/<path>` subscription output |
| `frontend` | `FRONTEND_PORT:FRONTEND_PORT` | Admin UI (Nginx static app + reverse proxy for `/api`, `/version`, subscription paths) |

**Pull images from Docker Hub (recommended)**

Defaults to `knighttools/subscribe-manager-backend` and `knighttools/subscribe-manager-frontend`:

```bash
git clone https://github.com/baixiaoshengofficial/SubscribeManager.git
cd SubscribeManager
cp .env.example .env
# edit .env

docker compose up -d      # same as: make up
```

**Build images locally from source**

`docker-compose.override.yaml` switches both services to a local `build` (via `backend/Dockerfile` and `frontend/Dockerfile`):

```bash
docker compose up -d --build   # same as: make buildup
```

> On production servers that should only pull pre-built images, remove or rename `docker-compose.override.yaml`.

**Access & ports**

Open **FRONTEND_PORT** in the browser (e.g. `http://localhost:5101/`). Subscription links use the **same origin as the admin page** plus the path (e.g. `https://your.domain/my-sub/clash`); the frontend Nginx container proxies those paths to the backend. No extra URL config is required.

> **Important**: Your public domain / outer reverse proxy must point to **`FRONTEND_PORT` (frontend container)**, not `BACKEND_PORT`. Exposing only the backend breaks the admin UI at `/`.

**Common commands**

| Command | Description |
|---------|-------------|
| `docker compose up -d` / `make up` | Start in background (pull images) |
| `docker compose up -d --build` / `make buildup` | Build locally and start |
| `docker compose logs -f` / `make logs` | Follow logs |
| `docker compose down` / `make down` | Stop and remove containers |
| `docker compose ps` | Status |

**Upgrade**

```bash
docker compose pull
docker compose down
docker compose up -d
```

Data persists in host `./data`; upgrading the image does not delete subscriptions.

---

## 🧩 Frontend / backend development

The project is split into `frontend/` (Vue 3 + Vite) and `backend/` (Node.js / Express). Root directory holds Docker, Makefile, and deployment files.

**Quick start**

```bash
make dev          # start backend + frontend (recommended)
make install      # install dependencies
make backend-dev  # backend only
make frontend-dev # frontend only
```

Frontend dev: `http://localhost:<FRONTEND_PORT>`; Vite proxies `/api` to `http://localhost:<BACKEND_PORT>`.

For production deployment, see [Deployment Guide](#-deployment-guide) above.

## 💾 Database

-   Data is stored in `./data/subscriptions.db`
-   Tables will be automatically initialized on first run

## 📖 Usage Instructions

-   **Create Subscription**: Login → Add Subscription → Enter name and path → Create
-   **Manage Nodes**: Select subscription → Add node → Supports single line, multiple lines, Base64
-   Import Nodes: Select subscription → Select subscription type to import → Enter corresponding subscription link → Auto-import nodes
-   Generate Custom Clash Link Rules: Select subscription → Configure SubconverterUrl + Custom Rule Template → Click Generate Clash Subscription Nodes
-   Generate Default Template or Clash Rules with Nodes Only: Select subscription → Check or uncheck Use Default Template → Save → Click Generate Clash Subscription Nodes
-   **Protocol Guide**: Open the admin UI → **协议说明** tab in the header
-   **Node Sorting**: Node list → Drag → Auto-save
-   **Bulk Operations**: Bulk delete → Check → Confirm

## 🎯 Clash Features

### Default Template
- Built-in default Clash template with complete rule set
- 8 proxy groups: Auto-select, Media Services, Microsoft Services, Apple Services, CDN Services, AI Services, Telegram, Speedtest
- 3900+ rules expanded from rule-providers
- Compatible with ClashMeta, OpenClash, Nikki and other Clash clients

### Rule Providers
Default template includes rules from Sukkaw ruleset:
- Block: Ads, malware, tracking
- Direct: Apple, Microsoft, CDN, domestic services
- Proxy: Media services, AI, Telegram, global traffic
- IP-based rules for precise matching

### Subconvert Integration
When Subconvert URL is configured:
- Subscription will be converted through Subconvert (self-configured)
- Supports using custom templates via Subconvert (self-configured)
- Automatically falls back to local default template conversion on error

## ⚠️ Notes

-   Change the default administrator password after first deployment
-   Regularly back up the database
-   Keep admin panel information safe
-   Use strong passwords

## 🛠️ Tech Stack

-   Vue 3 + Vite + Element Plus (admin UI)
-   Node.js + Express (backend API)
-   SQLite
-   Docker / Docker Compose
-   SortableJS

## REF

[ProxyCli](https://github.com/baixiaoshengofficial/ProxyCli)
