# Ecofone POS & Multi-Store ERP — Server Deployment Guide

This zip package contains the complete, production-ready codebase for **Ecofone POS & Multi-Store Management System**.
The application is pre-configured with a unified single-port architecture: the Node.js backend automatically serves both the **REST API** (`/api/*`) and the **React Production Frontend** (`client/dist`) from a single port (default: `5000` or your custom `PORT`).

---

## 🚀 Quick Start on Linux Server (Ubuntu / Debian / CentOS)

### 1. Prerequisites
Ensure **Node.js (v18, v20, or v22)** and **npm** are installed:
```bash
# Check installed versions
node -v
npm -v

# If not installed on Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
```

---

### 2. Extract the ZIP Package
Upload `ecofone-server-deployment.zip` to your server (via SCP, SFTP, FileZilla, or cPanel File Manager), and extract it:
```bash
mkdir -p /var/www/ecofone
cd /var/www/ecofone
unzip /path/to/ecofone-server-deployment.zip
```

---

### 3. Install Dependencies
Run npm install in both root/server and client:
```bash
# Install Server dependencies (including SQLite)
cd /var/www/ecofone/server
npm install --production

# Optional: If you ever rebuild the client on server:
cd /var/www/ecofone/client
npm install
npm run build
```

---

### 4. Configure Environment Variables (Optional)
Create or edit `/var/www/ecofone/server/.env`:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=ecofone_jwt_secret_key_2026_enterprise_pos
```

---

### 5. Start the Application (24/7 Production with PM2)
We recommend **PM2** for process management, auto-restarts, and zero-downtime reloads:
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server from the server directory
cd /var/www/ecofone/server
pm2 start src/index.js --name "ecofone-pos"

# Ensure PM2 starts automatically on server reboot
pm2 startup
pm2 save
```

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
