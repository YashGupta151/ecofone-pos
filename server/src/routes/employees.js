const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/employees (Admin only or profile view)
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT u.id, u.employee_id, u.username, u.full_name, u.phone, u.email, u.address,
           u.role, u.assigned_store_id, u.status, u.permissions, u.created_at,
           u.plain_password,
           s.name as store_name, s.code as store_code, s.city as store_city,
           (SELECT COUNT(*) FROM sales WHERE employee_id = u.id AND status = 'COMPLETED') as sales_count,
           (SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE employee_id = u.id AND status = 'COMPLETED') as total_revenue
    FROM users u
    LEFT JOIN stores s ON u.assigned_store_id = s.id
  `;

  if (req.user.role !== 'admin') {
    query += ` WHERE u.assigned_store_id = ? AND u.role = 'employee'`;
    const employees = db.prepare(query).all(req.user.assigned_store_id);
    const mapped = employees.map(e => {
      const { plain_password, ...rest } = e;
      return {
        ...rest,
        permissions: db.parseUserPermissions(e.permissions, e.role)
      };
    });
    return res.json({ success: true, employees: mapped });
  }

  query += ` ORDER BY u.id ASC`;
  const employees = db.prepare(query).all();
  const mapped = employees.map(e => ({
    ...e,
    permissions: db.parseUserPermissions(e.permissions, e.role)
  }));
  res.json({ success: true, employees: mapped });
});

// GET /api/employees/:id
router.get('/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);

  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const employee = db.prepare(`
    SELECT u.id, u.employee_id, u.username, u.full_name, u.phone, u.email, u.address,
           u.role, u.assigned_store_id, u.status, u.permissions, u.created_at,
           s.name as store_name, s.code as store_code, s.city as store_city
    FROM users u
    LEFT JOIN stores s ON u.assigned_store_id = s.id
    WHERE u.id = ?
  `).get(id);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  employee.permissions = db.parseUserPermissions(employee.permissions, employee.role);

  // Employee sales breakdown
  const sales = db.prepare(`
    SELECT id, sale_number, invoice_number, sale_date, grand_total, payment_status, status
    FROM sales
    WHERE employee_id = ?
    ORDER BY sale_date DESC
    LIMIT 20
  `).all(id);

  const stats = db.prepare(`
    SELECT COUNT(*) as total_sales, COALESCE(SUM(grand_total), 0) as total_revenue
    FROM sales
    WHERE employee_id = ? AND status = 'COMPLETED'
  `).get(id);

  res.json({ success: true, employee, sales, stats });
});

// POST /api/employees (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { employee_id, username, password, full_name, phone, email, address, role, assigned_store_id, status } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).json({ success: false, message: 'Username, password, and full name are required.' });
  }

  let cleanPhone = '';
  if (phone) {
    cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Employee phone number must be exactly 10 digits.' });
    }
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const generatedId = employee_id || `ECO-EMP-${Math.floor(100 + Math.random() * 900)}`;
    const initialStatus = ['active', 'inactive', 'disabled', 'suspended'].includes(status) ? status : 'active';

    const info = db.prepare(`
      INSERT INTO users (employee_id, username, password_hash, plain_password, full_name, phone, email, address, role, assigned_store_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generatedId, username.trim(), hash, password.trim(), full_name.trim(), cleanPhone, email || '', address || '', role || 'employee', assigned_store_id || null, initialStatus);

    logAudit(req.user.id, req.user.username, 'CREATE_EMPLOYEE', assigned_store_id, 'USER', info.lastInsertRowid, { username, role, status: initialStatus }, req);

    res.status(201).json({ success: true, message: 'Employee created successfully.', id: info.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message.includes('UNIQUE') ? 'Username or Employee ID already exists.' : err.message });
  }
});

// PUT /api/employees/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { full_name, phone, email, address, role, assigned_store_id, status } = req.body;

  let cleanPhone = '';
  if (phone) {
    cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Employee phone number must be exactly 10 digits.' });
    }
  }

  try {
    db.prepare(`
      UPDATE users
      SET full_name = ?, phone = ?, email = ?, address = ?, role = ?, assigned_store_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(full_name, cleanPhone, email, address, role, assigned_store_id || null, status || 'active', id);

    logAudit(req.user.id, req.user.username, 'UPDATE_EMPLOYEE', assigned_store_id, 'USER', id, { full_name, role, status }, req);

    res.json({ success: true, message: 'Employee updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/employees/:id/reset-password (Admin only)
router.patch('/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(new_password, salt);

  db.prepare(`UPDATE users SET password_hash = ?, plain_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, new_password.trim(), id);
  logAudit(req.user.id, req.user.username, 'RESET_PASSWORD', null, 'USER', id, 'Admin reset user password', req);

  res.json({ success: true, message: 'Password reset successfully.' });
});

// PATCH /api/employees/:id/status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended', 'disabled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  // Prevent admin from disabling their own account
  if (req.user.id === id && (status === 'inactive' || status === 'disabled' || status === 'suspended')) {
    return res.status(400).json({ success: false, message: 'You cannot disable your own administrator account.' });
  }

  db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);
  logAudit(req.user.id, req.user.username, 'TOGGLE_EMPLOYEE_STATUS', null, 'USER', id, { status }, req);

  res.json({ success: true, message: `Account status updated to ${status}.` });
});

// PUT /api/employees/:id/permissions (Admin only)
router.put('/:id/permissions', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { permissions } = req.body;

  const target = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  if (target.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Super Administrators always have full universal access and cannot be restricted.' });
  }

  if (!permissions || typeof permissions !== 'object') {
    return res.status(400).json({ success: false, message: 'Valid permissions object is required.' });
  }

  const permissionsJson = JSON.stringify(permissions);

  db.prepare(`
    UPDATE users
    SET permissions = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(permissionsJson, id);

  logAudit(
    req.user.id,
    req.user.username,
    'UPDATE_EMPLOYEE_PERMISSIONS',
    target.assigned_store_id,
    'USER',
    id,
    { targetUser: target.username, permissionsSummary: permissions },
    req
  );

  const updatedPermissions = db.parseUserPermissions(permissionsJson, 'employee');
  res.json({
    success: true,
    message: `Access permissions for ${target.full_name} (${target.username}) updated successfully.`,
    permissions: updatedPermissions
  });
});

module.exports = router;
