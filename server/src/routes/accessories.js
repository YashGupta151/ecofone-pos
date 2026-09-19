const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');
const { calculateInclusiveGst, calculateAccessoryPurchaseBatch } = require('../utils/tax');

// Helper to generate next unique sequential accessory ID
function getNextAccessoryId() {
  const last = db.prepare(`SELECT accessory_id FROM accessories ORDER BY id DESC LIMIT 1`).get();
  let nextSeq = 1;
  if (last && last.accessory_id) {
    const parts = last.accessory_id.split('-');
    if (parts.length === 2) {
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }
  }
  return `ACC-${String(nextSeq).padStart(5, '0')}`;
}

// GET /api/accessories (List accessories with filters)
router.get('/', authenticateToken, (req, res) => {
  const { store_id, category, status, search, page = 1, limit = 50 } = req.query;

  let baseQuery = `
    SELECT a.*, s.name as store_name, s.code as store_code, s.city as store_city,
           sup.name as db_supplier_name
    FROM accessories a
    JOIN stores s ON a.store_id = s.id
    LEFT JOIN suppliers sup ON a.supplier_id = sup.id
    WHERE 1=1
  `;
  const params = [];

  // Store filter
  if (req.user.role !== 'admin') {
    baseQuery += ` AND a.store_id = ?`;
    params.push(req.user.assigned_store_id);
  } else if (store_id) {
    baseQuery += ` AND a.store_id = ?`;
    params.push(parseInt(store_id));
  }

  if (category) {
    baseQuery += ` AND a.category = ?`;
    params.push(category);
  }

  if (status) {
    baseQuery += ` AND a.status = ?`;
    params.push(status);
  }

  if (search) {
    baseQuery += ` AND (a.name LIKE ? OR a.sku LIKE ? OR a.barcode LIKE ? OR a.brand LIKE ? OR a.variant LIKE ?)`;
    const st = `%${search.trim()}%`;
    params.push(st, st, st, st, st);
  }

  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery})`;
  const countResult = db.prepare(countQuery).get(...params);

  const offset = (parseInt(page) - 1) * parseInt(limit);
  baseQuery += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const accessories = db.prepare(baseQuery).all(...params);

  // Distinct categories for filter dropdown
  const categories = db.prepare(`SELECT DISTINCT category FROM accessories ORDER BY category ASC`).all().map(c => c.category);

  res.json({
    success: true,
    accessories,
    categories,
    pagination: {
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.total / parseInt(limit))
    }
  });
});

// GET /api/accessories/categories (List all distinct categories)
router.get('/categories', authenticateToken, (req, res) => {
  const categories = db.prepare(`SELECT DISTINCT category FROM accessories WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`).all().map(c => c.category);
  res.json({ success: true, categories });
});

// GET /api/accessories/:id (Single accessory details)
router.get('/:id', authenticateToken, (req, res) => {
  const accessory = db.prepare(`
    SELECT a.*, s.name as store_name, s.code as store_code, s.city as store_city,
           sup.name as db_supplier_name
    FROM accessories a
    JOIN stores s ON a.store_id = s.id
    LEFT JOIN suppliers sup ON a.supplier_id = sup.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!accessory) {
    return res.status(404).json({ success: false, message: 'Accessory not found' });
  }

  // Fetch recent purchase history
  const purchases = db.prepare(`
    SELECT ap.*, s.name as store_name
    FROM accessory_purchases ap
    LEFT JOIN stores s ON ap.store_id = s.id
    WHERE ap.accessory_id = ?
    ORDER BY ap.id DESC LIMIT 10
  `).all(accessory.id);

  res.json({
    success: true,
    accessory,
    purchases
  });
});

// POST /api/accessories (Create new accessory - ALWAYS BRAND NEW & 18% GST INCLUSIVE)
router.post('/', authenticateToken, (req, res) => {
  const {
    name,
    category,
    brand,
    variant,
    description,
    sku,
    barcode,
    supplier_id,
    supplier_name,
    purchase_price_inclusive,
    mrp_inclusive,
    selling_price_inclusive,
    quantity = 0,
    minimum_stock = 5,
    reorder_level = 10,
    store_id,
    warranty_period = '6 Months'
  } = req.body;

  if (!name || !category || !brand) {
    return res.status(400).json({ success: false, message: 'Product Name, Category, and Brand are required.' });
  }

  const targetStoreId = req.user.role === 'admin' ? (store_id || req.user.assigned_store_id) : req.user.assigned_store_id;
  if (!targetStoreId) {
    return res.status(400).json({ success: false, message: 'Target store is required.' });
  }

  const pInclusive = Math.max(0, parseFloat(purchase_price_inclusive) || 0);
  const sInclusive = Math.max(0, parseFloat(selling_price_inclusive) || 0);
  const mInclusive = Math.max(sInclusive, parseFloat(mrp_inclusive) || sInclusive);

  // Business Rule 2 & 3: Taxable value = Inclusive Price * 100 / 118, GST = Inclusive - Taxable
  const pCalc = calculateInclusiveGst(pInclusive, 18.0);
  const sCalc = calculateInclusiveGst(sInclusive, 18.0);

  const accessoryId = getNextAccessoryId();
  const generatedSku = sku && sku.trim() ? sku.trim().toUpperCase() : `SKU-${category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const cleanBarcode = barcode && barcode.trim() ? barcode.trim() : null;

  // Check SKU uniqueness
  const existingSku = db.prepare(`SELECT id FROM accessories WHERE sku = ?`).get(generatedSku);
  if (existingSku) {
    return res.status(400).json({ success: false, message: `An accessory with SKU "${generatedSku}" already exists.` });
  }

  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  let status = 'In Stock';
  if (qty === 0) status = 'Out of Stock';
  else if (qty <= (parseInt(minimum_stock, 10) || 5)) status = 'Low Stock';

  // Ensure supplier_id exists in suppliers table if provided
  let targetSupplierId = null;
  if (supplier_id) {
    const validSup = db.prepare(`SELECT id FROM suppliers WHERE id = ?`).get(supplier_id);
    if (validSup) targetSupplierId = validSup.id;
  }

  const insert = db.prepare(`
    INSERT INTO accessories (
      accessory_id, sku, barcode, name, category, brand, variant, description,
      supplier_id, supplier_name,
      purchase_price_inclusive, purchase_taxable_value, purchase_gst,
      mrp_inclusive, selling_price_inclusive, selling_taxable_value, selling_gst,
      gst_rate, price_includes_gst, quantity, minimum_stock, reorder_level,
      store_id, warranty_period, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const result = insert.run(
    accessoryId, generatedSku, cleanBarcode, name.trim(), category.trim(), brand.trim(),
    variant ? variant.trim() : null, description ? description.trim() : null,
    targetSupplierId, supplier_name || null,
    pCalc.inclusivePrice, pCalc.taxableValue, pCalc.gstAmount,
    mInclusive, sCalc.inclusivePrice, sCalc.taxableValue, sCalc.gstAmount,
    18.0, 1, qty, parseInt(minimum_stock, 10) || 5, parseInt(reorder_level, 10) || 10,
    targetStoreId, warranty_period, status
  );

  const newAccessory = db.prepare(`SELECT * FROM accessories WHERE id = ?`).get(result.lastInsertRowid);

  // If initial quantity > 0 and purchase price > 0, log an initial purchase batch
  if (qty > 0 && pInclusive > 0) {
    const batch = calculateAccessoryPurchaseBatch(qty, pInclusive, 18.0);
    db.prepare(`
      INSERT INTO accessory_purchases (
        purchase_order_no, supplier_id, supplier_name, accessory_id,
        quantity, purchase_price_inclusive, taxable_value_per_unit, gst_per_unit,
        total_purchase_value, total_taxable_value, total_gst, store_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `PO-INIT-${Date.now().toString().slice(-6)}`,
      targetSupplierId, supplier_name || 'Initial Stock Entry',
      newAccessory.id, qty, batch.unit_purchase_price_inclusive, batch.unit_taxable_value,
      batch.unit_gst, batch.total_purchase_value, batch.total_taxable_value, batch.total_gst,
      targetStoreId
    );
  }

  logAudit(req.user.id, req.user.username, 'CREATE_ACCESSORY', targetStoreId, 'accessories', newAccessory.id, `Created accessory ${newAccessory.name} (${newAccessory.sku}) - Price: ₹${newAccessory.selling_price_inclusive} (18% GST Included)`, req.ip);

  res.status(201).json({
    success: true,
    message: 'Accessory added successfully (18% GST Inclusive)',
    accessory: newAccessory
  });
});

// POST /api/accessories/bulk-upload (Bulk Excel/CSV Upload for Brand-New Accessories)
router.post('/bulk-upload', authenticateToken, (req, res) => {
  const { accessories: items, default_store_id, default_supplier_name } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No accessory records provided in upload.' });
  }

  // Determine fallback store
  const fallbackStoreId = (req.user.role === 'admin' && default_store_id)
    ? parseInt(default_store_id, 10)
    : (req.user.assigned_store_id || 1);

  // Stores cache for resolving store by name or code if specified in excel
  const allStores = db.prepare(`SELECT id, code, name FROM stores`).all();
  const storeMap = {};
  allStores.forEach(s => {
    storeMap[String(s.id)] = s.id;
    storeMap[s.code.toUpperCase()] = s.id;
    storeMap[s.name.toUpperCase()] = s.id;
  });

  // Fetch all existing SKUs and Barcodes for fast uniqueness checking
  const existingRows = db.prepare(`SELECT sku, barcode FROM accessories`).all();
  const existingSkuSet = new Set();
  const existingBarcodeSet = new Set();
  existingRows.forEach(r => {
    if (r.sku) existingSkuSet.add(r.sku.trim().toUpperCase());
    if (r.barcode) existingBarcodeSet.add(r.barcode.trim().toUpperCase());
  });

  const importedAccessories = [];
  const failedRows = [];

  let countRow = db.prepare(`SELECT COUNT(*) as cnt FROM accessories`).get();
  let nextSeq = (countRow ? countRow.cnt : 0) + 1;

  const insertStmt = db.prepare(`
    INSERT INTO accessories (
      accessory_id, sku, barcode, name, category, brand, variant, description,
      supplier_id, supplier_name,
      purchase_price_inclusive, purchase_taxable_value, purchase_gst,
      mrp_inclusive, selling_price_inclusive, selling_taxable_value, selling_gst,
      gst_rate, price_includes_gst, quantity, minimum_stock, reorder_level,
      store_id, warranty_period, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      18.0, 1, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const purchaseBatchStmt = db.prepare(`
    INSERT INTO accessory_purchases (
      purchase_order_no, supplier_id, supplier_name, accessory_id,
      quantity, purchase_price_inclusive, taxable_value_per_unit, gst_per_unit,
      total_purchase_value, total_taxable_value, total_gst, store_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const executeBulk = db.transaction(() => {
      items.forEach((item, idx) => {
        const rowNum = idx + 1;
        const name = item.name ? String(item.name).trim() : '';
        const category = item.category ? String(item.category).trim() : 'Other Accessories';
        const brand = item.brand ? String(item.brand).trim() : 'Generic';
        const variant = item.variant ? String(item.variant).trim() : '';
        const description = item.description ? String(item.description).trim() : '';

        if (!name) {
          failedRows.push({ row: rowNum, item: name || `Row ${rowNum}`, error: 'Missing product name' });
          return;
        }

        // Pricing (strictly GST-inclusive)
        const parsePrice = (v) => {
          if (v === null || v === undefined || v === '') return 0;
          if (typeof v === 'number') return isNaN(v) ? 0 : v;
          let str = String(v).trim().replace(/^(₹|rs\.?|inr|\$)\s*/i, '').replace(/,/g, '');
          const m = str.match(/-?\d+(\.\d+)?/);
          return m ? parseFloat(m[0]) : 0;
        };

        const pInclusive = Math.max(0, parsePrice(item.purchase_price_inclusive ?? item.purchase_price ?? item.cost));
        const sInclusive = Math.max(0, parsePrice(item.selling_price_inclusive ?? item.selling_price ?? item.price));
        const mInclusive = Math.max(sInclusive, parsePrice(item.mrp_inclusive ?? item.mrp) || sInclusive);

        if (sInclusive <= 0) {
          failedRows.push({ row: rowNum, item: name, error: 'Selling price must be greater than ₹0' });
          return;
        }

        // Calculate 18% inclusive GST
        const pCalc = calculateInclusiveGst(pInclusive, 18.0);
        const sCalc = calculateInclusiveGst(sInclusive, 18.0);

        // Store resolution
        let storeId = fallbackStoreId;
        if (item.store_code) {
          const matched = storeMap[String(item.store_code).trim().toUpperCase()];
          if (matched) storeId = matched;
        } else if (item.store_id) {
          const matched = storeMap[String(item.store_id).trim()];
          if (matched) storeId = matched;
        }

        // Supplier resolution
        const supplierName = item.supplier_name || item.supplier || default_supplier_name || 'Direct Wholesale';

        // SKU Generation & Uniqueness
        let finalSku = item.sku ? String(item.sku).trim().toUpperCase() : '';
        if (!finalSku) {
          const brandCode = brand.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'ECO';
          const catCode = category.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'ACC';
          finalSku = `${brandCode}-${catCode}-${String(nextSeq).padStart(4, '0')}`;
        }

        // Ensure unique SKU
        let skuCandidate = finalSku;
        let counter = 1;
        while (existingSkuSet.has(skuCandidate)) {
          skuCandidate = `${finalSku}-${counter}`;
          counter++;
        }
        finalSku = skuCandidate;
        existingSkuSet.add(finalSku);

        // Barcode
        const barcode = item.barcode ? String(item.barcode).trim() : null;

        // Unique accessory ID
        const accessoryId = `ACC-${String(nextSeq).padStart(5, '0')}`;
        nextSeq++;

        // Quantity & Stock Status
        const qty = Math.max(0, parseInt(item.quantity, 10) || 10);
        const minStock = Math.max(1, parseInt(item.minimum_stock, 10) || 5);
        const reorderLevel = Math.max(minStock, parseInt(item.reorder_level, 10) || 10);
        const warranty = item.warranty_period ? String(item.warranty_period).trim() : '6 Months Brand Warranty';

        let status = 'In Stock';
        if (qty === 0) status = 'Out of Stock';
        else if (qty <= minStock) status = 'Low Stock';

        // Insert
        const insertRes = insertStmt.run(
          accessoryId, finalSku, barcode, name, category, brand, variant, description,
          null, supplierName,
          pCalc.inclusivePrice, pCalc.taxableValue, pCalc.gstAmount,
          mInclusive, sCalc.inclusivePrice, sCalc.taxableValue, sCalc.gstAmount,
          qty, minStock, reorderLevel,
          storeId, warranty, status
        );

        const newId = insertRes.lastInsertRowid;

        // Log initial purchase batch
        if (qty > 0 && pInclusive > 0) {
          const batch = calculateAccessoryPurchaseBatch(qty, pInclusive, 18.0);
          purchaseBatchStmt.run(
            `PO-BULK-${Date.now().toString().slice(-6)}-${idx + 1}`,
            null, supplierName,
            newId, qty, batch.unit_purchase_price_inclusive, batch.unit_taxable_value,
            batch.unit_gst, batch.total_purchase_value, batch.total_taxable_value, batch.total_gst,
            storeId
          );
        }

        importedAccessories.push({
          id: newId,
          accessory_id: accessoryId,
          sku: finalSku,
          name,
          category,
          brand,
          selling_price_inclusive: sCalc.inclusivePrice,
          quantity: qty,
          store_id: storeId
        });
      });
    });

    executeBulk();

    logAudit(
      req.user.id,
      req.user.username,
      'BULK_UPLOAD_ACCESSORIES',
      fallbackStoreId,
      'accessories',
      null,
      `Bulk uploaded ${importedAccessories.length} accessories (${failedRows.length} failed). All 18% GST-inclusive.`,
      req.ip
    );

    res.json({
      success: true,
      message: `Successfully imported ${importedAccessories.length} accessories.`,
      importedCount: importedAccessories.length,
      failedCount: failedRows.length,
      imported: importedAccessories,
      failed: failedRows
    });
  } catch (err) {
    console.error('Bulk upload transaction failed:', err);
    res.status(500).json({ success: false, message: 'Database transaction error during bulk upload: ' + err.message });
  }
});

// PUT /api/accessories/:id (Update accessory details, stock & inclusive prices)
router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare(`SELECT * FROM accessories WHERE id = ?`).get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Accessory not found' });
  }

  if (req.user.role !== 'admin' && req.user.assigned_store_id !== existing.store_id) {
    return res.status(403).json({ success: false, message: 'You can only edit accessories in your assigned store.' });
  }

  const {
    name,
    category,
    brand,
    variant,
    description,
    barcode,
    supplier_id,
    supplier_name,
    purchase_price_inclusive,
    mrp_inclusive,
    selling_price_inclusive,
    quantity,
    minimum_stock,
    reorder_level,
    store_id,
    warranty_period
  } = req.body;

  const pInclusive = purchase_price_inclusive !== undefined ? Math.max(0, parseFloat(purchase_price_inclusive) || 0) : existing.purchase_price_inclusive;
  const sInclusive = selling_price_inclusive !== undefined ? Math.max(0, parseFloat(selling_price_inclusive) || 0) : existing.selling_price_inclusive;
  const mInclusive = mrp_inclusive !== undefined ? Math.max(sInclusive, parseFloat(mrp_inclusive) || sInclusive) : existing.mrp_inclusive;

  const pCalc = calculateInclusiveGst(pInclusive, 18.0);
  const sCalc = calculateInclusiveGst(sInclusive, 18.0);

  const newQty = quantity !== undefined ? Math.max(0, parseInt(quantity, 10) || 0) : existing.quantity;
  const minStock = minimum_stock !== undefined ? Math.max(1, parseInt(minimum_stock, 10) || 5) : existing.minimum_stock;
  const reorder = reorder_level !== undefined ? Math.max(minStock, parseInt(reorder_level, 10) || 10) : existing.reorder_level;

  let newStatus = 'In Stock';
  if (newQty === 0) newStatus = 'Out of Stock';
  else if (newQty <= minStock) newStatus = 'Low Stock';

  // Safely resolve store_id
  let targetStoreId = existing.store_id;
  if (req.user.role === 'admin' && store_id) {
    const validStore = db.prepare(`SELECT id FROM stores WHERE id = ?`).get(store_id);
    if (validStore) targetStoreId = validStore.id;
  }

  // Safely resolve supplier_id to satisfy foreign key constraints
  let targetSupplierId = null;
  if (supplier_id) {
    const validSup = db.prepare(`SELECT id FROM suppliers WHERE id = ?`).get(supplier_id);
    if (validSup) targetSupplierId = validSup.id;
  } else if (existing.supplier_id) {
    const validExisting = db.prepare(`SELECT id FROM suppliers WHERE id = ?`).get(existing.supplier_id);
    if (validExisting) targetSupplierId = validExisting.id;
  }

  db.prepare(`
    UPDATE accessories
    SET name = COALESCE(?, name),
        category = COALESCE(?, category),
        brand = COALESCE(?, brand),
        variant = COALESCE(?, variant),
        description = COALESCE(?, description),
        barcode = COALESCE(?, barcode),
        supplier_id = ?,
        supplier_name = COALESCE(?, supplier_name),
        purchase_price_inclusive = ?,
        purchase_taxable_value = ?,
        purchase_gst = ?,
        mrp_inclusive = ?,
        selling_price_inclusive = ?,
        selling_taxable_value = ?,
        selling_gst = ?,
        quantity = ?,
        minimum_stock = ?,
        reorder_level = ?,
        store_id = ?,
        warranty_period = COALESCE(?, warranty_period),
        status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    category ? category.trim() : null,
    brand ? brand.trim() : null,
    variant !== undefined ? variant : null,
    description !== undefined ? description : null,
    barcode !== undefined ? barcode : null,
    targetSupplierId,
    supplier_name !== undefined ? supplier_name : null,
    pCalc.inclusivePrice, pCalc.taxableValue, pCalc.gstAmount,
    mInclusive, sCalc.inclusivePrice, sCalc.taxableValue, sCalc.gstAmount,
    newQty,
    minStock,
    reorder,
    targetStoreId,
    warranty_period !== undefined ? warranty_period : null,
    newStatus,
    existing.id
  );

  const updated = db.prepare(`SELECT * FROM accessories WHERE id = ?`).get(existing.id);

  logAudit(req.user.id, req.user.username, 'UPDATE_ACCESSORY', updated.store_id, 'accessories', existing.id, `Updated accessory ${updated.name} (${updated.sku}) - Qty: ${updated.quantity}`, req.ip);

  res.json({
    success: true,
    message: 'Accessory updated successfully',
    accessory: updated
  });
});

// DELETE /api/accessories/:id (Delete accessory if no sales history)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const existing = db.prepare(`SELECT * FROM accessories WHERE id = ?`).get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Accessory not found' });
  }

  // Check if accessory has been sold
  const soldCount = db.prepare(`SELECT COUNT(*) as cnt FROM sale_items WHERE accessory_id = ?`).get(existing.id);
  if (soldCount && soldCount.cnt > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete accessory because ${soldCount.cnt} unit(s) have already been sold in previous invoices. You can set stock quantity to 0 instead.`
    });
  }

  db.prepare(`DELETE FROM accessory_purchases WHERE accessory_id = ?`).run(existing.id);
  db.prepare(`DELETE FROM accessories WHERE id = ?`).run(existing.id);

  logAudit(req.user.id, req.user.username, 'DELETE_ACCESSORY', existing.store_id, 'accessories', existing.id, `Deleted accessory ${existing.name} (${existing.sku})`, req.ip);

  res.json({
    success: true,
    message: 'Accessory deleted successfully'
  });
});

// POST /api/accessories/purchase (Restock / Batch Purchase Entry)
// Business Rule 7: Example: 100 units of Type-C cable at ₹590 per unit.
// Taxable per unit = ₹500, GST = ₹90. Total purchase value = ₹59,000. Total Taxable = ₹50,000, Total GST = ₹9,000.
// NEVER add additional GST.
router.post('/purchase', authenticateToken, (req, res) => {
  const {
    accessory_id,
    quantity,
    purchase_price_inclusive,
    purchase_order_no,
    supplier_id,
    supplier_name,
    notes
  } = req.body;

  if (!accessory_id) {
    return res.status(400).json({ success: false, message: 'Accessory ID is required.' });
  }

  const accessory = db.prepare(`SELECT * FROM accessories WHERE id = ?`).get(accessory_id);
  if (!accessory) {
    return res.status(404).json({ success: false, message: 'Accessory not found.' });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Purchase quantity must be at least 1.' });
  }

  const pInclusive = purchase_price_inclusive !== undefined
    ? Math.max(0, parseFloat(purchase_price_inclusive) || 0)
    : accessory.purchase_price_inclusive;

  const batch = calculateAccessoryPurchaseBatch(qty, pInclusive, 18.0);
  const poNumber = purchase_order_no && purchase_order_no.trim()
    ? purchase_order_no.trim()
    : `PO-ACC-${Date.now().toString().slice(-6)}`;

  const executePurchase = db.transaction(() => {
    // 1. Insert into accessory_purchases
    db.prepare(`
      INSERT INTO accessory_purchases (
        purchase_order_no, supplier_id, supplier_name, accessory_id,
        quantity, purchase_price_inclusive, taxable_value_per_unit, gst_per_unit,
        total_purchase_value, total_taxable_value, total_gst, store_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      poNumber,
      supplier_id || accessory.supplier_id || null,
      supplier_name || accessory.supplier_name || 'Direct Supplier',
      accessory.id,
      batch.quantity,
      batch.unit_purchase_price_inclusive,
      batch.unit_taxable_value,
      batch.unit_gst,
      batch.total_purchase_value,
      batch.total_taxable_value,
      batch.total_gst,
      accessory.store_id
    );

    // 2. Increment stock in accessories table
    const newQty = accessory.quantity + batch.quantity;
    let newStatus = 'In Stock';
    if (newQty <= accessory.minimum_stock) newStatus = 'Low Stock';

    db.prepare(`
      UPDATE accessories
      SET quantity = ?,
          status = ?,
          purchase_price_inclusive = ?,
          purchase_taxable_value = ?,
          purchase_gst = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newQty,
      newStatus,
      batch.unit_purchase_price_inclusive,
      batch.unit_taxable_value,
      batch.unit_gst,
      accessory.id
    );

    return { newQty, newStatus };
  });

  const { newQty, newStatus } = executePurchase();

  logAudit(
    req.user.id,
    req.user.username,
    'RESTOCK_ACCESSORY',
    accessory.store_id,
    'accessories',
    accessory.id,
    `Restocked ${qty} units of ${accessory.name} at ₹${pInclusive} (Incl. GST) each. Total Value: ₹${batch.total_purchase_value} (Taxable: ₹${batch.total_taxable_value}, GST: ₹${batch.total_gst})`,
    req.ip
  );

  res.status(201).json({
    success: true,
    message: `Restocked ${qty} units successfully. New stock: ${newQty}`,
    batchSummary: {
      accessoryName: accessory.name,
      quantityAdded: batch.quantity,
      unitPurchasePriceInclusive: batch.unit_purchase_price_inclusive,
      unitTaxableValue: batch.unit_taxable_value,
      unitGst: batch.unit_gst,
      totalPurchaseValue: batch.total_purchase_value,
      totalTaxableValue: batch.total_taxable_value,
      totalGst: batch.total_gst,
      newTotalStock: newQty,
      status: newStatus
    }
  });
});

// GET /api/accessories/reports/valuation (Stock valuation retaining purchase costs)
// Business Rule 14: Inventory valuation retains:
// Purchase price including GST, Purchase taxable value, Purchase GST, Quantity, Total purchase value
router.get('/reports/valuation', authenticateToken, (req, res) => {
  const { store_id } = req.query;

  let where = `WHERE 1=1`;
  const params = [];

  if (req.user.role !== 'admin') {
    where += ` AND a.store_id = ?`;
    params.push(req.user.assigned_store_id);
  } else if (store_id) {
    where += ` AND a.store_id = ?`;
    params.push(parseInt(store_id));
  }

  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total_items,
      COALESCE(SUM(a.quantity), 0) as total_units_in_stock,
      COALESCE(SUM(a.quantity * a.purchase_price_inclusive), 0) as total_inventory_cost_inclusive,
      COALESCE(SUM(a.quantity * a.purchase_taxable_value), 0) as total_inventory_cost_taxable,
      COALESCE(SUM(a.quantity * a.purchase_gst), 0) as total_inventory_purchase_gst,
      COALESCE(SUM(a.quantity * a.selling_price_inclusive), 0) as total_retail_value_inclusive
    FROM accessories a
    ${where}
  `).get(...params);

  const categoryBreakdown = db.prepare(`
    SELECT 
      a.category,
      COUNT(a.id) as item_count,
      SUM(a.quantity) as total_qty,
      SUM(a.quantity * a.purchase_price_inclusive) as cost_inclusive,
      SUM(a.quantity * a.purchase_taxable_value) as cost_taxable,
      SUM(a.quantity * a.selling_price_inclusive) as retail_value_inclusive
    FROM accessories a
    ${where}
    GROUP BY a.category
    ORDER BY retail_value_inclusive DESC
  `).all(...params);

  res.json({
    success: true,
    summary: totals,
    categoryBreakdown
  });
});

// GET /api/accessories/reports/sales (Sales reporting: Customer Amount vs Accounting Breakdown)
// Business Rule 18:
// Customer/Business Amount: Total Sales (GST Inclusive)
// Accounting Breakdown: Taxable Sales, GST Collected, CGST, SGST, IGST, Net Sales, Cost, Profit
router.get('/reports/sales', authenticateToken, (req, res) => {
  const { store_id, date_from, date_to } = req.query;

  let where = `WHERE sa.status = 'COMPLETED' AND si.item_type = 'accessory'`;
  const params = [];

  if (req.user.role !== 'admin') {
    where += ` AND sa.store_id = ?`;
    params.push(req.user.assigned_store_id);
  } else if (store_id) {
    where += ` AND sa.store_id = ?`;
    params.push(parseInt(store_id));
  }

  if (date_from) {
    where += ` AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= ?`;
    params.push(date_from);
  }
  if (date_to) {
    where += ` AND DATE(sa.sale_date, '+5 hours', '+30 minutes') <= ?`;
    params.push(date_to);
  }

  const report = db.prepare(`
    SELECT 
      COUNT(DISTINCT sa.id) as total_transactions,
      COALESCE(SUM(si.quantity), 0) as total_accessories_sold,
      COALESCE(SUM(si.final_price), 0) as total_sales_inclusive,
      COALESCE(SUM(si.taxable_amount), 0) as taxable_sales,
      COALESCE(SUM(si.total_tax), 0) as gst_collected,
      COALESCE(SUM(si.cgst), 0) as total_cgst,
      COALESCE(SUM(si.sgst), 0) as total_sgst,
      COALESCE(SUM(si.igst), 0) as total_igst,
      COALESCE(SUM(si.unit_cost * si.quantity), 0) as total_cogs_taxable,
      COALESCE(SUM(si.taxable_amount - (si.unit_cost * si.quantity)), 0) as gross_profit
    FROM sales sa
    JOIN sale_items si ON sa.id = si.sale_id
    ${where}
  `).get(...params);

  res.json({
    success: true,
    report: {
      customerAmount: {
        totalTransactions: report.total_transactions,
        totalUnitsSold: report.total_accessories_sold,
        totalSalesInclusive: report.total_sales_inclusive
      },
      accountingBreakdown: {
        taxableSales: report.taxable_sales,
        gstCollected: report.gst_collected,
        cgst: report.total_cgst,
        sgst: report.total_sgst,
        igst: report.total_igst,
        costOfGoodsTaxable: report.total_cogs_taxable,
        grossProfit: report.gross_profit,
        profitMargin: report.taxable_sales > 0 ? `${((report.gross_profit / report.taxable_sales) * 100).toFixed(1)}%` : '0%'
      }
    }
  });
});

module.exports = router;
