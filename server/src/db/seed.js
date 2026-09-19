require('dotenv').config();
const db = require('./database');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  console.log('Seeding Ecofone Database...');
  db.pragma('foreign_keys = OFF');

  // 1. Settings
  const settingsStmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value, group_name) VALUES (?, ?, ?)`);
  const settings = [
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
  for (const [k, v, g] of settings) {
    settingsStmt.run(k, v, g);
  }

  // 2. Tax Rates
  db.exec(`DELETE FROM tax_rates`);
  const taxStmt = db.prepare(`INSERT INTO tax_rates (name, rate, cgst_rate, sgst_rate, igst_rate, is_default) VALUES (?, ?, ?, ?, ?, ?)`);
  taxStmt.run('GST 5% (Margin Scheme Rule 32(5))', 5.0, 2.5, 2.5, 5.0, 1);
  taxStmt.run('GST 12% (Refurbished Basic)', 12.0, 6.0, 6.0, 12.0, 0);
  taxStmt.run('GST 18% (Standard Electronics)', 18.0, 9.0, 9.0, 18.0, 0);

  // 3. Condition Grades
  db.exec(`DELETE FROM grades`);
  const gradeStmt = db.prepare(`INSERT INTO grades (name, description) VALUES (?, ?)`);
  gradeStmt.run('Like New', 'Zero scratches, 95%+ battery health, immaculate screen and body');
  gradeStmt.run('Grade A', 'Barely visible micro-scratches, 90%+ battery health, fully tested 64-point check');
  gradeStmt.run('Grade B', 'Minor signs of light use on bezel, 85%+ battery health, perfect display');
  gradeStmt.run('Grade C', 'Visible cosmetic wear, 100% functional guarantee, 80%+ battery health');
  gradeStmt.run('Fair', 'Noticeable scratches, great value budget pick, completely operational');

  // 4. Brands & Models
  db.exec(`DELETE FROM brands`);
  db.exec(`DELETE FROM phone_models`);
  const brandStmt = db.prepare(`INSERT INTO brands (name) VALUES (?)`);
  const modelStmt = db.prepare(`INSERT INTO phone_models (brand_id, name) VALUES (?, ?)`);

  const brandCatalog = {
    'Apple': ['iPhone 11', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro', 'iPhone SE (2022)'],
    'Samsung': ['Galaxy S21 5G', 'Galaxy S22 5G', 'Galaxy S22 Ultra', 'Galaxy S23 5G', 'Galaxy S23 Ultra', 'Galaxy S24', 'Galaxy A54 5G', 'Galaxy Note 20 Ultra'],
    'OnePlus': ['OnePlus 9 Pro', 'OnePlus 10 Pro', 'OnePlus 11 5G', 'OnePlus 12R', 'OnePlus Nord 3 5G', 'OnePlus Nord CE 3'],
    'Google': ['Pixel 6 Pro', 'Pixel 7', 'Pixel 7 Pro', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 7a'],
    'Xiaomi': ['Xiaomi 13 Pro', 'Xiaomi 12 Pro', 'Redmi Note 12 Pro+ 5G', 'Redmi Note 13 Pro+ 5G'],
    'Vivo': ['Vivo X90 Pro', 'Vivo V29 Pro', 'Vivo V30 5G']
  };

  const brandIdMap = {};
  for (const [brandName, models] of Object.entries(brandCatalog)) {
    const res = brandStmt.run(brandName);
    const bId = res.lastInsertRowid;
    brandIdMap[brandName] = bId;
    for (const m of models) {
      modelStmt.run(bId, m);
    }
  }

  // 5. Stores (12 Physical Stores across India)
  db.exec(`DELETE FROM stores`);
  const storeStmt = db.prepare(`
    INSERT INTO stores (name, code, address, city, state, pincode, phone, email, gstin, manager, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const storesData = [
    ['Ecofone Mumbai Flagship', 'ECO-MUM-01', 'Shop 12-14, Ground Floor, The Capital, BKC', 'Mumbai', 'Maharashtra', '400051', '+91 98201 11001', 'mumbai.bkc@ecofone.in', '27AABCE1234F1Z5', 'Rajesh Kulkarni', 'active'],
    ['Ecofone South Mumbai', 'ECO-MUM-02', 'Unit 4, Colaba Causeway, Near Regal Cinema', 'Mumbai', 'Maharashtra', '400001', '+91 98201 11002', 'mumbai.colaba@ecofone.in', '27AABCE1234F1Z5', 'Sunita Rao', 'active'],
    ['Ecofone Delhi Connaught Place', 'ECO-DEL-01', 'B-Block 22, Inner Circle, Connaught Place', 'New Delhi', 'Delhi', '110001', '+91 98101 22001', 'delhi.cp@ecofone.in', '07AABCE1234F1Z2', 'Vikas Sharma', 'active'],
    ['Ecofone Delhi South Extension', 'ECO-DEL-02', 'F-18, Main Market, South Extension Part 1', 'New Delhi', 'Delhi', '110049', '+91 98101 22002', 'delhi.southex@ecofone.in', '07AABCE1234F1Z2', 'Neha Kapoor', 'active'],
    ['Ecofone Bengaluru Indiranagar', 'ECO-BLR-01', '542, 100 Feet Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', '+91 98451 33001', 'blr.indiranagar@ecofone.in', '29AABCE1234F1Z8', 'Arun Kumar', 'active'],
    ['Ecofone Bengaluru Koramangala', 'ECO-BLR-02', '80 Feet Road, 4th Block, Koramangala', 'Bengaluru', 'Karnataka', '560034', '+91 98451 33002', 'blr.koramangala@ecofone.in', '29AABCE1234F1Z8', 'Pooja Hegde', 'active'],
    ['Ecofone Hyderabad Hitec City', 'ECO-HYD-01', 'Cyber Towers Junction, Madhapur', 'Hyderabad', 'Telangana', '500081', '+91 98491 44001', 'hyd.hitec@ecofone.in', '36AABCE1234F1Z3', 'Karthik Reddy', 'active'],
    ['Ecofone Chennai T. Nagar', 'ECO-CHN-01', '45 Usman Road, T. Nagar', 'Chennai', 'Tamil Nadu', '600017', '+91 98401 55001', 'chn.tnagar@ecofone.in', '33AABCE1234F1Z0', 'Suresh Raman', 'active'],
    ['Ecofone Pune Koregaon Park', 'ECO-PUN-01', 'Lane 7, North Main Road, Koregaon Park', 'Pune', 'Maharashtra', '411001', '+91 98221 66001', 'pune.kp@ecofone.in', '27AABCE1234F1Z5', 'Anil Deshmukh', 'active'],
    ['Ecofone Kolkata Park Street', 'ECO-KOL-01', '78 Park Street, Near Mocambo', 'Kolkata', 'West Bengal', '700016', '+91 98301 77001', 'kol.parkst@ecofone.in', '19AABCE1234F1Z4', 'Debashis Sen', 'active'],
    ['Ecofone Ahmedabad CG Road', 'ECO-AMD-01', 'Dev Arc Complex, C.G. Road, Navrangpura', 'Ahmedabad', 'Gujarat', '380009', '+91 98981 88001', 'amd.cgroad@ecofone.in', '24AABCE1234F1Z9', 'Jignesh Patel', 'active'],
    ['Ecofone Jaipur MI Road', 'ECO-JAI-01', 'Near Panch Batti, M.I. Road', 'Jaipur', 'Rajasthan', '302001', '+91 98291 99001', 'jai.miroad@ecofone.in', '08AABCE1234F1Z1', 'Manish Rathore', 'active']
  ];

  const storeIdMap = {};
  for (const s of storesData) {
    const res = storeStmt.run(...s);
    storeIdMap[s[1]] = res.lastInsertRowid;
  }

  // 6. Users: 1 CEO/Admin + 24 Employees (2 per store)
  db.exec(`DELETE FROM users`);
  const userStmt = db.prepare(`
    INSERT INTO users (employee_id, username, password_hash, full_name, phone, email, address, role, assigned_store_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const crypto = require('crypto');
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(8).toString('hex');
  const empPassword = process.env.DEFAULT_EMP_PASSWORD || crypto.randomBytes(8).toString('hex');

  const salt = bcrypt.genSaltSync(10);
  const adminPassHash = bcrypt.hashSync(adminPassword, salt);
  const empPassHash = bcrypt.hashSync(empPassword, salt);

  // CEO / Super Admin
  userStmt.run(
    'ECO-EMP-000',
    adminUsername,
    adminPassHash,
    'Aman Singhania (CEO)',
    '+91 98200 99999',
    'ceo@ecofone.in',
    'Ecofone Headquarters, Mumbai',
    'admin',
    null,
    'active'
  );

  // 24 Store Employees
  const employeeNames = [
    ['Rajesh Kulkarni', 'Pooja Bhosle'],     // Store 1 (MUM-01)
    ['Sunita Rao', 'Amit Jadhav'],           // Store 2 (MUM-02)
    ['Vikas Sharma', 'Kavita Rawat'],        // Store 3 (DEL-01)
    ['Neha Kapoor', 'Rohan Bhatia'],         // Store 4 (DEL-02)
    ['Arun Kumar', 'Divya Murthy'],          // Store 5 (BLR-01)
    ['Pooja Hegde', 'Naveen Gowda'],         // Store 6 (BLR-02)
    ['Karthik Reddy', 'Swathi Rao'],         // Store 7 (HYD-01)
    ['Suresh Raman', 'Meena Sundaram'],      // Store 8 (CHN-01)
    ['Anil Deshmukh', 'Sneha Shinde'],       // Store 9 (PUN-01)
    ['Debashis Sen', 'Riya Mukherjee'],      // Store 10 (KOL-01)
    ['Jignesh Patel', 'Bhavna Shah'],        // Store 11 (AMD-01)
    ['Manish Rathore', 'Priyanka Shekhawat'] // Store 12 (JAI-01)
  ];

  let empCounter = 1;
  const employeeIdList = [];
  storesData.forEach((st, idx) => {
    const storeId = storeIdMap[st[1]];
    const pair = employeeNames[idx];
    pair.forEach((name, pIdx) => {
      const empCode = `ECO-EMP-${String(empCounter).padStart(3, '0')}`;
      const username = `emp${String(empCounter).padStart(3, '0')}`;
      const res = userStmt.run(
        empCode,
        username,
        empPassHash,
        name,
        `+91 98200 ${String(10000 + empCounter)}`,
        `${username}@ecofone.in`,
        `${st[3]}, India`,
        'employee',
        storeId,
        'active'
      );
      employeeIdList.push({ id: res.lastInsertRowid, username, name, storeId });
      empCounter++;
    });
  });

  // 7. Suppliers
  db.exec(`DELETE FROM suppliers`);
  const supplierStmt = db.prepare(`
    INSERT INTO suppliers (name, contact_person, phone, email, address, city, state, gstin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const suppliers = [
    ['ReTech Global Wholesale', 'Sunil Narang', '+91 98110 54321', 'sales@retech.in', 'Plot 45, Okhla Industrial Area', 'New Delhi', 'Delhi', '07AAACR1234A1Z1'],
    ['Apex Mobile Recyclers', 'Hemant Mehta', '+91 98202 87654', 'info@apexmobile.com', 'Sector 18, Vashi', 'Navi Mumbai', 'Maharashtra', '27AAACA9876B1Z2'],
    ['Nordic Devices India', 'Ashwin Iyer', '+91 98450 11223', 'wholesale@nordicdev.in', 'Electronics City Phase 1', 'Bengaluru', 'Karnataka', '29AAACN4567C1Z3'],
    ['TechRevive Solutions', 'Venkat Chary', '+91 98490 33445', 'orders@techrevive.co', 'Balanagar Industrial Estate', 'Hyderabad', 'Telangana', '36AAACT7890D1Z4'],
    ['GreenCell Mobility', 'Sameer Khan', '+91 98290 55667', 'sales@greencell.in', 'Sitapura Industrial Area', 'Jaipur', 'Rajasthan', '08AAACG2345E1Z5']
  ];

  const supplierIds = suppliers.map(s => supplierStmt.run(...s).lastInsertRowid);

  // 8. Customers (25 Sample Customers)
  db.exec(`DELETE FROM customers`);
  const custStmt = db.prepare(`
    INSERT INTO customers (customer_code, full_name, phone, email, address, city, state, pincode, gstin, id_proof_type, id_proof_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const customersData = [
    ['CUST-0001', 'Aditya Roy', '+91 98200 45671', 'aditya.roy@gmail.com', 'Flat 402, Sea Green Apartments, Bandra West', 'Mumbai', 'Maharashtra', '400050', null, 'Aadhaar', 'XXXX-XXXX-1234'],
    ['CUST-0002', 'Kiran Bedi', '+91 98100 45672', 'kiran.b@outlook.com', 'A-45, Defence Colony', 'New Delhi', 'Delhi', '110024', null, 'PAN Card', 'ABCDE1234F'],
    ['CUST-0003', 'Manoj Gowda', '+91 98450 45673', 'manoj.gowda@techcorp.in', 'Villa 12, Palm Meadows, Whitefield', 'Bengaluru', 'Karnataka', '560066', '29AAACM1234D1Z1', 'Driving License', 'KA-01-2020-0012'],
    ['CUST-0004', 'Deepa Venkat', '+91 98400 45674', 'deepa.v@gmail.com', '14 Besant Nagar 2nd Avenue', 'Chennai', 'Tamil Nadu', '600090', null, 'Aadhaar', 'XXXX-XXXX-5678'],
    ['CUST-0005', 'Tarun Kothari', '+91 98220 45675', 'tarun.k@yahoo.com', '21 Boat Club Road', 'Pune', 'Maharashtra', '411001', null, 'Passport', 'Z1234567'],
    ['CUST-0006', 'Sanjay Aggarwal', '+91 98100 89001', 'sanjay.ag@rediffmail.com', 'Plot 88, Model Town', 'New Delhi', 'Delhi', '110009', null, 'Aadhaar', 'XXXX-XXXX-3344'],
    ['CUST-0007', 'Anita Deshmukh', '+91 98200 89002', 'anita.d@gmail.com', '102 Windermere, Oshiwara', 'Mumbai', 'Maharashtra', '400053', null, 'PAN Card', 'BGHYT4567L'],
    ['CUST-0008', 'Gautam Singhal', '+91 98450 89003', 'gautam@singhalenterprises.com', '34 Lavelle Road', 'Bengaluru', 'Karnataka', '560001', '29AAACG9988H1Z4', 'Aadhaar', 'XXXX-XXXX-7788'],
    ['CUST-0009', 'Naveen Choudhary', '+91 98490 89004', 'naveen.ch@gmail.com', 'Banjara Hills Road No 10', 'Hyderabad', 'Telangana', '500034', null, 'Driving License', 'TS-09-2022-8877'],
    ['CUST-0010', 'Meera Subramaniam', '+91 98400 89005', 'meera.sub@hotmail.com', '5 Harrington Road, Chetpet', 'Chennai', 'Tamil Nadu', '600031', null, 'Passport', 'P9876543'],
    ['CUST-0011', 'Rohit Sen', '+91 98300 89006', 'rohit.sen@gmail.com', 'Flat 3B, Ballygunge Circular Road', 'Kolkata', 'West Bengal', '700019', null, 'Aadhaar', 'XXXX-XXXX-9900'],
    ['CUST-0012', 'Parthiv Patel', '+91 98980 89007', 'parthiv.p@yahoo.com', '12 Satellite Road', 'Ahmedabad', 'Gujarat', '380015', null, 'Aadhaar', 'XXXX-XXXX-4455'],
    ['CUST-0013', 'Simran Rathore', '+91 98290 89008', 'simran.r@gmail.com', 'C-Scheme, Subhash Marg', 'Jaipur', 'Rajasthan', '302001', null, 'PAN Card', 'JKLM8901N'],
    ['CUST-0014', 'Prashant Joshi', '+91 98220 89009', 'prashant.j@gmail.com', 'Prabhat Road, Deccan Gymkhana', 'Pune', 'Maharashtra', '411004', null, 'Aadhaar', 'XXXX-XXXX-2233'],
    ['CUST-0015', 'Kavita Menon', '+91 98450 89010', 'kavita.m@gmail.com', 'Jayanagar 4th Block', 'Bengaluru', 'Karnataka', '560011', null, 'Aadhaar', 'XXXX-XXXX-6677']
  ];

  const customerIds = customersData.map(c => custStmt.run(...c).lastInsertRowid);

  // 9. Phone Inventory (132 Refurbished Phones - 11 per store)
  db.exec(`DELETE FROM phone_inventory`);
  const phoneStmt = db.prepare(`
    INSERT INTO phone_inventory (
      internal_product_id, brand, model, variant, ram, storage, color,
      imei1, imei2, serial_number, condition_grade, battery_health,
      purchase_price, refurbishment_cost, additional_cost, total_cost,
      selling_price, discount, tax_rate, final_selling_price,
      supplier_id, purchase_date, warranty_period_months, warranty_expiry,
      current_store_id, stock_status, date_added, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const phoneCatalog = [
    { brand: 'Apple', model: 'iPhone 13', variant: '128GB Midnight', ram: '4GB', storage: '128GB', color: 'Midnight', cost: 28000, sell: 42000 },
    { brand: 'Apple', model: 'iPhone 13 Pro', variant: '256GB Sierra Blue', ram: '6GB', storage: '256GB', color: 'Sierra Blue', cost: 42000, sell: 62000 },
    { brand: 'Apple', model: 'iPhone 14', variant: '128GB Starlight', ram: '6GB', storage: '128GB', color: 'Starlight', cost: 35000, sell: 51000 },
    { brand: 'Apple', model: 'iPhone 14 Pro', variant: '128GB Deep Purple', ram: '6GB', storage: '128GB', color: 'Deep Purple', cost: 52000, sell: 74000 },
    { brand: 'Apple', model: 'iPhone 15', variant: '128GB Black', ram: '6GB', storage: '128GB', color: 'Black', cost: 45000, sell: 63000 },
    { brand: 'Apple', model: 'iPhone 12', variant: '64GB Blue', ram: '4GB', storage: '64GB', color: 'Blue', cost: 20000, sell: 31000 },
    { brand: 'Samsung', model: 'Galaxy S23 5G', variant: '8GB/256GB Phantom Black', ram: '8GB', storage: '256GB', color: 'Phantom Black', cost: 34000, sell: 49000 },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', variant: '12GB/256GB Green', ram: '12GB', storage: '256GB', color: 'Green', cost: 55000, sell: 78000 },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra', variant: '12GB/256GB Burgundy', ram: '12GB', storage: '256GB', color: 'Burgundy', cost: 38000, sell: 54000 },
    { brand: 'Samsung', model: 'Galaxy A54 5G', variant: '8GB/128GB Awesome Lime', ram: '8GB', storage: '128GB', color: 'Awesome Lime', cost: 14000, sell: 22000 },
    { brand: 'OnePlus', model: 'OnePlus 11 5G', variant: '16GB/256GB Titan Black', ram: '16GB', storage: '256GB', color: 'Titan Black', cost: 27000, sell: 39000 },
    { brand: 'OnePlus', model: 'OnePlus 12R', variant: '8GB/128GB Cool Blue', ram: '8GB', storage: '128GB', color: 'Cool Blue', cost: 24000, sell: 34000 },
    { brand: 'Google', model: 'Pixel 7', variant: '8GB/128GB Lemongrass', ram: '8GB', storage: '128GB', color: 'Lemongrass', cost: 22000, sell: 33000 },
    { brand: 'Google', model: 'Pixel 8 Pro', variant: '12GB/128GB Bay Blue', ram: '12GB', storage: '128GB', color: 'Bay Blue', cost: 48000, sell: 69000 }
  ];

  const gradesList = ['Like New', 'Grade A', 'Grade A', 'Grade B', 'Grade B', 'Grade A'];
  const batteryHealthList = ['98%', '94%', '91%', '89%', '96%', '92%', '88%'];
  const allStores = Object.values(storeIdMap);

  let phoneCounter = 1;
  const createdPhones = [];

  // Generate 11 phones per store (132 phones total)
  for (let sIdx = 0; sIdx < allStores.length; sIdx++) {
    const storeId = allStores[sIdx];
    for (let p = 0; p < 11; p++) {
      const template = phoneCatalog[(sIdx * 11 + p) % phoneCatalog.length];
      const grade = gradesList[p % gradesList.length];
      const battery = batteryHealthList[p % batteryHealthList.length];
      const supplierId = supplierIds[p % supplierIds.length];

      const refurbCost = Math.round(1000 + (p * 250));
      const additionalCost = 300;
      const totalCost = template.cost + refurbCost + additionalCost;
      const discount = (p % 3 === 0) ? 1000 : 0;
      const taxRate = 18.0;
      const taxable = template.sell - discount;
      const finalPrice = taxable + (taxable * (taxRate / 100));

      const internalId = `ECO-PH-${String(phoneCounter).padStart(5, '0')}`;
      const imei1 = `35894109${String(phoneCounter).padStart(7, '0')}`;
      const imei2 = `35894110${String(phoneCounter).padStart(7, '0')}`;
      const serial = `SN${template.brand.substring(0, 2).toUpperCase()}${String(880000 + phoneCounter)}`;

      // 3 phones per store will be marked as SOLD, rest AVAILABLE
      const isSold = p < 3;
      const status = isSold ? 'SOLD' : 'AVAILABLE';

      const res = phoneStmt.run(
        internalId,
        template.brand,
        template.model,
        template.variant,
        template.ram,
        template.storage,
        template.color,
        imei1,
        imei2,
        serial,
        grade,
        battery,
        template.cost,
        refurbCost,
        additionalCost,
        totalCost,
        template.sell,
        discount,
        taxRate,
        finalPrice,
        supplierId,
        '2026-08-01',
        6,
        '2027-02-01',
        storeId,
        status,
        '2026-08-10',
        'Certified Refurbished. Tested and sanitized.'
      );

      createdPhones.push({
        id: res.lastInsertRowid,
        internalId,
        brand: template.brand,
        model: template.model,
        variant: template.variant,
        grade,
        imei1,
        imei2,
        totalCost,
        sellingPrice: template.sell,
        discount,
        taxRate,
        finalPrice,
        storeId,
        status
      });

      phoneCounter++;
    }
  }

  // 10. Historical Sales, Invoices, Payments, Warranties (36 sales for the sold phones)
  db.exec(`DELETE FROM sales`);
  db.exec(`DELETE FROM sale_items`);
  db.exec(`DELETE FROM payments`);
  db.exec(`DELETE FROM warranties`);

  const saleStmt = db.prepare(`
    INSERT INTO sales (
      sale_number, invoice_number, sale_date, store_id, employee_id, customer_id,
      subtotal, discount_total, taxable_amount, cgst, sgst, igst, total_tax, grand_total, payment_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const saleItemStmt = db.prepare(`
    INSERT INTO sale_items (
      sale_id, phone_id, imei1, brand, model, variant, condition_grade,
      unit_cost, selling_price, discount, taxable_amount, tax_rate, cgst, sgst, igst, total_tax, final_price,
      warranty_period_months, warranty_expiry
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const payStmt = db.prepare(`
    INSERT INTO payments (sale_id, payment_method, amount, reference_number, payment_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const warrantyStmt = db.prepare(`
    INSERT INTO warranties (phone_id, imei1, customer_id, sale_id, invoice_number, warranty_period_months, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const soldPhones = createdPhones.filter(p => p.status === 'SOLD');
  const payMethods = ['UPI', 'Card', 'Cash', 'Bank Transfer'];

  soldPhones.forEach((phone, idx) => {
    const invNumber = `ECO-2026-${String(idx + 1).padStart(6, '0')}`;
    const saleNumber = `SL-2026-${String(idx + 1).padStart(6, '0')}`;
    const custId = customerIds[idx % customerIds.length];

    // Find employee assigned to this store
    const emp = employeeIdList.find(e => e.storeId === phone.storeId) || employeeIdList[0];

    // Calculate taxes (Intra-state CGST 9% + SGST 9%)
    const taxable = phone.sellingPrice - phone.discount;
    const cgst = Math.round(taxable * 0.09);
    const sgst = Math.round(taxable * 0.09);
    const totalTax = cgst + sgst;
    const grandTotal = taxable + totalTax;

    // Dates spread over past 30 days
    const dayOffset = Math.floor(idx * 0.8);
    const saleDate = `2026-08-${String(15 + (dayOffset % 15)).padStart(2, '0')} 14:30:00`;
    const startDate = `2026-08-${String(15 + (dayOffset % 15)).padStart(2, '0')}`;
    const endDate = `2027-02-${String(15 + (dayOffset % 15)).padStart(2, '0')}`;

    const sRes = saleStmt.run(
      saleNumber,
      invNumber,
      saleDate,
      phone.storeId,
      emp.id,
      custId,
      phone.sellingPrice,
      phone.discount,
      taxable,
      cgst,
      sgst,
      0, // igst
      totalTax,
      grandTotal,
      'PAID',
      'COMPLETED'
    );

    const saleId = sRes.lastInsertRowid;

    saleItemStmt.run(
      saleId,
      phone.id,
      phone.imei1,
      phone.brand,
      phone.model,
      phone.variant,
      phone.grade,
      phone.totalCost, // True cost captured for profit calculation!
      phone.sellingPrice,
      phone.discount,
      taxable,
      phone.taxRate,
      cgst,
      sgst,
      0,
      totalTax,
      grandTotal,
      6,
      endDate
    );

    payStmt.run(
      saleId,
      payMethods[idx % payMethods.length],
      grandTotal,
      `TXN${idx + 1000234}`,
      saleDate
    );

    warrantyStmt.run(
      phone.id,
      phone.imei1,
      custId,
      saleId,
      invNumber,
      6,
      startDate,
      endDate,
      'Active'
    );

    // Update customer total purchases and spent
    db.prepare(`UPDATE customers SET total_purchases = total_purchases + 1, total_spent = total_spent + ? WHERE id = ?`).run(grandTotal, custId);
  });

  // 11. Stock Transfers (4 Realistic Transfers)
  db.exec(`DELETE FROM stock_transfers`);
  db.exec(`DELETE FROM stock_transfer_items`);
  const trfStmt = db.prepare(`
    INSERT INTO stock_transfers (transfer_number, from_store_id, to_store_id, transfer_date, received_date, initiated_by, received_by, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const trfItemStmt = db.prepare(`
    INSERT INTO stock_transfer_items (transfer_id, phone_id, imei1)
    VALUES (?, ?, ?)
  `);

  const t1 = trfStmt.run('TRF-2026-000001', allStores[0], allStores[4], '2026-08-20', '2026-08-22', employeeIdList[0].id, employeeIdList[8].id, 'Received', 'Urgent stock requirement for Bengaluru customer demo');
  trfItemStmt.run(t1.lastInsertRowid, createdPhones[10].id, createdPhones[10].imei1);

  const t2 = trfStmt.run('TRF-2026-000002', allStores[2], allStores[3], '2026-09-10', null, employeeIdList[4].id, null, 'In Transit', 'Inter-Delhi store replenishment');
  trfItemStmt.run(t2.lastInsertRowid, createdPhones[25].id, createdPhones[25].imei1);

  const t3 = trfStmt.run('TRF-2026-000003', allStores[6], allStores[7], '2026-09-12', null, employeeIdList[12].id, null, 'Pending', 'Awaiting dispatch approval from Hyderabad');
  trfItemStmt.run(t3.lastInsertRowid, createdPhones[70].id, createdPhones[70].imei1);

  // 12. Store Expenses
  db.exec(`DELETE FROM expenses`);
  const expStmt = db.prepare(`
    INSERT INTO expenses (store_id, category, description, amount, expense_date, receipt_number, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const expensesList = [
    [allStores[0], 'Rent', 'Monthly showroom lease rent BKC', 85000, '2026-09-01', 'RCP-MUM-0901', 1],
    [allStores[0], 'Electricity', 'Electricity bill August', 14200, '2026-09-05', 'MSEB-8832', 1],
    [allStores[2], 'Rent', 'Monthly lease Connaught Place', 75000, '2026-09-01', 'RCP-DEL-0901', 1],
    [allStores[2], 'Marketing', 'Local storefront branding & display standees', 12500, '2026-09-08', 'MKT-DEL-44', 1],
    [allStores[4], 'Rent', 'Indiranagar outlet rent', 60000, '2026-09-01', 'RCP-BLR-0901', 1],
    [allStores[4], 'Internet', 'Commercial high-speed fiber broadband', 2800, '2026-09-02', 'ACT-5542', 1],
    [allStores[6], 'Transportation', 'Inter-store courier & insured transit logistics', 8900, '2026-09-07', 'BLUEDART-882', 1],
    [allStores[8], 'Packaging', 'Eco-friendly branded phone boxes & microfiber cloths', 15000, '2026-09-03', 'PKG-PUN-01', 1],
    [null, 'Marketing', 'Digital marketing & Instagram ad campaign', 45000, '2026-09-04', 'META-ADS-2026', 1]
  ];

  for (const exp of expensesList) {
    expStmt.run(...exp);
  }

  // 13. Notifications
  db.exec(`DELETE FROM notifications`);
  const notifStmt = db.prepare(`
    INSERT INTO notifications (user_id, store_id, type, title, message, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  notifStmt.run(null, allStores[2], 'TRANSFER_PENDING', 'Stock In Transit', 'Transfer TRF-2026-000002 has been dispatched to South Extension', 0, '/transfers');
  notifStmt.run(null, allStores[4], 'LOW_STOCK', 'Low Stock Alert', 'iPhone 13 128GB stock is below threshold at Indiranagar', 0, '/inventory');
  notifStmt.run(1, null, 'GENERAL', 'Monthly Sales Target', 'Ecofone crossed 30 units sales milestone this month!', 0, '/dashboard');

  // 14. Brand-New GST-Inclusive Accessories
  db.exec(`DELETE FROM accessories`);
  db.exec(`DELETE FROM accessory_purchases`);

  const accStmt = db.prepare(`
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

  const accessoryTemplates = [
    {
      name: '65W GaN Fast Charger',
      category: 'Chargers',
      brand: 'Ecofone Power',
      variant: 'Dual Port Type-C + USB-A',
      description: 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.',
      purchasePrice: 826,   // Taxable: 700, GST: 126
      mrp: 1499,
      sellingPrice: 1180,   // Taxable: 1000, GST: 180
      qty: 45,
      warranty: '1 Year Brand Warranty'
    },
    {
      name: 'Type-C Braided Cable (1.2m)',
      category: 'Cables',
      brand: 'Ecofone Connect',
      variant: '1.2m / 60W Black',
      description: 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.',
      purchasePrice: 354,   // Taxable: 300, GST: 54
      mrp: 799,
      sellingPrice: 590,    // Taxable: 500, GST: 90
      qty: 80,
      warranty: '6 Months Brand Warranty'
    },
    {
      name: 'Premium Silicone Phone Cover',
      category: 'Cases & Covers',
      brand: 'Ecofone Shield',
      variant: 'Midnight Black / Soft Touch',
      description: 'Shockproof liquid silicone protective case with microfiber inner lining.',
      purchasePrice: 236,   // Taxable: 200, GST: 36
      mrp: 699,
      sellingPrice: 472,    // Taxable: 400, GST: 72
      qty: 60,
      warranty: 'No Warranty'
    },
    {
      name: '20W PD USB-C Power Adapter',
      category: 'Chargers',
      brand: 'Apple Certified',
      variant: '20W Single Port Type-C',
      description: 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.',
      purchasePrice: 590,   // Taxable: 500, GST: 90
      mrp: 1299,
      sellingPrice: 944,    // Taxable: 800, GST: 144
      qty: 35,
      warranty: '1 Year Warranty'
    },
    {
      name: '9H Tempered Glass Screen Guard',
      category: 'Screen Protectors',
      brand: 'Ecofone Shield',
      variant: 'Edge-to-Edge HD Clear',
      description: 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.',
      purchasePrice: 118,   // Taxable: 100, GST: 18
      mrp: 499,
      sellingPrice: 295,    // Taxable: 250, GST: 45
      qty: 120,
      warranty: 'No Warranty'
    },
    {
      name: 'Magnetic Wireless Power Bank 10000mAh',
      category: 'Power Banks',
      brand: 'Ecofone Power',
      variant: '15W MagSafe + 20W PD',
      description: 'Slim magnetic snap-on wireless power bank with digital battery indicator.',
      purchasePrice: 1416,  // Taxable: 1200, GST: 216
      mrp: 2999,
      sellingPrice: 2360,   // Taxable: 2000, GST: 360
      qty: 25,
      warranty: '1 Year Brand Warranty'
    }
  ];

  let accSeq = 1;
  for (const storeId of allStores) {
    for (const t of accessoryTemplates) {
      const pInclusive = t.purchasePrice;
      const pTaxable = Math.round((pInclusive * 100 / 118) * 100) / 100;
      const pGst = Math.round((pInclusive - pTaxable) * 100) / 100;

      const sInclusive = t.sellingPrice;
      const sTaxable = Math.round((sInclusive * 100 / 118) * 100) / 100;
      const sGst = Math.round((sInclusive - sTaxable) * 100) / 100;

      const accId = `ACC-${String(accSeq).padStart(5, '0')}`;
      const sku = `SKU-${t.category.substring(0, 3).toUpperCase()}-${String(accSeq).padStart(4, '0')}`;
      const barcode = `890${String(100000000 + accSeq)}`;

      accStmt.run(
        accId, sku, barcode, t.name, t.category, t.brand, t.variant, t.description,
        supplierIds[0] || null, 'Apex Mobile Distribution Hub',
        pInclusive, pTaxable, pGst,
        t.mrp, sInclusive, sTaxable, sGst,
        18.0, 1, t.qty, 5, 10,
        storeId, t.warranty, 'In Stock'
      );
      accSeq++;
    }
  }

  db.pragma('foreign_keys = ON');

  console.log('✅ Ecofone Database seeded successfully!');
  console.log(`- Stores: 12`);
  console.log(`- Employees: 24 (2 per store)`);
  console.log(`- Admin: Account configured securely`);
  console.log(`- Phones: ${createdPhones.length}`);
  console.log(`- Completed Sales: ${soldPhones.length}`);
  console.log(`- Accessories: ${accessoryTemplates.length * allStores.length} stock items across 12 stores (All 18% GST-Inclusive)`);
}

seedDatabase();
