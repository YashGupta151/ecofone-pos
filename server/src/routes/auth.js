const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateToken, JWT_SECRET, logAudit } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const user = db.prepare(`
    SELECT u.*, s.name as store_name, s.code as store_code, s.city as store_city, s.state as store_state
    FROM users u
    LEFT JOIN stores s ON u.assigned_store_id = s.id
    WHERE u.username = ?
  `).get(username.trim());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Your account is disabled. Please contact Admin.' });
  }

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, storeId: user.assigned_store_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logAudit(user.id, user.username, 'LOGIN', user.assigned_store_id, 'USER', user.id, 'User logged in successfully', req);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      employee_id: user.employee_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      assigned_store_id: user.assigned_store_id,
      store_name: user.store_name,
      store_code: user.store_code,
      store_city: user.store_city,
      store_state: user.store_state,
      email: user.email,
      phone: user.phone,
      permissions: db.parseUserPermissions(user.permissions, user.role)
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Current and new password required.' });
  }

  const user = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ success: false, message: 'Incorrect current password.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newHash, req.user.id);
  logAudit(req.user.id, req.user.username, 'CHANGE_PASSWORD', req.user.assigned_store_id, 'USER', req.user.id, 'Password changed', req);

  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = router;
