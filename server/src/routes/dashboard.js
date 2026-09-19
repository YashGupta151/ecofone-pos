const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticateToken, (req, res) => {
  const { period = 'all' } = req.query; // 'today', '7days', '30days', 'this_month', 'all'
  const storeId = req.user.role === 'admin' ? null : req.user.assigned_store_id;

  let dateFilter = '';
  if (period === 'today') {
    dateFilter = `AND DATE(sa.sale_date, '+5 hours', '+30 minutes') = DATE('now', '+5 hours', '+30 minutes')`;
  } else if (period === 'yesterday') {
    dateFilter = `AND DATE(sa.sale_date, '+5 hours', '+30 minutes') = DATE('now', '+5 hours', '+30 minutes', '-1 day')`;
  } else if (period === '7days') {
    dateFilter = `AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= DATE('now', '+5 hours', '+30 minutes', '-7 days')`;
  } else if (period === '30days') {
    dateFilter = `AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= DATE('now', '+5 hours', '+30 minutes', '-30 days')`;
  } else if (period === 'this_month') {
    dateFilter = `AND STRFTIME('%Y-%m', sa.sale_date, '+5 hours', '+30 minutes') = STRFTIME('%Y-%m', 'now', '+5 hours', '+30 minutes')`;
  }

  const storeFilter = storeId ? `AND sa.store_id = ${storeId}` : '';
  const invStoreFilter = storeId ? `WHERE current_store_id = ${storeId}` : '';

  // 1. Today's stats (Lucknow IST date)
  const today = db.prepare(`
    SELECT 
      COUNT(DISTINCT sa.id) as today_sales_count,
      COUNT(si.id) as today_phones_sold,
      COALESCE(SUM(sa.grand_total), 0) as today_revenue,
      COALESCE(SUM(sa.total_tax), 0) as today_tax,
      COALESCE(SUM((si.selling_price * COALESCE(si.quantity, 1) - COALESCE(si.discount, 0)) - (si.unit_cost * COALESCE(si.quantity, 1))), 0) as today_profit
    FROM sales sa
    LEFT JOIN sale_items si ON sa.id = si.sale_id
    WHERE sa.status = 'COMPLETED' AND DATE(sa.sale_date, '+5 hours', '+30 minutes') = DATE('now', '+5 hours', '+30 minutes') ${storeFilter}
  `).get();

  // Today's expenses (Lucknow IST date)
  const todayExpFilter = storeId ? `AND (store_id = ${storeId} OR store_id IS NULL)` : '';
  const todayExpenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as today_expenses
    FROM expenses
    WHERE expense_date = DATE('now', '+5 hours', '+30 minutes') ${todayExpFilter}
  `).get();

  // 2. Selected Period / All-time Business Overview
  const overview = db.prepare(`
    SELECT 
      COUNT(DISTINCT sa.id) as total_sales_count,
      COUNT(si.id) as total_phones_sold,
      COALESCE(SUM(sa.grand_total), 0) as total_revenue,
      COALESCE(SUM(sa.total_tax), 0) as total_tax,
      COALESCE(SUM(si.unit_cost * COALESCE(si.quantity, 1)), 0) as total_cogs,
      COALESCE(SUM((si.selling_price * COALESCE(si.quantity, 1) - COALESCE(si.discount, 0)) - (si.unit_cost * COALESCE(si.quantity, 1))), 0) as total_profit
    FROM sales sa
    LEFT JOIN sale_items si ON sa.id = si.sale_id
    WHERE sa.status = 'COMPLETED' ${dateFilter} ${storeFilter}
  `).get();

  // Inventory stats
  const inventory = db.prepare(`
    SELECT 
      COUNT(*) as total_inventory,
      COALESCE(SUM(CASE WHEN stock_status = 'AVAILABLE' THEN 1 ELSE 0 END), 0) as available_phones,
      COALESCE(SUM(CASE WHEN stock_status = 'SOLD' THEN 1 ELSE 0 END), 0) as sold_phones,
      COALESCE(SUM(CASE WHEN stock_status = 'IN_TRANSIT' THEN 1 ELSE 0 END), 0) as in_transit_phones,
      COALESCE(SUM(CASE WHEN stock_status = 'DEFECTIVE' THEN 1 ELSE 0 END), 0) as defective_phones,
      COALESCE(SUM(CASE WHEN stock_status = 'AVAILABLE' THEN total_cost ELSE 0 END), 0) as total_inventory_cost,
      COALESCE(SUM(CASE WHEN stock_status = 'AVAILABLE' THEN final_selling_price ELSE 0 END), 0) as total_inventory_value
    FROM phone_inventory
    ${invStoreFilter}
  `).get();

  // Active stores count
  const activeStoresCount = db.prepare(`SELECT COUNT(*) as count FROM stores WHERE status = 'active'`).get().count;

  // Pending transfers count
  const pendingTransfers = db.prepare(`SELECT COUNT(*) as count FROM stock_transfers WHERE status IN ('Pending', 'In Transit')`).get().count;

  // Low stock alert (models with count < 2 in store)
  const lowStock = db.prepare(`
    SELECT brand, model, COUNT(*) as qty, s.name as store_name
    FROM phone_inventory p
    JOIN stores s ON p.current_store_id = s.id
    WHERE p.stock_status = 'AVAILABLE' ${storeId ? `AND p.current_store_id = ${storeId}` : ''}
    GROUP BY p.current_store_id, brand, model
    HAVING qty <= 1
    LIMIT 6
  `).all();

  // 3. Store Comparison Table (All 12 Stores - Section 38 requirement)
  let storeComparison = [];
  if (req.user.role === 'admin') {
    storeComparison = db.prepare(`
      SELECT 
        s.id as store_id,
        s.name as store_name,
        s.code as store_code,
        s.city as store_city,
        s.status as store_status,
        COUNT(DISTINCT sa.id) as sales_count,
        COUNT(si.id) as phones_sold,
        COALESCE(SUM(sa.grand_total), 0) as revenue,
        COALESCE(SUM(si.unit_cost * COALESCE(si.quantity, 1)), 0) as cost,
        COALESCE(SUM((si.selling_price * COALESCE(si.quantity, 1) - COALESCE(si.discount, 0)) - (si.unit_cost * COALESCE(si.quantity, 1))), 0) as profit,
        (SELECT COUNT(*) FROM phone_inventory p WHERE p.current_store_id = s.id AND p.stock_status = 'AVAILABLE') as inventory_count
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id AND sa.status = 'COMPLETED' ${dateFilter}
      LEFT JOIN sale_items si ON sa.id = si.sale_id
      GROUP BY s.id
      ORDER BY revenue DESC
    `).all();
  }

  // 4. Chart Data: Daily Sales / Revenue (grouped by Lucknow local date)
  const salesChart = db.prepare(`
    SELECT 
      DATE(sa.sale_date, '+5 hours', '+30 minutes') as date,
      COUNT(DISTINCT sa.id) as orders,
      SUM(sa.grand_total) as revenue,
      SUM((si.selling_price * COALESCE(si.quantity, 1) - COALESCE(si.discount, 0)) - (si.unit_cost * COALESCE(si.quantity, 1))) as profit
    FROM sales sa
    JOIN sale_items si ON sa.id = si.sale_id
    WHERE sa.status = 'COMPLETED' AND sa.sale_date >= DATE('now', '+5 hours', '+30 minutes', '-30 days') ${storeFilter}
    GROUP BY DATE(sa.sale_date, '+5 hours', '+30 minutes')
    ORDER BY date ASC
  `).all();

  // Category/Brand share
  const brandShare = db.prepare(`
    SELECT si.brand, COUNT(*) as count, SUM(si.final_price) as revenue
    FROM sale_items si
    JOIN sales sa ON si.sale_id = sa.id
    WHERE sa.status = 'COMPLETED' ${storeFilter}
    GROUP BY si.brand
    ORDER BY count DESC
    LIMIT 6
  `).all();

  // Recent Sales
  const recentSales = db.prepare(`
    SELECT sa.id, sa.invoice_number, sa.sale_date, sa.grand_total, sa.payment_status,
           c.full_name as customer_name, s.name as store_name
    FROM sales sa
    JOIN customers c ON sa.customer_id = c.id
    JOIN stores s ON sa.store_id = s.id
    WHERE sa.status = 'COMPLETED' ${storeFilter}
    ORDER BY sa.sale_date DESC
    LIMIT 8
  `).all();

  res.json({
    success: true,
    today: {
      ...today,
      today_expenses: todayExpenses.today_expenses
    },
    overview,
    inventory,
    activeStoresCount,
    pendingTransfers,
    lowStock,
    storeComparison,
    charts: {
      salesTimeline: salesChart,
      brandShare
    },
    recentSales
  });
});

module.exports = router;
