const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'ecofone.db');

const db = new Database(dbPath);

db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
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
      plain_password TEXT DEFAULT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
      assigned_store_id INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      permissions TEXT DEFAULT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_phone_inventory_imei2 ON phone_inventory(imei2);
    CREATE INDEX IF NOT EXISTS idx_phone_inventory_serial ON phone_inventory(serial_number);
    CREATE INDEX IF NOT EXISTS idx_phone_inventory_product_id ON phone_inventory(internal_product_id);
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
    CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);

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

    -- Accessories Table (ALWAYS BRAND NEW, 18% GST INCLUSIVE)
    CREATE TABLE IF NOT EXISTS accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accessory_id TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      variant TEXT,
      description TEXT,
      supplier_id INTEGER,
      supplier_name TEXT,
      purchase_price_inclusive REAL NOT NULL DEFAULT 0.0,
      purchase_taxable_value REAL NOT NULL DEFAULT 0.0,
      purchase_gst REAL NOT NULL DEFAULT 0.0,
      mrp_inclusive REAL NOT NULL DEFAULT 0.0,
      selling_price_inclusive REAL NOT NULL DEFAULT 0.0,
      selling_taxable_value REAL NOT NULL DEFAULT 0.0,
      selling_gst REAL NOT NULL DEFAULT 0.0,
      gst_rate REAL NOT NULL DEFAULT 18.0,
      price_includes_gst INTEGER NOT NULL DEFAULT 1,
      quantity INTEGER NOT NULL DEFAULT 0,
      minimum_stock INTEGER NOT NULL DEFAULT 5,
      reorder_level INTEGER NOT NULL DEFAULT 10,
      store_id INTEGER NOT NULL,
      warranty_period TEXT DEFAULT '6 Months',
      status TEXT NOT NULL DEFAULT 'In Stock',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_accessories_sku ON accessories(sku);
    CREATE INDEX IF NOT EXISTS idx_accessories_barcode ON accessories(barcode);
    CREATE INDEX IF NOT EXISTS idx_accessories_store ON accessories(store_id);
    CREATE INDEX IF NOT EXISTS idx_accessories_category ON accessories(category);

    -- Accessory Purchases Table (Restock Entry Batches)
    CREATE TABLE IF NOT EXISTS accessory_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_no TEXT,
      supplier_id INTEGER,
      supplier_name TEXT,
      accessory_id INTEGER,
      quantity INTEGER NOT NULL,
      purchase_price_inclusive REAL NOT NULL,
      taxable_value_per_unit REAL NOT NULL,
      gst_per_unit REAL NOT NULL,
      total_purchase_value REAL NOT NULL,
      total_taxable_value REAL NOT NULL,
      total_gst REAL NOT NULL,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      store_id INTEGER,
      FOREIGN KEY (accessory_id) REFERENCES accessories(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE INDEX IF NOT EXISTS idx_acc_purchases_acc ON accessory_purchases(accessory_id);
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

// Safe cleanup for dangling foreign keys in accessories
try {
  db.exec(`UPDATE accessories SET supplier_id = NULL WHERE supplier_id IS NOT NULL AND supplier_id NOT IN (SELECT id FROM suppliers);`);
} catch (e) {}

// Safe migration for sale_items to support both Phones and Accessories
try {
  const tableInfo = db.prepare(`PRAGMA table_info(sale_items)`).all();
  const phoneIdCol = tableInfo.find(c => c.name === 'phone_id');
  const hasItemType = tableInfo.some(c => c.name === 'item_type');

  if (phoneIdCol && phoneIdCol.notnull === 1) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS sale_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        item_type TEXT DEFAULT 'phone',
        phone_id INTEGER,
        accessory_id INTEGER,
        imei1 TEXT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        variant TEXT,
        condition_grade TEXT,
        unit_cost REAL NOT NULL,
        selling_price REAL NOT NULL,
        discount REAL DEFAULT 0,
        taxable_amount REAL NOT NULL,
        tax_rate REAL DEFAULT 18.0,
        price_includes_gst INTEGER DEFAULT 0,
        cgst REAL DEFAULT 0,
        sgst REAL DEFAULT 0,
        igst REAL DEFAULT 0,
        total_tax REAL NOT NULL,
        final_price REAL NOT NULL,
        quantity INTEGER DEFAULT 1,
        warranty_period_months INTEGER DEFAULT 6,
        warranty_expiry DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (phone_id) REFERENCES phone_inventory(id),
        FOREIGN KEY (accessory_id) REFERENCES accessories(id)
      );

      INSERT INTO sale_items_new (
        id, sale_id, item_type, phone_id, imei1, brand, model, variant, condition_grade,
        unit_cost, selling_price, discount, taxable_amount, tax_rate, price_includes_gst,
        cgst, sgst, igst, total_tax, final_price, quantity, warranty_period_months, warranty_expiry, created_at
      )
      SELECT 
        id, sale_id, 'phone', phone_id, imei1, brand, model, variant, condition_grade,
        unit_cost, selling_price, discount, taxable_amount, tax_rate, 0,
        cgst, sgst, igst, total_tax, final_price, 1, warranty_period_months, warranty_expiry, created_at
      FROM sale_items;

      DROP TABLE sale_items;
      ALTER TABLE sale_items_new RENAME TO sale_items;
      PRAGMA foreign_keys = ON;
    `);
  } else {
    try { db.exec(`ALTER TABLE sale_items ADD COLUMN item_type TEXT DEFAULT 'phone';`); } catch (e) {}
    try { db.exec(`ALTER TABLE sale_items ADD COLUMN accessory_id INTEGER;`); } catch (e) {}
    try { db.exec(`ALTER TABLE sale_items ADD COLUMN quantity INTEGER DEFAULT 1;`); } catch (e) {}
    try { db.exec(`ALTER TABLE sale_items ADD COLUMN price_includes_gst INTEGER DEFAULT 0;`); } catch (e) {}
  }
} catch (e) {
  console.error('Error migrating sale_items table:', e);
}

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

// Ensure 'permissions' column exists in users table
try {
  const userCols = db.prepare(`PRAGMA table_info(users)`).all();
  if (!userCols.some(c => c.name === 'permissions')) {
    db.prepare(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT NULL`).run();
    console.log('✅ Successfully added permissions column to users table.');
  }
} catch (err) {
  console.error('Migration error for users.permissions:', err);
}

// Standard full employee permissions structure
const DEFAULT_EMPLOYEE_PERMISSIONS = {
  dashboard: { view: true },
  pos: { view: true, edit: true },
  exchanged_phones: { view: true, edit: true },
  inventory: { view: true, edit: true },
  accessories: { view: true, edit: true },
  stock_entry: { view: true, edit: true },
  customers: { view: true, edit: true },
  sales: { view: true },
  invoices: { view: true, edit: true },
  returns: { view: true, edit: true },
  warranty: { view: true },
  profile: { view: true, edit: true }
};

function parseUserPermissions(permissionsStr, role = 'employee') {
  if (role === 'admin') {
    // Admin has full universal permissions
    const adminPerms = {};
    for (const k of Object.keys(DEFAULT_EMPLOYEE_PERMISSIONS)) {
      adminPerms[k] = { view: true, edit: true };
    }
    return adminPerms;
  }

  if (!permissionsStr) {
    return { ...DEFAULT_EMPLOYEE_PERMISSIONS };
  }

  try {
    const parsed = typeof permissionsStr === 'string' ? JSON.parse(permissionsStr) : permissionsStr;
    const merged = { ...DEFAULT_EMPLOYEE_PERMISSIONS };
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === 'object' && val !== null) {
        merged[key] = { ...merged[key], ...val };
      }
    }
    return merged;
  } catch (e) {
    return { ...DEFAULT_EMPLOYEE_PERMISSIONS };
  }
}

// Ensure plain_password column exists on users
try {
  const userCols = db.prepare(`PRAGMA table_info(users)`).all();
  if (!userCols.some(c => c.name === 'plain_password')) {
    db.exec(`ALTER TABLE users ADD COLUMN plain_password TEXT DEFAULT NULL;`);
  }
} catch (e) {
  console.error('Error adding plain_password column to users:', e);
}

db.DEFAULT_EMPLOYEE_PERMISSIONS = DEFAULT_EMPLOYEE_PERMISSIONS;
db.parseUserPermissions = parseUserPermissions;

module.exports = db;
