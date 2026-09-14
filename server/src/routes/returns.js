const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

function getNextReturnNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `RET-${currentYear}-`;

  const last = db.prepare(`SELECT return_number FROM returns WHERE return_number LIKE ? ORDER BY id DESC LIMIT 1`).get(`${prefix}%`);
  let nextSeq = 1;
  if (last && last.return_number) {
    const parts = last.return_number.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }
  }
  return `${prefix}${String(nextSeq).padStart(6, '0')}`;
}

// GET /api/returns
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT r.*, s.name as store_name, s.code as store_code,
           c.full_name as customer_name, c.phone as customer_phone,
           u.full_name as processed_by_name
    FROM returns r
    JOIN stores s ON r.store_id = s.id
    JOIN customers c ON r.customer_id = c.id
    LEFT JOIN users u ON r.processed_by = u.id
  `;

  const params = [];
  if (req.user.role !== 'admin') {
    query += ` WHERE r.store_id = ?`;
    params.push(req.user.assigned_store_id);
  }

  query += ` ORDER BY r.id DESC`;
  const returns = db.prepare(query).all(...params);

  res.json({ success: true, returns });
});

// POST /api/returns (Initiate Return)
router.post('/', authenticateToken, (req, res) => {
  const { invoice_number, imei, reason, refund_method, condition_received, notes } = req.body;

  if (!invoice_number || !imei || !reason) {
    return res.status(400).json({ success: false, message: 'Invoice number, IMEI, and reason are required.' });
  }

  // Find the sale and sale_item
  const sale = db.prepare(`SELECT * FROM sales WHERE invoice_number = ?`).get(invoice_number.trim());
  if (!sale) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== sale.store_id) {
    return res.status(403).json({ success: false, message: 'Returns can only be processed at the store where the device was purchased, or by Admin.' });
  }

  const saleItem = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ? AND imei1 = ?`).get(sale.id, imei.trim());
  if (!saleItem) {
    return res.status(404).json({ success: false, message: `Device with IMEI ${imei} was not found on this invoice.` });
  }

  const returnTx = db.transaction(() => {
    const returnNumber = getNextReturnNumber();

    const retInsert = db.prepare(`
      INSERT INTO returns (
        return_number, sale_id, invoice_number, store_id, customer_id,
        return_date, reason, status, refund_amount, refund_method, notes, processed_by
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'Approved', ?, ?, ?, ?)
    `).run(
      returnNumber,
      sale.id,
      sale.invoice_number,
      sale.store_id,
      sale.customer_id,
      reason,
      saleItem.final_price,
      refund_method || 'Store Credit / Refund',
      notes || '',
      req.user.id
    );

    const returnId = retInsert.lastInsertRowid;

    db.prepare(`
      INSERT INTO return_items (return_id, phone_id, imei1, sale_item_id, condition_received)
      VALUES (?, ?, ?, ?, ?)
    `).run(returnId, saleItem.phone_id, saleItem.imei1, saleItem.id, condition_received || 'Inspected');

    // Update phone inventory to RETURNED or DEFECTIVE
    const newStatus = reason.toLowerCase().includes('defect') ? 'DEFECTIVE' : 'RETURNED';
    db.prepare(`
      UPDATE phone_inventory
      SET stock_status = ?, notes = COALESCE(notes, '') || ' [Returned via ' || ? || ']', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, returnNumber, saleItem.phone_id);

    // Mark warranty as Claimed/Void
    db.prepare(`
      UPDATE warranties
      SET status = 'Void'
      WHERE phone_id = ? AND sale_id = ?
    `).run(saleItem.phone_id, sale.id);

    logAudit(req.user.id, req.user.username, 'PROCESS_RETURN', sale.store_id, 'RETURN', returnId, { returnNumber, imei, refundAmount: saleItem.final_price }, req);

    return { returnId, returnNumber, refundAmount: saleItem.final_price };
  });

  try {
    const result = returnTx();
    res.status(201).json({
      success: true,
      message: 'Return processed and inventory status updated.',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
