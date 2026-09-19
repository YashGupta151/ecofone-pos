const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/stores
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT s.*, 
      (SELECT COUNT(*) FROM phone_inventory p WHERE p.current_store_id = s.id AND p.stock_status = 'AVAILABLE') as available_inventory_count,
      (SELECT COUNT(*) FROM phone_inventory p WHERE p.current_store_id = s.id AND p.stock_status = 'SOLD') as total_sold_count,
      (SELECT COUNT(*) FROM users u WHERE u.assigned_store_id = s.id AND u.status = 'active') as employee_count,
      (SELECT COALESCE(SUM(sa.grand_total), 0) FROM sales sa WHERE sa.store_id = s.id AND sa.status = 'COMPLETED') as total_revenue,
      (SELECT COALESCE(SUM((si.selling_price * COALESCE(si.quantity, 1) - COALESCE(si.discount, 0)) - (si.unit_cost * COALESCE(si.quantity, 1))), 0) 
       FROM sale_items si 
       JOIN sales sa ON si.sale_id = sa.id 
       WHERE sa.store_id = s.id AND sa.status = 'COMPLETED') as total_profit
    FROM stores s
  `;

  // Employee restricted to their store
  if (req.user.role !== 'admin') {
    query += ` WHERE s.id = ?`;
    const store = db.prepare(query).get(req.user.assigned_store_id);
    return res.json({ success: true, stores: store ? [store] : [] });
  }

  query += ` ORDER BY s.id ASC`;
  const stores = db.prepare(query).all();
  res.json({ success: true, stores });
});

// GET /api/stores/:id
router.get('/:id', authenticateToken, (req, res) => {
  const storeId = parseInt(req.params.id);

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== storeId) {
    return res.status(403).json({ success: false, message: 'Access denied to other stores.' });
  }

  const store = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM phone_inventory p WHERE p.current_store_id = s.id AND p.stock_status = 'AVAILABLE') as available_inventory_count,
      (SELECT COUNT(*) FROM users u WHERE u.assigned_store_id = s.id) as employee_count,
      (SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE store_id = s.id AND status = 'COMPLETED') as total_revenue
    FROM stores s
    WHERE s.id = ?
  `).get(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: 'Store not found.' });
  }

  // Get store employees
  const employees = db.prepare(`
    SELECT id, employee_id, username, full_name, role, status, phone, email
    FROM users
    WHERE assigned_store_id = ?
  `).all(storeId);

  res.json({ success: true, store, employees });
});

// POST /api/stores (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, code, address, city, state, pincode, phone, email, gstin, manager } = req.body;

  if (!name || !code || !city || !state) {
    return res.status(400).json({ success: false, message: 'Name, code, city, and state are required.' });
  }

  let cleanPhone = '';
  if (phone) {
    cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Store phone number must be exactly 10 digits.' });
    }
  }

  try {
    const info = db.prepare(`
      INSERT INTO stores (name, code, address, city, state, pincode, phone, email, gstin, manager, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(name, code, address || '', city, state, pincode || '', cleanPhone, email || '', gstin || '', manager || '');

    logAudit(req.user.id, req.user.username, 'CREATE_STORE', info.lastInsertRowid, 'STORE', info.lastInsertRowid, { name, code, city }, req);

    res.status(201).json({ success: true, message: 'Store created successfully.', storeId: info.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message.includes('UNIQUE') ? 'Store code already exists.' : err.message });
  }
});

// PUT /api/stores/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const storeId = parseInt(req.params.id);
  const { name, code, address, city, state, pincode, phone, email, gstin, manager, status } = req.body;

  let cleanPhone = '';
  if (phone) {
    cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Store phone number must be exactly 10 digits.' });
    }
  }

  try {
    db.prepare(`
      UPDATE stores
      SET name = ?, code = ?, address = ?, city = ?, state = ?, pincode = ?, phone = ?, email = ?, gstin = ?, manager = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, code, address, city, state, pincode, cleanPhone, email, gstin, manager, status || 'active', storeId);

    logAudit(req.user.id, req.user.username, 'UPDATE_STORE', storeId, 'STORE', storeId, { name, code, status }, req);

    res.json({ success: true, message: 'Store updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/stores/:id/status
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const storeId = parseInt(req.params.id);
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  db.prepare(`UPDATE stores SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, storeId);
  logAudit(req.user.id, req.user.username, 'TOGGLE_STORE_STATUS', storeId, 'STORE', storeId, { status }, req);

  res.json({ success: true, message: `Store marked as ${status}.` });
});

module.exports = router;
