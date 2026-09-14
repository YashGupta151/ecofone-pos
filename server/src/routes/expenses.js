const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/expenses
router.get('/', authenticateToken, (req, res) => {
  const { store_id, category, date_from, date_to } = req.query;

  let query = `
    SELECT e.*, s.name as store_name, s.code as store_code,
           u.full_name as created_by_name
    FROM expenses e
    LEFT JOIN stores s ON e.store_id = s.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    query += ` AND (e.store_id = ? OR e.store_id IS NULL)`;
    params.push(req.user.assigned_store_id);
  } else if (store_id) {
    query += ` AND e.store_id = ?`;
    params.push(parseInt(store_id));
  }

  if (category) {
    query += ` AND e.category = ?`;
    params.push(category);
  }

  if (date_from) {
    query += ` AND e.expense_date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    query += ` AND e.expense_date <= ?`;
    params.push(date_to);
  }

  query += ` ORDER BY e.expense_date DESC, e.id DESC`;
  const expenses = db.prepare(query).all(...params);

  // Summary by category
  let catSumQuery = `
    SELECT category, SUM(amount) as total_amount
    FROM expenses
    WHERE 1=1
  `;
  const catParams = [];
  if (req.user.role !== 'admin') {
    catSumQuery += ` AND (store_id = ? OR store_id IS NULL)`;
    catParams.push(req.user.assigned_store_id);
  }
  catSumQuery += ` GROUP BY category ORDER BY total_amount DESC`;
  const categorySummary = db.prepare(catSumQuery).all(...catParams);

  res.json({ success: true, expenses, categorySummary });
});

// POST /api/expenses
router.post('/', authenticateToken, (req, res) => {
  const { store_id, category, description, amount, expense_date, receipt_number, notes } = req.body;

  if (!category || !description || !amount || !expense_date) {
    return res.status(400).json({ success: false, message: 'Category, description, amount, and date are required.' });
  }

  const targetStoreId = req.user.role === 'admin' ? (store_id || null) : req.user.assigned_store_id;

  const info = db.prepare(`
    INSERT INTO expenses (store_id, category, description, amount, expense_date, receipt_number, created_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(targetStoreId, category, description, parseFloat(amount), expense_date, receipt_number || '', req.user.id, notes || '');

  logAudit(req.user.id, req.user.username, 'ADD_EXPENSE', targetStoreId, 'EXPENSE', info.lastInsertRowid, { category, amount, description }, req);

  res.status(201).json({ success: true, message: 'Expense logged successfully.', id: info.lastInsertRowid });
});

// DELETE /api/expenses/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare(`DELETE FROM expenses WHERE id = ?`).run(id);
  logAudit(req.user.id, req.user.username, 'DELETE_EXPENSE', null, 'EXPENSE', id, 'Deleted expense record', req);
  res.json({ success: true, message: 'Expense record deleted.' });
});

module.exports = router;
