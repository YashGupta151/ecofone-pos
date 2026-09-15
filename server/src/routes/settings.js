const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/settings
router.get('/', authenticateToken, (req, res) => {
  const rows = db.prepare(`SELECT key, value, group_name FROM settings`).all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);

  const taxRates = db.prepare(`SELECT * FROM tax_rates`).all();
  const grades = db.prepare(`SELECT * FROM grades`).all();

  res.json({ success: true, settings, taxRates, grades });
});

// PUT /api/settings (Admin only)
router.put('/', authenticateToken, requireAdmin, (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, message: 'Settings object required.' });
  }

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, group_name, updated_at)
    VALUES (?, ?, 'general', CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  const saveTx = db.transaction(() => {
    for (const [key, val] of Object.entries(settings)) {
      upsert.run(key, String(val));
    }

    if (settings.default_tax_rate !== undefined && settings.default_tax_rate !== null && !isNaN(parseFloat(settings.default_tax_rate))) {
      const newRate = parseFloat(settings.default_tax_rate);
      db.prepare(`UPDATE phone_inventory SET tax_rate = ? WHERE stock_status = 'AVAILABLE'`).run(newRate);
      db.prepare(`UPDATE tax_rates SET rate = ?, cgst_rate = ?, sgst_rate = ?, igst_rate = ? WHERE is_default = 1`).run(
        newRate,
        Math.round((newRate / 2) * 10) / 10,
        Math.round((newRate / 2) * 10) / 10,
        newRate
      );
    }
  });

  saveTx();
  logAudit(req.user.id, req.user.username, 'UPDATE_SETTINGS', null, 'SETTINGS', null, 'Company and invoice settings updated', req);

  res.json({ success: true, message: 'Settings saved successfully.' });
});

// GET /api/settings/audit-logs
router.get('/audit-logs', authenticateToken, requireAdmin, (req, res) => {
  const { action, limit = 100 } = req.query;

  let query = `SELECT * FROM audit_logs`;
  const params = [];

  if (action) {
    query += ` WHERE action = ?`;
    params.push(action);
  }

  query += ` ORDER BY id DESC LIMIT ?`;
  params.push(parseInt(limit));

  const logs = db.prepare(query).all(...params);
  res.json({ success: true, logs });
});

// GET /api/settings/notifications
router.get('/notifications', authenticateToken, (req, res) => {
  const storeId = req.user.assigned_store_id;

  let query = `
    SELECT * FROM notifications
    WHERE (store_id = ? OR store_id IS NULL)
    ORDER BY id DESC
    LIMIT 20
  `;

  const notifications = db.prepare(query).all(storeId || null);
  res.json({ success: true, notifications });
});

module.exports = router;
