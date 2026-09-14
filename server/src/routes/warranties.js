const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/warranties/check (Lookup by IMEI, invoice number, or customer phone)
router.get('/check', authenticateToken, (req, res) => {
  const { query } = req.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide an IMEI, invoice number, or customer phone.' });
  }

  const q = query.trim();

  const results = db.prepare(`
    SELECT w.*, 
           p.brand, p.model, p.variant, p.condition_grade, p.color,
           c.full_name as customer_name, c.phone as customer_phone,
           s.name as store_name, s.code as store_code
    FROM warranties w
    JOIN phone_inventory p ON w.phone_id = p.id
    JOIN customers c ON w.customer_id = c.id
    JOIN sales sa ON w.sale_id = sa.id
    JOIN stores s ON sa.store_id = s.id
    WHERE w.imei1 = ? OR w.invoice_number = ? OR c.phone = ?
    ORDER BY w.id DESC
  `).all(q, q, q);

  const today = new Date().toISOString().split('T')[0];

  const parsed = results.map(w => {
    const isExpired = w.end_date < today || w.status === 'Void';
    const daysRemaining = Math.max(0, Math.ceil((new Date(w.end_date) - new Date(today)) / (1000 * 60 * 60 * 24)));
    return {
      ...w,
      computed_status: w.status === 'Void' ? 'Void' : (isExpired ? 'Expired' : 'Active'),
      days_remaining: isExpired ? 0 : daysRemaining
    };
  });

  res.json({ success: true, count: parsed.length, warranties: parsed });
});

// GET /api/warranties (List all)
router.get('/', authenticateToken, (req, res) => {
  const warranties = db.prepare(`
    SELECT w.*, 
           p.brand, p.model, p.variant,
           c.full_name as customer_name, c.phone as customer_phone,
           s.name as store_name
    FROM warranties w
    JOIN phone_inventory p ON w.phone_id = p.id
    JOIN customers c ON w.customer_id = c.id
    JOIN sales sa ON w.sale_id = sa.id
    JOIN stores s ON sa.store_id = s.id
    ORDER BY w.id DESC
    LIMIT 100
  `).all();

  res.json({ success: true, warranties });
});

module.exports = router;
