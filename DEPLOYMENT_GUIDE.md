# Ecofone POS & Multi-Store ERP — Server Deployment Guide

This zip package contains the complete, production-ready codebase for **Ecofone POS & Multi-Store Management System**.
The application is pre-configured with a unified single-port architecture: the Node.js backend automatically serves both the **REST API** (`/api/*`) and the **React Production Frontend** (`client/dist`) from a single port (default: `5000` or your custom `PORT`).

> **Production database requirement:** Run the backend as one continuously running service (PM2/systemd/Docker) with persistent storage. This application uses SQLite, so do not deploy the API as multiple serverless functions for live POS writes.

---

## 🚀 Quick Start on Linux Server (Ubuntu / Debian / CentOS)

### 1. Prerequisites
Ensure **Node.js v20.x** and **npm** are installed:
```bash
# Check installed versions
node -v
npm -v

# If not installed on Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
```

The repository pins the expected runtime in `.nvmrc` and the package `engines` fields. If you use nvm, select it before installing dependencies:
```bash
nvm install 20
nvm use 20
node -v  # should report v20.x
```

---

### 2. Extract the ZIP Package
Upload `ecofone-server-deployment.zip` to your server (via SCP, SFTP, FileZilla, or cPanel File Manager), and extract it:
```bash
mkdir -p /var/www/ecofone
cd /var/www/ecofone
unzip /path/to/ecofone-server-deployment.zip
```

Set the Kloudbean application root to `/var/www/ecofone` (the repository root), not `/var/www/ecofone/server`. The `client/` directory must be uploaded with the backend. The server cannot serve `/` if only the `server/` directory is deployed.

---

### 3. Install Dependencies
Run the install and production build from the repository root:
```bash
cd /var/www/ecofone
npm install
npm run build
```

---

### 4. Configure Environment Variables (Optional)
Create `/var/www/ecofone/.env` from `.env.example`:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=replace-with-a-long-random-secret
```

---

### 5. Start the Application (24/7 Production with PM2)
We recommend **PM2** for process management, auto-restarts, and zero-downtime reloads:
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the single SQLite-backed process from the repository root
cd /var/www/ecofone
pm2 start ecosystem.config.cjs

# Ensure PM2 starts automatically on server reboot
pm2 startup
pm2 save
```

SQLite is configured for WAL mode, a 5-second lock wait, and a memory cache. This allows concurrent reads while writes remain serialized for consistency. Keep sale, stock transfer, return, and purchase operations inside their existing transactions, and keep the database on persistent local storage. For multiple application servers or sustained high write volume, migrate the database to PostgreSQL or MySQL before scaling horizontally.

To monitor logs:
```bash
pm2 logs ecofone-pos
pm2 status
```

---

## 🌐 Nginx Reverse Proxy Configuration (Optional, for Domain & SSL)

If you want to connect your custom domain (e.g. `pos.ecofone.in` or `ecofone.yourdomain.com`) with HTTPS:

```nginx
server {
    listen 80;
    server_name pos.ecofone.in;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

To enable free SSL via Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pos.ecofone.in
```

---

## 🔑 User Authentication & Security

- Admin and employee accounts are created securely during initial database setup.
- Initial credentials can be customized via `.env` using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- You can change passwords or create new users anytime from the **Admin Portal > Employee Management** section.

---

## 💾 Database Backups
- The active SQLite database file is located at:
  `/var/www/ecofone/server/data/ecofone.db`
- Backing up the database is as simple as copying this single file:
  ```bash
  cp /var/www/ecofone/server/data/ecofone.db /var/backups/ecofone_$(date +%F).db
  ```
