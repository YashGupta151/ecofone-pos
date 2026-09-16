const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');
const exchangeRouter = require('./exchanges');
const getNextExchangeNumber = exchangeRouter.getNextExchangeNumber;

// Helper to generate next unique sequential invoice number (Rule 5)
function getNextInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `ECO-${currentYear}-`;

  const lastSale = db.prepare(`
    SELECT invoice_number FROM sales
    WHERE invoice_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextSequence = 1;
  if (lastSale && lastSale.invoice_number) {
    const parts = lastSale.invoice_number.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(6, '0')}`;
}

// Helper to generate sale number
function getNextSaleNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `SL-${currentYear}-`;

  const last = db.prepare(`
    SELECT sale_number FROM sales
    WHERE sale_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextSequence = 1;
  if (last && last.sale_number) {
    const parts = last.sale_number.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(6, '0')}`;
}

// GET /api/sales (List sales with filters)
router.get('/', authenticateToken, (req, res) => {
  const { store_id, date_from, date_to, search, page = 1, limit = 50 } = req.query;

  let baseQuery = `
    SELECT sa.*, s.name as store_name, s.code as store_code, s.city as store_city,
           u.full_name as employee_name,
           c.full_name as customer_name, c.phone as customer_phone
    FROM sales sa
    JOIN stores s ON sa.store_id = s.id
    JOIN users u ON sa.employee_id = u.id
    JOIN customers c ON sa.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Employee restricted to their store
  if (req.user.role !== 'admin') {
    baseQuery += ` AND sa.store_id = ?`;
    params.push(req.user.assigned_store_id);
  } else if (store_id) {
    baseQuery += ` AND sa.store_id = ?`;
    params.push(parseInt(store_id));
  }

  if (date_from) {
    baseQuery += ` AND DATE(sa.sale_date) >= ?`;
    params.push(date_from);
  }
  if (date_to) {
    baseQuery += ` AND DATE(sa.sale_date) <= ?`;
    params.push(date_to);
  }

  if (search) {
    baseQuery += ` AND (sa.invoice_number LIKE ? OR sa.sale_number LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)`;
    const st = `%${search.trim()}%`;
    params.push(st, st, st, st);
  }

  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery})`;
  const countResult = db.prepare(countQuery).get(...params);

  const offset = (parseInt(page) - 1) * parseInt(limit);
  baseQuery += ` ORDER BY sa.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const sales = db.prepare(baseQuery).all(...params);

  res.json({
    success: true,
    sales,
    pagination: {
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.total / parseInt(limit))
    }
  });
});

// GET /api/sales/:id (Full Invoice Details)
router.get('/:id', authenticateToken, (req, res) => {
  const saleId = parseInt(req.params.id);

  const sale = db.prepare(`
    SELECT sa.*, s.name as store_name, s.code as store_code, s.address as store_address,
           s.city as store_city, s.state as store_state, s.pincode as store_pincode,
           s.phone as store_phone, s.email as store_email, s.gstin as store_gstin,
           u.full_name as employee_name, u.employee_id as employee_code,
           c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
           c.address as customer_address, c.city as customer_city, c.state as customer_state,
           c.gstin as customer_gstin
    FROM sales sa
    JOIN stores s ON sa.store_id = s.id
    JOIN users u ON sa.employee_id = u.id
    JOIN customers c ON sa.customer_id = c.id
    WHERE sa.id = ?
  `).get(saleId);

  if (!sale) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== sale.store_id) {
    return res.status(403).json({ success: false, message: 'Access denied to invoices from other stores.' });
  }

  const items = db.prepare(`
    SELECT si.*, p.ram, p.storage, p.color, p.serial_number, p.internal_product_id
    FROM sale_items si
    JOIN phone_inventory p ON si.phone_id = p.id
    WHERE si.sale_id = ?
  `).all(saleId);

  const payments = db.prepare(`
    SELECT * FROM payments WHERE sale_id = ?
  `).all(saleId);

  // Fetch company settings for invoice branding
  const companySettings = db.prepare(`SELECT key, value FROM settings`).all();
  const settingsObj = {};
  companySettings.forEach(s => settingsObj[s.key] = s.value);

  const exchange = db.prepare(`
    SELECT * FROM exchanged_phones WHERE sale_id = ?
  `).get(saleId);

  res.json({
    success: true,
    sale,
    items,
    payments,
    exchange: exchange || null,
    company: settingsObj
  });
});

// POST /api/sales (COMPLETE SALE / POS BILLING)
router.post('/', authenticateToken, (req, res) => {
  const { customer, items, payment_method, reference_number, notes, exchange_device } = req.body;

  if (!customer || !items || !items.length || !payment_method) {
    return res.status(400).json({ success: false, message: 'Customer details, products, and payment method are required.' });
  }

  const storeId = req.user.role === 'admin' ? (req.body.store_id || req.user.assigned_store_id || 1) : req.user.assigned_store_id;
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'Valid store assignment required.' });
  }

  const store = db.prepare(`SELECT * FROM stores WHERE id = ?`).get(storeId);
  if (!store || store.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Selected store is currently inactive.' });
  }

  // Use a transactional execution
  const executeSale = db.transaction(() => {
    // 1. Resolve or Create Customer
    let customerId = customer.id;
    if (!customerId) {
      // Check by phone number first
      const existingCustomer = db.prepare(`SELECT id FROM customers WHERE phone = ?`).get(customer.phone.trim());
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const cCount = db.prepare(`SELECT COUNT(*) as cnt FROM customers`).get();
        const custCode = `CUST-${String(cCount.cnt + 1).padStart(4, '0')}`;
        const cRes = db.prepare(`
          INSERT INTO customers (customer_code, full_name, phone, email, address, city, state, pincode, gstin, id_proof_type, id_proof_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          custCode,
          customer.full_name.trim(),
          customer.phone.trim(),
          customer.email || '',
          customer.address || '',
          customer.city || store.city,
          customer.state || store.state,
          customer.pincode || '',
          customer.gstin || null,
          customer.id_proof_type || exchange_device?.customer_id_proof_type || null,
          customer.id_proof_number || exchange_device?.customer_id_proof_number || null
        );
        customerId = cRes.lastInsertRowid;
      }
    }

    // Update customer KYC / ID proof if supplied with exchange
    if (customer.id_proof_type || customer.id_proof_number || exchange_device?.customer_id_proof_type || exchange_device?.customer_id_proof_number) {
      db.prepare(`
        UPDATE customers
        SET id_proof_type = COALESCE(?, id_proof_type),
            id_proof_number = COALESCE(?, id_proof_number),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        exchange_device?.customer_id_proof_type || customer.id_proof_type || null,
        exchange_device?.customer_id_proof_number || customer.id_proof_number || null,
        customerId
      );
    }

    const custRecord = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customerId);

    // 2. Validate all phones
    // Rule 1 & Rule 2: One IMEI cannot be sold twice; A SOLD phone cannot be sold again
    const defaultTaxSetting = db.prepare(`SELECT value FROM settings WHERE key = 'default_tax_rate'`).get();
    const systemDefaultTaxRate = defaultTaxSetting && !isNaN(parseFloat(defaultTaxSetting.value)) ? parseFloat(defaultTaxSetting.value) : 18.0;

    let subtotal = 0;
    let discountTotal = 0;
    let taxableAmountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let totalTaxAll = 0;
    let grandTotalAll = 0;

    const validatedItems = [];

    for (const item of items) {
      const phone = db.prepare(`SELECT * FROM phone_inventory WHERE id = ?`).get(item.phone_id);

      if (!phone) {
        throw new Error(`Device ID ${item.phone_id} does not exist in inventory.`);
      }

      if (phone.stock_status !== 'AVAILABLE') {
        throw new Error(`Device ${phone.brand} ${phone.model} (IMEI: ${phone.imei1}) is currently ${phone.stock_status}. Cannot be sold again!`);
      }

      if (phone.current_store_id !== storeId) {
        throw new Error(`Device (IMEI: ${phone.imei1}) is registered under a different store. Please initiate a stock transfer first.`);
      }

      const sPrice = parseFloat(item.selling_price || phone.selling_price);
      const disc = parseFloat(item.discount || 0);
      const taxable = sPrice - disc;
      const tRate = (item.tax_rate !== undefined && item.tax_rate !== null && !isNaN(parseFloat(item.tax_rate)))
        ? parseFloat(item.tax_rate)
        : systemDefaultTaxRate;

      // Tax Logic: If customer state != store state -> IGST, else CGST + SGST
      const isInterState = custRecord.state && store.state && custRecord.state.toLowerCase() !== store.state.toLowerCase();
      let cgst = 0, sgst = 0, igst = 0;
      const taxAmount = Math.round((taxable * (tRate / 100)) * 100) / 100;

      if (isInterState) {
        igst = taxAmount;
      } else {
        cgst = Math.round((taxAmount / 2) * 100) / 100;
        sgst = Math.round((taxAmount - cgst) * 100) / 100;
      }

      const finalPrice = taxable + taxAmount;

      subtotal += sPrice;
      discountTotal += disc;
      taxableAmountTotal += taxable;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;
      totalTaxAll += taxAmount;
      grandTotalAll += finalPrice;

      validatedItems.push({
        phone,
        selling_price: sPrice,
        discount: disc,
        taxable_amount: taxable,
        tax_rate: tRate,
        cgst,
        sgst,
        igst,
        total_tax: taxAmount,
        final_price: finalPrice
      });
    }

    // 3. Handle Exchange Device if provided
    let exchangeAmount = 0;
    let exchangeNumber = null;
    let exchangeRecord = null;

    if (exchange_device && exchange_device.brand && exchange_device.model && exchange_device.imei1) {
      exchangeAmount = Math.max(0, parseFloat(exchange_device.exchange_value) || 0);

      const imeiClean = exchange_device.imei1.trim();
      const existingInStock = db.prepare(`SELECT id, stock_status FROM phone_inventory WHERE imei1 = ? AND stock_status = 'AVAILABLE'`).get(imeiClean);
      if (existingInStock) {
        throw new Error(`Device with IMEI ${imeiClean} is already registered in active store inventory.`);
      }

      exchangeNumber = getNextExchangeNumber();
    }

    const netPayable = Math.max(0, grandTotalAll - exchangeAmount);

    // 4. Generate Sequential Numbers
    const invoiceNumber = getNextInvoiceNumber();
    const saleNumber = getNextSaleNumber();

    // 5. Insert into Sales
    const saleInsert = db.prepare(`
      INSERT INTO sales (
        sale_number, invoice_number, sale_date, store_id, employee_id, customer_id,
        subtotal, discount_total, taxable_amount, cgst, sgst, igst, total_tax, grand_total,
        exchange_amount, net_payable,
        payment_status, status, notes
      ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', 'COMPLETED', ?)
    `).run(
      saleNumber, invoiceNumber, storeId, req.user.id, customerId,
      subtotal, discountTotal, taxableAmountTotal, cgstTotal, sgstTotal, igstTotal, totalTaxAll, grandTotalAll,
      exchangeAmount, netPayable,
      notes || ''
    );
    const saleId = saleInsert.lastInsertRowid;

    // Insert Exchanged Phone record if exchange occurred
    if (exchangeNumber) {
      const accessoriesStr = Array.isArray(exchange_device.accessories_included)
        ? exchange_device.accessories_included.join(', ')
        : (exchange_device.accessories_included || '');

      const exInsert = db.prepare(`
        INSERT INTO exchanged_phones (
          exchange_number, sale_id, invoice_number, store_id, employee_id, customer_id,
          customer_name, customer_phone, customer_email, customer_address,
          customer_id_proof_type, customer_id_proof_number,
          brand, model, variant, color, imei1, imei2, serial_number,
          condition_grade, battery_health, device_condition, functional_issues, accessories_included,
          exchange_value, status, notes
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, 'IN_STOCK', ?
        )
      `).run(
        exchangeNumber,
        saleId,
        invoiceNumber,
        storeId,
        req.user.id,
        customerId,
        custRecord.full_name || customer.full_name,
        custRecord.phone || customer.phone,
        custRecord.email || customer.email || '',
        custRecord.address || customer.address || '',
        exchange_device.customer_id_proof_type || custRecord.id_proof_type || customer.id_proof_type || null,
        exchange_device.customer_id_proof_number || custRecord.id_proof_number || customer.id_proof_number || null,
        exchange_device.brand.trim(),
        exchange_device.model.trim(),
        exchange_device.variant ? exchange_device.variant.trim() : '',
        exchange_device.color ? exchange_device.color.trim() : '',
        exchange_device.imei1.trim(),
        exchange_device.imei2 ? exchange_device.imei2.trim() : null,
        exchange_device.serial_number ? exchange_device.serial_number.trim() : null,
        exchange_device.condition_grade || 'Grade B',
        exchange_device.battery_health ? String(exchange_device.battery_health).trim() : null,
        exchange_device.device_condition || '',
        exchange_device.functional_issues || '',
        accessoriesStr,
        exchangeAmount,
        exchange_device.notes || `Exchanged against Bill #${invoiceNumber}`
      );
      exchangeRecord = { id: exInsert.lastInsertRowid, exchange_number: exchangeNumber, exchange_value: exchangeAmount };
    }

    // 6. Insert Sale Items and Update Inventory (Rule 3: stock_status -> SOLD)
    const saleItemInsert = db.prepare(`
      INSERT INTO sale_items (
        sale_id, phone_id, imei1, brand, model, variant, condition_grade,
        unit_cost, selling_price, discount, taxable_amount, tax_rate, cgst, sgst, igst, total_tax, final_price,
        warranty_period_months, warranty_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateInventory = db.prepare(`
      UPDATE phone_inventory
      SET stock_status = 'SOLD', date_sold = DATE('now'), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const warrantyInsert = db.prepare(`
      INSERT INTO warranties (
        phone_id, imei1, customer_id, sale_id, invoice_number, warranty_period_months,
        start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), DATE('now', '+6 months'), 'Active')
    `);

    for (const v of validatedItems) {
      saleItemInsert.run(
        saleId,
        v.phone.id,
        v.phone.imei1,
        v.phone.brand,
        v.phone.model,
        v.phone.variant,
        v.phone.condition_grade,
        v.phone.total_cost, // Stored true cost for profit calculation!
        v.selling_price,
        v.discount,
        v.taxable_amount,
        v.tax_rate,
        v.cgst,
        v.sgst,
        v.igst,
        v.total_tax,
        v.final_price,
        v.phone.warranty_period_months || 6,
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      // Rule 3: Inventory becomes SOLD
      updateInventory.run(v.phone.id);

      // Register Warranty
      warrantyInsert.run(
        v.phone.id,
        v.phone.imei1,
        customerId,
        saleId,
        invoiceNumber,
        v.phone.warranty_period_months || 6
      );
    }

    // 7. Record Payment
    db.prepare(`
      INSERT INTO payments (sale_id, payment_method, amount, reference_number, payment_date)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(saleId, payment_method, netPayable, reference_number || null);

    // 8. Update Customer Total Spent
    db.prepare(`
      UPDATE customers
      SET total_purchases = total_purchases + ?,
          total_spent = total_spent + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(validatedItems.length, grandTotalAll, customerId);

    // 9. Audit Log
    logAudit(
      req.user.id,
      req.user.username,
      'COMPLETE_SALE',
      storeId,
      'SALE',
      saleId,
      { invoiceNumber, itemsCount: validatedItems.length, grandTotal: grandTotalAll, exchangeAmount, netPayable, payment_method, exchangeNumber },
      req
    );

    return {
      saleId,
      invoiceNumber,
      saleNumber,
      grandTotal: grandTotalAll,
      exchangeAmount,
      netPayable,
      exchange: exchangeRecord
    };
  });

  try {
    const result = executeSale();
    res.status(201).json({
      success: true,
      message: 'Sale completed successfully!',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/sales/:id/void (Void Invoice - Admin only, Rule 6)
router.post('/:id/void', authenticateToken, requireAdmin, (req, res) => {
  const saleId = parseInt(req.params.id);
  const { reason } = req.body;

  const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(saleId);
  if (!sale) {
    return res.status(404).json({ success: false, message: 'Sale not found.' });
  }

  if (sale.status === 'VOID') {
    return res.status(400).json({ success: false, message: 'This invoice has already been voided.' });
  }

  const voidTransaction = db.transaction(() => {
    // 1. Mark sale as VOID
    db.prepare(`UPDATE sales SET status = 'VOID', notes = COALESCE(notes, '') || ' [VOIDED: ' || ? || ']' WHERE id = ?`).run(reason || 'Admin voided', saleId);

    // 2. Restore phones in inventory to AVAILABLE
    const saleItems = db.prepare(`SELECT phone_id FROM sale_items WHERE sale_id = ?`).all(saleId);
    const restoreStmt = db.prepare(`UPDATE phone_inventory SET stock_status = 'AVAILABLE', date_sold = NULL WHERE id = ?`);

    for (const it of saleItems) {
      restoreStmt.run(it.phone_id);
    }

    // 3. Mark warranties as Void
    db.prepare(`UPDATE warranties SET status = 'Void' WHERE sale_id = ?`).run(saleId);

    // 4. Deduct customer metrics
    db.prepare(`
      UPDATE customers
      SET total_purchases = MAX(0, total_purchases - ?),
          total_spent = MAX(0, total_spent - ?)
      WHERE id = ?
    `).run(saleItems.length, sale.grand_total, sale.customer_id);

    logAudit(req.user.id, req.user.username, 'VOID_INVOICE', sale.store_id, 'SALE', saleId, { invoiceNumber: sale.invoice_number, reason }, req);
  });

  try {
    voidTransaction();
    res.json({ success: true, message: 'Invoice voided and inventory successfully restored.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
