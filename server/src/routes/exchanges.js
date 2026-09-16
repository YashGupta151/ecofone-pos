const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// Helper to generate next unique sequential exchange number
function getNextExchangeNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `EXC-${currentYear}-`;

  const last = db.prepare(`
    SELECT exchange_number FROM exchanged_phones
    WHERE exchange_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextSeq = 1;
  if (last && last.exchange_number) {
    const parts = last.exchange_number.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(6, '0')}`;
}

// GET /api/exchanges (List all exchanged phones with filters and summary stats)
router.get('/', authenticateToken, (req, res) => {
  const { store_id, status, condition_grade, date_from, date_to, search, page = 1, limit = 50 } = req.query;

  let baseQuery = `
    SELECT ep.*,
           s.name as store_name, s.code as store_code, s.city as store_city,
           u.full_name as employee_name, u.employee_id as employee_code,
           sa.sale_number, sa.invoice_number as sale_invoice_number, sa.grand_total as sale_grand_total
    FROM exchanged_phones ep
    JOIN stores s ON ep.store_id = s.id
    JOIN users u ON ep.employee_id = u.id
    LEFT JOIN sales sa ON ep.sale_id = sa.id
    WHERE 1=1
  `;
  const params = [];

  // Restrict store if non-admin
  if (req.user.role !== 'admin') {
    baseQuery += ` AND ep.store_id = ?`;
    params.push(req.user.assigned_store_id);
  } else if (store_id) {
    baseQuery += ` AND ep.store_id = ?`;
    params.push(parseInt(store_id));
  }

  if (status) {
    baseQuery += ` AND ep.status = ?`;
    params.push(status);
  }

  if (condition_grade) {
    baseQuery += ` AND ep.condition_grade = ?`;
    params.push(condition_grade);
  }

  if (date_from) {
    baseQuery += ` AND DATE(ep.exchange_date) >= ?`;
    params.push(date_from);
  }
  if (date_to) {
    baseQuery += ` AND DATE(ep.exchange_date) <= ?`;
    params.push(date_to);
  }

  if (search) {
    baseQuery += ` AND (
      ep.exchange_number LIKE ? OR
      ep.imei1 LIKE ? OR
      ep.imei2 LIKE ? OR
      ep.brand LIKE ? OR
      ep.model LIKE ? OR
      ep.customer_name LIKE ? OR
      ep.customer_phone LIKE ? OR
      ep.invoice_number LIKE ?
    )`;
    const st = `%${search.trim()}%`;
    params.push(st, st, st, st, st, st, st, st);
  }

  // Count total matching
  const countQuery = `SELECT COUNT(*) as total, COALESCE(SUM(exchange_value), 0) as total_value FROM (${baseQuery})`;
  const countResult = db.prepare(countQuery).get(...params);

  // Overall KPI statistics
  let statsStoreCondition = '';
  const statsParams = [];
  if (req.user.role !== 'admin') {
    statsStoreCondition = `WHERE store_id = ?`;
    statsParams.push(req.user.assigned_store_id);
  } else if (store_id) {
    statsStoreCondition = `WHERE store_id = ?`;
    statsParams.push(parseInt(store_id));
  }

  const kpis = db.prepare(`
    SELECT
      COUNT(*) as total_devices,
      COALESCE(SUM(exchange_value), 0) as total_valuation,
      SUM(CASE WHEN DATE(exchange_date) = DATE('now') THEN 1 ELSE 0 END) as today_count,
      SUM(CASE WHEN status = 'IN_STOCK' THEN 1 ELSE 0 END) as in_stock_count,
      SUM(CASE WHEN status = 'ADDED_TO_INVENTORY' THEN 1 ELSE 0 END) as converted_to_inventory_count
    FROM exchanged_phones
    ${statsStoreCondition}
  `).get(...statsParams);

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  baseQuery += ` ORDER BY ep.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const exchanges = db.prepare(baseQuery).all(...params);

  res.json({
    success: true,
    exchanges,
    kpis: {
      totalDevices: kpis.total_devices || 0,
      totalValuation: kpis.total_valuation || 0,
      todayCount: kpis.today_count || 0,
      inStockCount: kpis.in_stock_count || 0,
      convertedCount: kpis.converted_to_inventory_count || 0
    },
    pagination: {
      total: countResult.total,
      totalValue: countResult.total_value,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.total / parseInt(limit))
    }
  });
});

// GET /api/exchanges/:id (Single Exchanged Phone Details)
router.get('/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);

  const exchange = db.prepare(`
    SELECT ep.*,
           s.name as store_name, s.code as store_code, s.address as store_address, s.city as store_city, s.state as store_state, s.phone as store_phone,
           u.full_name as employee_name, u.employee_id as employee_code,
           sa.sale_number, sa.invoice_number as sale_invoice_number, sa.sale_date, sa.grand_total as sale_grand_total, sa.exchange_amount as sale_exchange_amount, sa.net_payable as sale_net_payable
    FROM exchanged_phones ep
    JOIN stores s ON ep.store_id = s.id
    JOIN users u ON ep.employee_id = u.id
    LEFT JOIN sales sa ON ep.sale_id = sa.id
    WHERE ep.id = ?
  `).get(id);

  if (!exchange) {
    return res.status(404).json({ success: false, message: 'Exchanged phone record not found.' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== exchange.store_id) {
    return res.status(403).json({ success: false, message: 'Access denied to records from other stores.' });
  }

  // Fetch company settings for voucher
  const companySettings = db.prepare(`SELECT key, value FROM settings`).all();
  const settingsObj = {};
  companySettings.forEach(s => settingsObj[s.key] = s.value);

  res.json({
    success: true,
    exchange,
    company: settingsObj
  });
});

// PATCH /api/exchanges/:id/status (Update status)
router.patch('/:id/status', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;

  const validStatuses = ['IN_STOCK', 'REFURBISHING', 'ADDED_TO_INVENTORY', 'SCRAPPED', 'SOLD'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const existing = db.prepare(`SELECT * FROM exchanged_phones WHERE id = ?`).get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Exchanged phone record not found.' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== existing.store_id) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  db.prepare(`
    UPDATE exchanged_phones
    SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, notes !== undefined ? notes : null, id);

  logAudit(
    req.user.id,
    req.user.username,
    'UPDATE_EXCHANGE_STATUS',
    existing.store_id,
    'EXCHANGE',
    id,
    { oldStatus: existing.status, newStatus: status, notes },
    req
  );

  res.json({ success: true, message: `Status updated to ${status}.` });
});

// POST /api/exchanges/:id/move-to-inventory (Add exchanged phone to main sellable stock)
router.post('/:id/move-to-inventory', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { selling_price, condition_grade, notes } = req.body;

  const exchange = db.prepare(`SELECT * FROM exchanged_phones WHERE id = ?`).get(id);
  if (!exchange) {
    return res.status(404).json({ success: false, message: 'Exchanged phone record not found.' });
  }

  if (exchange.status === 'ADDED_TO_INVENTORY' && exchange.phone_inventory_id) {
    return res.status(400).json({ success: false, message: 'This phone has already been transferred to main inventory.' });
  }

  // Check if IMEI1 already exists in phone_inventory
  const existingImei = db.prepare(`SELECT id, stock_status FROM phone_inventory WHERE imei1 = ?`).get(exchange.imei1);
  if (existingImei && existingImei.stock_status === 'AVAILABLE') {
    return res.status(400).json({
      success: false,
      message: `A device with IMEI ${exchange.imei1} already exists in available inventory (ID #${existingImei.id}).`
    });
  }

  const defaultTax = db.prepare(`SELECT value FROM settings WHERE key = 'default_tax_rate'`).get();
  const taxRate = defaultTax && !isNaN(parseFloat(defaultTax.value)) ? parseFloat(defaultTax.value) : 18.0;

  const purchasePrice = parseFloat(exchange.exchange_value) || 0;
  const suggestedSellingPrice = parseFloat(selling_price) || (purchasePrice > 0 ? Math.round(purchasePrice * 1.25) : 10000);
  const finalPrice = Math.round((suggestedSellingPrice + (suggestedSellingPrice * (taxRate / 100))) * 100) / 100;

  const internalProductId = `ECO-EXC-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    const transaction = db.transaction(() => {
      // Insert into phone_inventory
      const invInsert = db.prepare(`
        INSERT INTO phone_inventory (
          internal_product_id, brand, model, variant, ram, storage, color,
          imei1, imei2, serial_number, condition_grade, battery_health,
          purchase_price, refurbishment_cost, additional_cost, total_cost,
          selling_price, discount, tax_rate, final_selling_price,
          current_store_id, stock_status, notes
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, 0, 0, ?,
          ?, 0, ?, ?,
          ?, 'AVAILABLE', ?
        )
      `).run(
        internalProductId,
        exchange.brand,
        exchange.model,
        exchange.variant || 'Standard',
        '', // ram
        exchange.variant || '', // storage
        exchange.color || 'Standard',
        exchange.imei1,
        exchange.imei2 || null,
        exchange.serial_number || null,
        condition_grade || exchange.condition_grade || 'Grade B',
        exchange.battery_health || null,
        purchasePrice,
        purchasePrice, // total_cost
        suggestedSellingPrice,
        taxRate,
        finalPrice,
        exchange.store_id,
        notes || `Acquired via Customer Exchange #${exchange.exchange_number} from ${exchange.customer_name}`
      );

      const phoneInventoryId = invInsert.lastInsertRowid;

      // Update exchanged_phones record
      db.prepare(`
        UPDATE exchanged_phones
        SET status = 'ADDED_TO_INVENTORY',
            phone_inventory_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(phoneInventoryId, id);

      logAudit(
        req.user.id,
        req.user.username,
        'EXCHANGE_TO_INVENTORY',
        exchange.store_id,
        'INVENTORY',
        phoneInventoryId,
        { exchange_id: id, imei1: exchange.imei1, internal_product_id: internalProductId, cost: purchasePrice, selling_price: suggestedSellingPrice },
        req
      );

      return phoneInventoryId;
    });

    const newInventoryId = transaction();

    res.json({
      success: true,
      message: `Device successfully converted to sellable inventory (ID #${newInventoryId})!`,
      phone_inventory_id: newInventoryId
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/exchanges/:id (Admin only deletion)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);

  const existing = db.prepare(`SELECT * FROM exchanged_phones WHERE id = ?`).get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Exchanged phone record not found.' });
  }

  if (existing.status === 'ADDED_TO_INVENTORY') {
    return res.status(400).json({ success: false, message: 'Cannot delete exchange record that has been converted to inventory.' });
  }

  db.prepare(`DELETE FROM exchanged_phones WHERE id = ?`).run(id);

  logAudit(
    req.user.id,
    req.user.username,
    'DELETE_EXCHANGE_RECORD',
    existing.store_id,
    'EXCHANGE',
    id,
    { exchange_number: existing.exchange_number, imei1: existing.imei1 },
    req
  );

  res.json({ success: true, message: 'Exchanged phone record removed successfully.' });
});

router.getNextExchangeNumber = getNextExchangeNumber;
module.exports = router;
