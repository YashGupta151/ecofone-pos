const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/reports/sales
router.get('/sales', authenticateToken, (req, res) => {
  const { store_id, date_from, date_to, group_by = 'day' } = req.query;

  let where = `WHERE sa.status = 'COMPLETED'`;
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

  // Aggregate stats
  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(sa.subtotal), 0) as subtotal,
      COALESCE(SUM(sa.discount_total), 0) as discounts,
      COALESCE(SUM(sa.taxable_amount), 0) as taxable_amount,
      COALESCE(SUM(sa.total_tax), 0) as total_tax,
      COALESCE(SUM(sa.grand_total), 0) as grand_total,
      (SELECT COUNT(*) FROM sale_items si JOIN sales s ON si.sale_id = s.id ${where}) as total_units_sold
    FROM sales sa
    ${where}
  `).get(...params, ...params);

  // Time-series breakdown
  let timeFormat = '%Y-%m-%d';
  if (group_by === 'month') timeFormat = '%Y-%m';
  if (group_by === 'year') timeFormat = '%Y';

  const timeline = db.prepare(`
    SELECT 
      STRFTIME('${timeFormat}', sa.sale_date, '+5 hours', '+30 minutes') as period,
      COUNT(sa.id) as sales_count,
      SUM(sa.grand_total) as revenue,
      SUM(sa.total_tax) as tax,
      SUM(si.selling_price - si.unit_cost) as profit
    FROM sales sa
    JOIN sale_items si ON sa.id = si.sale_id
    ${where}
    GROUP BY period
    ORDER BY period ASC
  `).all(...params);

  // Store-wise performance
  let storeBreakdown = [];
  if (req.user.role === 'admin') {
    storeBreakdown = db.prepare(`
      SELECT 
        s.id, s.name as store_name, s.code as store_code, s.city,
        COUNT(DISTINCT sa.id) as sales_count,
        COUNT(si.id) as units_sold,
        COALESCE(SUM(sa.grand_total), 0) as revenue,
        COALESCE(SUM(si.selling_price - si.unit_cost), 0) as gross_profit
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id AND sa.status = 'COMPLETED'
        ${date_from ? "AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= ?" : ''}
        ${date_to ? "AND DATE(sa.sale_date, '+5 hours', '+30 minutes') <= ?" : ''}
      LEFT JOIN sale_items si ON sa.id = si.sale_id
      GROUP BY s.id
      ORDER BY revenue DESC
    `).all(...[date_from, date_to].filter(Boolean));
  }

  // Brand-wise performance
  const brandBreakdown = db.prepare(`
    SELECT 
      si.brand,
      COUNT(si.id) as units_sold,
      SUM(si.final_price) as revenue,
      SUM(si.selling_price - si.unit_cost) as gross_profit
    FROM sale_items si
    JOIN sales sa ON si.sale_id = sa.id
    ${where}
    GROUP BY si.brand
    ORDER BY units_sold DESC
  `).all(...params);

  res.json({
    success: true,
    totals,
    timeline,
    storeBreakdown,
    brandBreakdown
  });
});

// GET /api/reports/profit-loss (P&L Management)
router.get('/profit-loss', authenticateToken, requireAdmin, (req, res) => {
  const { store_id, date_from, date_to } = req.query;

  let saleWhere = `WHERE sa.status = 'COMPLETED'`;
  let expWhere = `WHERE 1=1`;
  const saleParams = [];
  const expParams = [];

  if (store_id) {
    saleWhere += ` AND sa.store_id = ?`;
    expWhere += ` AND (e.store_id = ? OR e.store_id IS NULL)`;
    saleParams.push(parseInt(store_id));
    expParams.push(parseInt(store_id));
  }

  if (date_from) {
    saleWhere += ` AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= ?`;
    expWhere += ` AND e.expense_date >= ?`;
    saleParams.push(date_from);
    expParams.push(date_from);
  }

  if (date_to) {
    saleWhere += ` AND DATE(sa.sale_date, '+5 hours', '+30 minutes') <= ?`;
    expWhere += ` AND e.expense_date <= ?`;
    saleParams.push(date_to);
    expParams.push(date_to);
  }

  // 1. Sales & True Cost of Goods Sold (Rule 8)
  const salesMetrics = db.prepare(`
    SELECT 
      COUNT(DISTINCT sa.id) as total_orders,
      COUNT(si.id) as total_phones_sold,
      COALESCE(SUM(si.selling_price - si.discount), 0) as net_sales_revenue,
      COALESCE(SUM(si.total_tax), 0) as tax_collected,
      COALESCE(SUM(si.final_price), 0) as total_gross_billed,
      COALESCE(SUM(si.unit_cost), 0) as total_cogs, -- Actual stored phone cost!
      COALESCE(SUM((si.selling_price - si.discount) - si.unit_cost), 0) as gross_profit
    FROM sales sa
    JOIN sale_items si ON sa.id = si.sale_id
    ${saleWhere}
  `).get(...saleParams);

  // 2. Business Expenses
  const expenseMetrics = db.prepare(`
    SELECT 
      COALESCE(SUM(e.amount), 0) as total_expenses
    FROM expenses e
    ${expWhere}
  `).get(...expParams);

  // Expenses categorized
  const expensesByCategory = db.prepare(`
    SELECT category, COALESCE(SUM(amount), 0) as amount
    FROM expenses e
    ${expWhere}
    GROUP BY category
    ORDER BY amount DESC
  `).all(...expParams);

  const netRevenue = salesMetrics.net_sales_revenue;
  const cogs = salesMetrics.total_cogs;
  const grossProfit = salesMetrics.gross_profit;
  const totalExpenses = expenseMetrics.total_expenses;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : 0;
  const netMargin = netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : 0;

  // Store-wise P&L breakdown table
  const storePlTable = db.prepare(`
    SELECT 
      s.id as store_id, s.name as store_name, s.code as store_code, s.city,
      COUNT(DISTINCT sa.id) as total_sales,
      COUNT(si.id) as phones_sold,
      COALESCE(SUM(si.selling_price - si.discount), 0) as revenue,
      COALESCE(SUM(si.unit_cost), 0) as cost_of_goods,
      COALESCE(SUM((si.selling_price - si.discount) - si.unit_cost), 0) as gross_profit,
      (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.store_id = s.id ${date_from ? 'AND e.expense_date >= ?' : ''} ${date_to ? 'AND e.expense_date <= ?' : ''}) as store_expenses
    FROM stores s
    LEFT JOIN sales sa ON s.id = sa.store_id AND sa.status = 'COMPLETED'
      ${date_from ? "AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= ?" : ''}
      ${date_to ? "AND DATE(sa.sale_date, '+5 hours', '+30 minutes') <= ?" : ''}
    LEFT JOIN sale_items si ON sa.id = si.sale_id
    GROUP BY s.id
    ORDER BY gross_profit DESC
  `).all(...[date_from, date_to].filter(Boolean), ...[date_from, date_to].filter(Boolean));

  // Compute store net profit
  const storePlComputed = storePlTable.map(row => ({
    ...row,
    net_profit: row.gross_profit - row.store_expenses,
    margin: row.revenue > 0 ? ((row.gross_profit / row.revenue) * 100).toFixed(1) : 0
  }));

  res.json({
    success: true,
    summary: {
      netRevenue,
      cogs,
      grossProfit,
      grossMargin: `${grossMargin}%`,
      totalExpenses,
      netProfit,
      netMargin: `${netMargin}%`,
      phonesSold: salesMetrics.total_phones_sold,
      taxCollected: salesMetrics.tax_collected
    },
    expensesByCategory,
    storePlTable: storePlComputed
  });
});

// GET /api/reports/taxes (Tax / GST Reports)
router.get('/taxes', authenticateToken, requireAdmin, (req, res) => {
  const { date_from, date_to, store_id } = req.query;

  let where = `WHERE sa.status = 'COMPLETED'`;
  const params = [];

  if (store_id) {
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

  const taxSummary = db.prepare(`
    SELECT 
      COUNT(*) as total_taxable_invoices,
      COALESCE(SUM(sa.taxable_amount), 0) as total_taxable_value,
      COALESCE(SUM(sa.cgst), 0) as total_cgst,
      COALESCE(SUM(sa.sgst), 0) as total_sgst,
      COALESCE(SUM(sa.igst), 0) as total_igst,
      COALESCE(SUM(sa.total_tax), 0) as total_gst_collected,
      COALESCE(SUM(sa.grand_total), 0) as total_gross_turnover
    FROM sales sa
    ${where}
  `).get(...params);

  // Store-wise GST breakdown
  const storeTaxTable = db.prepare(`
    SELECT 
      s.id, s.name as store_name, s.code as store_code, s.gstin, s.state,
      COUNT(sa.id) as invoice_count,
      COALESCE(SUM(sa.taxable_amount), 0) as taxable_value,
      COALESCE(SUM(sa.cgst), 0) as cgst,
      COALESCE(SUM(sa.sgst), 0) as sgst,
      COALESCE(SUM(sa.igst), 0) as igst,
      COALESCE(SUM(sa.total_tax), 0) as total_tax
    FROM stores s
    LEFT JOIN sales sa ON s.id = sa.store_id AND sa.status = 'COMPLETED'
      ${date_from ? "AND DATE(sa.sale_date, '+5 hours', '+30 minutes') >= ?" : ''}
      ${date_to ? "AND DATE(sa.sale_date, '+5 hours', '+30 minutes') <= ?" : ''}
    GROUP BY s.id
    ORDER BY total_tax DESC
  `).all(...[date_from, date_to].filter(Boolean));

  res.json({
    success: true,
    taxSummary,
    storeTaxTable
  });
});

// GET /api/reports/employee-performance
router.get('/employee-performance', authenticateToken, requireAdmin, (req, res) => {
  const performance = db.prepare(`
    SELECT 
      u.id, u.employee_id, u.full_name, u.username,
      s.name as store_name, s.city as store_city,
      COUNT(sa.id) as total_sales_count,
      COUNT(si.id) as phones_sold,
      COALESCE(SUM(sa.grand_total), 0) as total_revenue,
      COALESCE(SUM(sa.discount_total), 0) as total_discounts_given,
      COALESCE(AVG(sa.grand_total), 0) as average_ticket_size,
      COALESCE(SUM(si.selling_price - si.unit_cost), 0) as gross_profit_generated
    FROM users u
    JOIN stores s ON u.assigned_store_id = s.id
    LEFT JOIN sales sa ON u.id = sa.employee_id AND sa.status = 'COMPLETED'
    LEFT JOIN sale_items si ON sa.id = si.sale_id
    WHERE u.role = 'employee'
    GROUP BY u.id
    ORDER BY total_revenue DESC
  `).all();

  res.json({ success: true, performance });
});

module.exports = router;
