const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

function getNextTransferNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `TRF-${currentYear}-`;

  const last = db.prepare(`SELECT transfer_number FROM stock_transfers WHERE transfer_number LIKE ? ORDER BY id DESC LIMIT 1`).get(`${prefix}%`);
  let nextSeq = 1;
  if (last && last.transfer_number) {
    const parts = last.transfer_number.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }
  }
  return `${prefix}${String(nextSeq).padStart(6, '0')}`;
}

// GET /api/transfers
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT t.*, 
           fs.name as from_store_name, fs.code as from_store_code,
           ts.name as to_store_name, ts.code as to_store_code,
           u1.full_name as initiated_by_name,
           u2.full_name as received_by_name,
           (SELECT COUNT(*) FROM stock_transfer_items WHERE transfer_id = t.id) as item_count
    FROM stock_transfers t
    JOIN stores fs ON t.from_store_id = fs.id
    JOIN stores ts ON t.to_store_id = ts.id
    JOIN users u1 ON t.initiated_by = u1.id
    LEFT JOIN users u2 ON t.received_by = u2.id
  `;

  const params = [];
  if (req.user.role !== 'admin') {
    query += ` WHERE t.from_store_id = ? OR t.to_store_id = ?`;
    params.push(req.user.assigned_store_id, req.user.assigned_store_id);
  }

  query += ` ORDER BY t.id DESC`;
  const transfers = db.prepare(query).all(...params);
  res.json({ success: true, transfers });
});

// GET /api/transfers/:id
router.get('/:id', authenticateToken, (req, res) => {
  const transferId = parseInt(req.params.id);

  const transfer = db.prepare(`
    SELECT t.*, 
           fs.name as from_store_name, fs.code as from_store_code,
           ts.name as to_store_name, ts.code as to_store_code,
           u1.full_name as initiated_by_name,
           u2.full_name as received_by_name
    FROM stock_transfers t
    JOIN stores fs ON t.from_store_id = fs.id
    JOIN stores ts ON t.to_store_id = ts.id
    JOIN users u1 ON t.initiated_by = u1.id
    LEFT JOIN users u2 ON t.received_by = u2.id
    WHERE t.id = ?
  `).get(transferId);

  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer record not found.' });
  }

  const items = db.prepare(`
    SELECT ti.*, p.brand, p.model, p.variant, p.condition_grade, p.selling_price
    FROM stock_transfer_items ti
    JOIN phone_inventory p ON ti.phone_id = p.id
    WHERE ti.transfer_id = ?
  `).all(transferId);

  res.json({ success: true, transfer, items });
});

// POST /api/transfers (Initiate Stock Transfer)
router.post('/', authenticateToken, (req, res) => {
  const { from_store_id, to_store_id, phone_ids, notes } = req.body;

  if (!from_store_id || !to_store_id || !phone_ids || !phone_ids.length) {
    return res.status(400).json({ success: false, message: 'Source store, destination store, and at least one device are required.' });
  }

  if (parseInt(from_store_id) === parseInt(to_store_id)) {
    return res.status(400).json({ success: false, message: 'Source and destination store cannot be the same.' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== parseInt(from_store_id)) {
    return res.status(403).json({ success: false, message: 'You can only transfer stock out of your assigned store.' });
  }

  const transferTx = db.transaction(() => {
    // Validate all phones
    for (const phoneId of phone_ids) {
      const phone = db.prepare(`SELECT * FROM phone_inventory WHERE id = ?`).get(phoneId);
      if (!phone) throw new Error(`Phone ID ${phoneId} not found.`);
      if (phone.current_store_id !== parseInt(from_store_id)) {
        throw new Error(`Device ${phone.brand} ${phone.model} (IMEI: ${phone.imei1}) is not in the source store.`);
      }
      if (phone.stock_status !== 'AVAILABLE') {
        throw new Error(`Device (IMEI: ${phone.imei1}) is not available (Status: ${phone.stock_status}).`);
      }
    }

    const transferNumber = getNextTransferNumber();

    const tRes = db.prepare(`
      INSERT INTO stock_transfers (
        transfer_number, from_store_id, to_store_id, transfer_date, initiated_by, status, notes
      ) VALUES (?, ?, ?, DATE('now'), ?, 'In Transit', ?)
    `).run(transferNumber, from_store_id, to_store_id, req.user.id, notes || '');

    const transferId = tRes.lastInsertRowid;

    const itemInsert = db.prepare(`
      INSERT INTO stock_transfer_items (transfer_id, phone_id, imei1) VALUES (?, ?, ?)
    `);

    // Rule 4: Source store inventory decreases immediately (phone becomes IN_TRANSIT)
    const updatePhone = db.prepare(`
      UPDATE phone_inventory SET stock_status = 'IN_TRANSIT', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    for (const phoneId of phone_ids) {
      const phone = db.prepare(`SELECT imei1 FROM phone_inventory WHERE id = ?`).get(phoneId);
      itemInsert.run(transferId, phoneId, phone.imei1);
      updatePhone.run(phoneId);
    }

    logAudit(req.user.id, req.user.username, 'INITIATE_TRANSFER', from_store_id, 'TRANSFER', transferId, { transferNumber, count: phone_ids.length, to_store_id }, req);

    return { transferId, transferNumber };
  });

  try {
    const result = transferTx();
    res.status(201).json({ success: true, message: 'Stock transfer initiated. Phones are now In Transit.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/transfers/:id/receive (Destination store confirms receipt)
router.patch('/:id/receive', authenticateToken, (req, res) => {
  const transferId = parseInt(req.params.id);

  const transfer = db.prepare(`SELECT * FROM stock_transfers WHERE id = ?`).get(transferId);
  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer not found.' });
  }

  if (transfer.status === 'Received') {
    return res.status(400).json({ success: false, message: 'Transfer has already been received.' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== transfer.to_store_id) {
    return res.status(403).json({ success: false, message: 'Only employees of the destination store or admin can receive stock.' });
  }

  const receiveTx = db.transaction(() => {
    // 1. Mark transfer received
    db.prepare(`
      UPDATE stock_transfers
      SET status = 'Received', received_date = DATE('now'), received_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, transferId);

    // 2. Rule 4: Destination store inventory increases only after receipt
    const items = db.prepare(`SELECT phone_id FROM stock_transfer_items WHERE transfer_id = ?`).all(transferId);
    const updatePhone = db.prepare(`
      UPDATE phone_inventory
      SET current_store_id = ?, stock_status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const item of items) {
      updatePhone.run(transfer.to_store_id, item.phone_id);
    }

    logAudit(req.user.id, req.user.username, 'RECEIVE_TRANSFER', transfer.to_store_id, 'TRANSFER', transferId, { transferNumber: transfer.transfer_number }, req);
  });

  try {
    receiveTx();
    res.json({ success: true, message: 'Stock received successfully. Inventory has been updated at destination store.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/transfers/:id/cancel
router.patch('/:id/cancel', authenticateToken, requireAdmin, (req, res) => {
  const transferId = parseInt(req.params.id);

  const transfer = db.prepare(`SELECT * FROM stock_transfers WHERE id = ?`).get(transferId);
  if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found.' });
  if (transfer.status === 'Received') return res.status(400).json({ success: false, message: 'Cannot cancel an already received transfer.' });

  const cancelTx = db.transaction(() => {
    db.prepare(`UPDATE stock_transfers SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(transferId);

    // Restore phones back to available in source store
    const items = db.prepare(`SELECT phone_id FROM stock_transfer_items WHERE transfer_id = ?`).all(transferId);
    const restorePhone = db.prepare(`UPDATE phone_inventory SET stock_status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`);

    for (const item of items) {
      restorePhone.run(item.phone_id);
    }

    logAudit(req.user.id, req.user.username, 'CANCEL_TRANSFER', transfer.from_store_id, 'TRANSFER', transferId, { transferNumber: transfer.transfer_number }, req);
  });

  try {
    cancelTx();
    res.json({ success: true, message: 'Transfer cancelled and phones returned to source store stock.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
