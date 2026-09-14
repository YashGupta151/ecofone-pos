const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ecofone_jwt_secret_key_2026_enterprise_pos';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT u.id, u.employee_id, u.username, u.full_name, u.role, u.assigned_store_id, u.status,
             s.name as store_name, s.code as store_code, s.city as store_city, s.state as store_state
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive or suspended.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
}

function logAudit(userId, username, action, storeId, entityType, entityId, details, req) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, store_id, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, action, storeId || null, entityType, entityId ? String(entityId) : null, typeof details === 'object' ? JSON.stringify(details) : details, ip);
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

module.exports = { authenticateToken, requireAdmin, logAudit, JWT_SECRET };
