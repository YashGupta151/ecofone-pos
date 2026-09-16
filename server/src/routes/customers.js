const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, logAudit } = require('../middleware/auth');

// GET /api/customers
router.get('/', authenticateToken, (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;

  let baseQuery = `
    SELECT c.*,
      (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as invoice_count
    FROM customers c
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    baseQuery += ` AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.customer_code LIKE ?)`;
    const st = `%${search.trim()}%`;
    params.push(st, st, st, st);
  }

  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery})`;
  const countResult = db.prepare(countQuery).get(...params);

  const offset = (parseInt(page) - 1) * parseInt(limit);
  baseQuery += ` ORDER BY c.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const customers = db.prepare(baseQuery).all(...params);

  res.json({
    success: true,
    customers,
    pagination: {
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.total / parseInt(limit))
    }
  });
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, (req, res) => {
  const customerId = parseInt(req.params.id);

  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  // Purchases history
  const purchases = db.prepare(`
    SELECT sa.id, sa.invoice_number, sa.sale_date, sa.grand_total, sa.payment_status, sa.status,
           s.name as store_name
    FROM sales sa
    JOIN stores s ON sa.store_id = s.id
    WHERE sa.customer_id = ?
    ORDER BY sa.sale_date DESC
  `).all(customerId);

  // Purchased devices list
  const devices = db.prepare(`
    SELECT si.*, sa.invoice_number, sa.sale_date
    FROM sale_items si
    JOIN sales sa ON si.sale_id = sa.id
    WHERE sa.customer_id = ?
    ORDER BY sa.sale_date DESC
  `).all(customerId);

  // Warranties
  const warranties = db.prepare(`
    SELECT w.*, p.brand, p.model, p.variant
    FROM warranties w
    JOIN phone_inventory p ON w.phone_id = p.id
    WHERE w.customer_id = ?
    ORDER BY w.id DESC
  `).all(customerId);

  res.json({
    success: true,
    customer,
    purchases,
    devices,
    warranties
  });
});

// POST /api/customers
router.post('/', authenticateToken, (req, res) => {
  const { full_name, phone, email, address, city, state, pincode, gstin, id_proof_type, id_proof_number } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({ success: false, message: 'Full name and phone number are required.' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits.' });
  }

  let cleanIdProof = null;
  if (id_proof_number) {
    cleanIdProof = id_proof_number.replace(/\D/g, '');
    if (cleanIdProof.length !== 12) {
      return res.status(400).json({ success: false, message: 'ID proof number must be exactly 12 digits.' });
    }
  }

  const existing = db.prepare(`SELECT id, full_name FROM customers WHERE phone = ?`).get(cleanPhone);
  if (existing) {
    return res.status(400).json({ success: false, message: `Customer with phone ${cleanPhone} already exists (${existing.full_name}).`, customerId: existing.id });
  }

  const cCount = db.prepare(`SELECT COUNT(*) as cnt FROM customers`).get();
  const customerCode = `CUST-${String(cCount.cnt + 1).padStart(4, '0')}`;

  try {
    const resInsert = db.prepare(`
      INSERT INTO customers (customer_code, full_name, phone, email, address, city, state, pincode, gstin, id_proof_type, id_proof_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerCode, full_name.trim(), cleanPhone, email || '', address || '', city || '', state || '', pincode || '', gstin || null, id_proof_type || null, cleanIdProof);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      customer: {
        id: resInsert.lastInsertRowid,
        customer_code: customerCode,
        full_name,
        phone
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
