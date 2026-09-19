require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const employeeRoutes = require('./routes/employees');
const inventoryRoutes = require('./routes/inventory');
const posRoutes = require('./routes/pos');
const transferRoutes = require('./routes/transfers');
const customerRoutes = require('./routes/customers');
const returnRoutes = require('./routes/returns');
const warrantyRoutes = require('./routes/warranties');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const exchangeRoutes = require('./routes/exchanges');
const accessoryRoutes = require('./routes/accessories');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  const db = require('./db/database');
  const count = db.prepare("SELECT count(*) as c FROM stores WHERE status = 'active'").get()?.c || 1;
  res.json({
    status: 'healthy',
    application: 'Ecofone POS & Multi-Store Management Backend',
    version: '1.0.0',
    storesCount: count,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', posRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/accessories', accessoryRoutes);

// Serve static frontend build if present (Unified Single-Port Deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Ecofone POS & Multi-Store Server running on port ${PORT}`);
    console.log(`🏬 Managing 12 Physical Stores Across India`);
    console.log(`👉 API Health: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
