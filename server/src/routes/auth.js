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

  // Check 24-hour lockout status
  if (user.locked_until) {
    const lockExpiry = new Date(user.locked_until);
    const now = new Date();

    if (lockExpiry > now) {
      const remainingMs = lockExpiry.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return res.status(403).json({
        success: false,
        accountLocked: true,
        lockedUntil: user.locked_until,
        message: `This account has been disabled for 24 hours due to 3 consecutive wrong password attempts. Please try again in ${remainingHours} hour${remainingHours > 1 ? 's' : ''} or contact an Administrator.`
      });
    } else {
      // 24 hours have elapsed: automatically clear lock
      db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).run(user.id);
      user.failed_login_attempts = 0;
      user.locked_until = null;
    }
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Your account is disabled. Please contact Admin.' });
  }

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) {
    const currentAttempts = (user.failed_login_attempts || 0) + 1;

    if (currentAttempts >= 3) {
      // Lock for 24 hours
      const lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(currentAttempts, lockUntil, user.id);

      logAudit(user.id, user.username, 'ACCOUNT_LOCKED', user.assigned_store_id, 'USER', user.id, {
        reason: 'Account disabled for 24 hours after 3 wrong password attempts',
        locked_until: lockUntil
      }, req);

      return res.status(403).json({
        success: false,
        accountLocked: true,
        lockedUntil: lockUntil,
        message: 'Password entered incorrectly 3 times. This account has been disabled for 24 hours. Please contact an Administrator.'
      });
    } else {
      db.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(currentAttempts, user.id);

      const remaining = 3 - currentAttempts;
      return res.status(401).json({
        success: false,
        failedAttempts: currentAttempts,
        remainingAttempts: remaining,
        message: `Invalid username or password. You have ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before your account is disabled for 24 hours.`
      });
    }
  }

  // Password matches: reset failed attempts if any
  if (user.failed_login_attempts > 0 || user.locked_until) {
    db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).run(user.id);
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

function isValidPassword(password) {
  if (!password || password.length < 8) return false;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\/;'`~]/.test(password);
  return Boolean(hasNumber && hasUpper && hasSpecial);
}

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Current and new password required.' });
  }

  if (!isValidPassword(new_password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 special character.'
    });
  }

  const user = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ success: false, message: 'Incorrect current password.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE users SET password_hash = ?, plain_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newHash, new_password.trim(), req.user.id);
  logAudit(req.user.id, req.user.username, 'CHANGE_PASSWORD', req.user.assigned_store_id, 'USER', req.user.id, 'Password changed', req);

  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = router;
