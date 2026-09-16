const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
let dbPath;

if (isVercel) {
  const tmpPath = path.join('/tmp', 'ecofone.db');
  const possiblePaths = [
    path.resolve(__dirname, '../../data/ecofone.db'),
    path.resolve(process.cwd(), 'server/data/ecofone.db'),
    path.join('/var/task', 'server/data/ecofone.db'),
    path.join(__dirname, 'ecofone.db')
  ];
  const bundledDb = possiblePaths.find(p => fs.existsSync(p));
  if (!fs.existsSync(tmpPath)) {
    if (bundledDb) {
      try {
        fs.copyFileSync(bundledDb, tmpPath);
      } catch (e) {
        console.error('Failed to copy bundled db to /tmp:', e);
      }
    }
  }
  dbPath = tmpPath;
} else {
  const dbDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'ecofone.db');
}

const db = new Database(dbPath);

// Enable WAL mode or DELETE mode on Vercel, and Foreign Keys
db.pragma(isVercel ? 'journal_mode = DELETE' : 'journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Stores Table
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      manager TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users Table (Admin & Employees)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
      assigned_store_id INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_store_id) REFERENCES stores(id) ON DELETE SET NULL
    );

    -- Suppliers Table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      gstin TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Brands Table
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phone Models Table
    CREATE TABLE IF NOT EXISTS phone_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
      UNIQUE(brand_id, name)
    );

    -- Condition Grades Table
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active'
    );

    -- Phone Inventory (Device-Level Tracking)
    CREATE TABLE IF NOT EXISTS phone_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internal_product_id TEXT UNIQUE NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      variant TEXT,
      ram TEXT,
      storage TEXT,
      color TEXT,
      imei1 TEXT UNIQUE NOT NULL,
      imei2 TEXT UNIQUE,
      serial_number TEXT,
      condition_grade TEXT NOT NULL DEFAULT 'Grade A',
      battery_health TEXT,
      purchase_price REAL NOT NULL DEFAULT 0,
      refurbishment_cost REAL NOT NULL DEFAULT 0,
      additional_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 5.0,
      final_selling_price REAL NOT NULL DEFAULT 0,
      supplier_id INTEGER,
      purchase_id INTEGER,
      purchase_date DATE,
      warranty_period_months INTEGER DEFAULT 6,
      warranty_expiry DATE,
      current_store_id INTEGER NOT NULL,
      stock_status TEXT DEFAULT 'AVAILABLE' CHECK(stock_status IN ('AVAILABLE', 'SOLD', 'RESERVED', 'IN_TRANSIT', 'RETURNED', 'DEFECTIVE', 'UNDER_REFURBISHMENT')),
      date_added DATE DEFAULT (DATE('now')),
      date_sold DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_store_id) REFERENCES stores(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_phone_inventory_imei1 ON phone_inventory(imei1);
    CREATE INDEX IF NOT EXISTS idx_phone_inventory_store ON phone_inventory(current_store_id);
    CREATE INDEX IF NOT EXISTS idx_phone_inventory_status ON phone_inventory(stock_status);

    -- Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      gstin TEXT,
      id_proof_type TEXT,
      id_proof_number TEXT,
      total_purchases INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

    -- Purchases Table (Batch Stock Entry)
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_number TEXT UNIQUE NOT NULL,
      invoice_number TEXT,
      supplier_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      purchase_date DATE NOT NULL,
      total_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Sales Table
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT UNIQUE NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      store_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_total REAL DEFAULT 0,
      taxable_amount REAL NOT NULL DEFAULT 0,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      exchange_amount REAL DEFAULT 0,
      net_payable REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'PAID',
      status TEXT DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'VOID', 'RETURNED')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (employee_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

    -- Sale Items
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      phone_id INTEGER NOT NULL,
      imei1 TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      variant TEXT,
      condition_grade TEXT,
      unit_cost REAL NOT NULL, -- Total cost at the moment of sale for true profit calculations
      selling_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      taxable_amount REAL NOT NULL,
      tax_rate REAL DEFAULT 18.0,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      total_tax REAL NOT NULL,
      final_price REAL NOT NULL,
      warranty_period_months INTEGER DEFAULT 6,
      warranty_expiry DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (phone_id) REFERENCES phone_inventory(id)
    );

    -- Payments Table
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Other')),
      amount REAL NOT NULL,
      reference_number TEXT,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    -- Stock Transfers Table
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_number TEXT UNIQUE NOT NULL,
      from_store_id INTEGER NOT NULL,
      to_store_id INTEGER NOT NULL,
      transfer_date DATE NOT NULL,
      received_date DATE,
      initiated_by INTEGER NOT NULL,
      received_by INTEGER,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'In Transit', 'Received', 'Cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_store_id) REFERENCES stores(id),
      FOREIGN KEY (to_store_id) REFERENCES stores(id),
      FOREIGN KEY (initiated_by) REFERENCES users(id),
      FOREIGN KEY (received_by) REFERENCES users(id)
    );

    -- Stock Transfer Items
    CREATE TABLE IF NOT EXISTS stock_transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL,
      phone_id INTEGER NOT NULL,
      imei1 TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
      FOREIGN KEY (phone_id) REFERENCES phone_inventory(id)
    );

    -- Returns & Refunds Table
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE NOT NULL,
      sale_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      store_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Requested' CHECK(status IN ('Requested', 'Approved', 'Rejected', 'Returned', 'Refunded')),
      refund_amount REAL NOT NULL DEFAULT 0,
      refund_method TEXT DEFAULT 'Original Payment Method',
      notes TEXT,
      processed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    );

    -- Return Items
    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL,
      phone_id INTEGER NOT NULL,
      imei1 TEXT NOT NULL,
      sale_item_id INTEGER,
      condition_received TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
      FOREIGN KEY (phone_id) REFERENCES phone_inventory(id)
    );

    -- Warranties Table
    CREATE TABLE IF NOT EXISTS warranties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_id INTEGER NOT NULL,
      imei1 TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      sale_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      warranty_period_months INTEGER DEFAULT 6,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Expired', 'Claimed', 'Void')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (phone_id) REFERENCES phone_inventory(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE INDEX IF NOT EXISTS idx_warranties_imei ON warranties(imei1);
    CREATE INDEX IF NOT EXISTS idx_warranties_invoice ON warranties(invoice_number);

    -- Expenses Table
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER, -- Nullable for company-wide expenses
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      receipt_number TEXT,
      created_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Tax Rates Table
    CREATE TABLE IF NOT EXISTS tax_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      cgst_rate REAL NOT NULL,
      sgst_rate REAL NOT NULL,
      igst_rate REAL NOT NULL,
      is_default INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      group_name TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      store_id INTEGER,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

    -- Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      store_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Exchanged Phones Table
    CREATE TABLE IF NOT EXISTS exchanged_phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exchange_number TEXT UNIQUE NOT NULL,
      sale_id INTEGER,
      invoice_number TEXT,
      store_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      customer_address TEXT,
      customer_id_proof_type TEXT,
      customer_id_proof_number TEXT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      variant TEXT,
      color TEXT,
      imei1 TEXT NOT NULL,
      imei2 TEXT,
      serial_number TEXT,
      condition_grade TEXT DEFAULT 'Grade B',
      battery_health TEXT,
      device_condition TEXT,
      functional_issues TEXT,
      accessories_included TEXT,
      exchange_value REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'IN_STOCK' CHECK(status IN ('IN_STOCK', 'REFURBISHING', 'ADDED_TO_INVENTORY', 'SCRAPPED', 'SOLD')),
      phone_inventory_id INTEGER,
      exchange_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (employee_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exchanged_phones_imei1 ON exchanged_phones(imei1);
    CREATE INDEX IF NOT EXISTS idx_exchanged_phones_store ON exchanged_phones(store_id);
    CREATE INDEX IF NOT EXISTS idx_exchanged_phones_sale ON exchanged_phones(sale_id);
  `);
}

initSchema();

// Safe migrations for existing SQLite databases
try {
  db.exec(`ALTER TABLE sales ADD COLUMN exchange_amount REAL DEFAULT 0;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE sales ADD COLUMN net_payable REAL DEFAULT 0;`);
} catch (e) {}

// Auto-seed or restore settings if settings table is empty
try {
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM settings`).get();
  if (!countRow || countRow.count === 0) {
    // Check if JSON backup file exists
    const backupPaths = [
      '/tmp/settings_backup.json',
      path.resolve(__dirname, '../../data/settings_backup.json'),
      path.resolve(process.cwd(), 'server/data/settings_backup.json')
    ];
    let restored = false;
    for (const bp of backupPaths) {
      if (fs.existsSync(bp)) {
        try {
          const raw = fs.readFileSync(bp, 'utf-8');
          const parsed = JSON.parse(raw);
          const upsert = db.prepare(`INSERT OR REPLACE INTO settings (key, value, group_name) VALUES (?, ?, ?)`);
          for (const [k, v] of Object.entries(parsed)) {
            upsert.run(k, String(v), 'general');
          }
          restored = true;
          break;
        } catch (e) {}
      }
    }

    if (!restored) {
      const defaultSettings = [
        ['company_name', 'Ecofone', 'general'],
        ['company_tagline', 'Luxury within reach', 'general'],
        ['logo_url', '/logo.png', 'general'],
        ['currency_symbol', '₹', 'general'],
        ['currency_code', 'INR', 'general'],
        ['company_address', 'Ecofone Central HQ, Tower 4, BKC, Bandra East, Mumbai, Maharashtra 400051', 'general'],
        ['company_phone', '+91 1800 266 3263', 'general'],
        ['company_email', 'contact@ecofone.in', 'general'],
        ['company_gstin', '27AABCE1234F1Z5', 'tax'],
        ['invoice_prefix', 'ECO', 'invoice'],
        ['invoice_footer', 'Thank you for choosing Ecofone! Certified Refurbished Premium Devices.', 'invoice'],
        ['invoice_terms', '1. 6 Months Ecofone Certified Warranty included.\n2. Warranty covers manufacturing and hardware defects.\n3. Physical and liquid damages are void from warranty.\n4. Original tax invoice is required for warranty and claims.', 'invoice'],
        ['default_tax_rate', '5.0', 'tax']
      ];
      const insertStmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value, group_name) VALUES (?, ?, ?)`);
      for (const [k, v, g] of defaultSettings) {
        insertStmt.run(k, v, g);
      }
    }
  }
} catch (err) {
  console.error('Error initializing settings table:', err);
}

module.exports = db;
