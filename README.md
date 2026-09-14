# EcoFone — Multi-Store POS, Inventory & Business Management System
> **Luxury within reach** • Enterprise POS, Inventory & Business Management for Refurbished Smartphone Retail with 12 Physical Stores in India.

![EcoFone POS](client/public/logo.png)

---

## 🌟 Key Capabilities

1. **Centralized Multi-Store Management (12 Outlets across India)**
   - Super Admin / CEO single dashboard view across Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, Lucknow, Chandigarh, and Kochi.
   - Physical store metrics: available stock, sold counts, staff counts, gross revenue, and gross profit.

2. **Device-Level Smartphone Inventory with Unique IMEI Tracking**
   - Refurbished smartphones tracked individually with `IMEI 1`, `IMEI 2`, `serial_number`, `condition_grade` (Like New, Grade A, Grade B, Grade C, Fair), `battery_health` (e.g. 94%), and `internal_product_id`.
   - **360° Device Traceability**: Instant timeline tracking showing supplier purchase date, refurbishment cost, physical store location history, transfer handoffs, customer invoice, and certified warranty.

3. **High-Speed Retail POS & Invoicing**
   - Instant IMEI scanning / barcode lookup from active showroom stock.
   - Customer checkout with on-the-fly registration and GSTIN support.
   - Automated Indian GST engine: Intra-state (CGST 9% + SGST 9%) vs Inter-state (IGST 18%).
   - Sequential invoice generation (`ECO-2026-NNNNNN`).
   - Printable **A4 Tax Invoice** and **80mm Thermal Receipt** layouts.
   - **Rule 2 & 3 Enforcement**: One IMEI cannot be sold twice; once sold, the device status transitions to `SOLD` atomically.

4. **Inter-Store Stock Transfers**
   - Two-step logistical transfer workflow:
     1. *Dispatch*: Source store marks phones as `In Transit` (source available stock decreases immediately).
     2. *Receipt*: Destination store confirms inspection and receives stock (destination inventory increases to `AVAILABLE`).
     3. *Cancellation*: Admin can cancel to safely revert phones to the source store.

5. **True Cost Profit & Loss Management (Rule 8)**
   - Financial accounting based on actual stored unit costs captured at the moment of sale:
     $$\text{Gross Profit} = \text{Net Sales Revenue} - \text{True COGS (Purchase + Refurb + Logistics)}$$
     $$\text{Net Profit} = \text{Gross Profit} - \text{Store Showroom Expenses (Rent, Power, Salaries)}$$

6. **Certified Warranty Verification**
   - Instant warranty status check by device IMEI, invoice number, or customer phone number with live days-remaining countdown.

7. **Multi-Store RBAC & Data Isolation (Rule 7)**
   - Store employees are strictly locked to their assigned physical store's inventory, POS, and sales.
   - CEO / Super Admin possesses centralized control and visibility across all 12 branches.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on v22.17.0)
- npm v10+

### 1. Clone the repository
```bash
git clone git@github.com:YashGupta151/ecofone-pos.git
cd ecofone-pos
```

### 2. Set up Backend
```bash
cd server
npm install
node src/db/seed.js   # Seeds 12 stores, 24 employees, 132 phones, and sample transactions
npm start             # Starts API server on http://localhost:5000
```

### 3. Set up Frontend
```bash
cd ../client
npm install
npm run dev           # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

### CEO / Super Administrator
- **Username**: `admin`
- **Password**: `Admin@123`
- **Access**: Central control over all 12 stores, company-wide P&L, stock transfers, inventory, audit logs, and settings.

### Store Employees (2 per store, password: `Emp@123`)
- **Mumbai Flagship (BKC)**: `emp001` (Rajesh Kulkarni), `emp002` (Pooja Bhosle)
- **South Mumbai (Colaba)**: `emp003` (Sunita Rao), `emp004` (Amit Jadhav)
- **Delhi Connaught Place**: `emp005` (Vikas Sharma), `emp006` (Kavita Rawat)
- **Delhi South Extension**: `emp007` (Neha Kapoor), `emp008` (Rohan Bhatia)
- **Bengaluru Indiranagar**: `emp009` (Arun Kumar), `emp010` (Divya Murthy)
- **Bengaluru Koramangala**: `emp011` (Pooja Hegde), `emp012` (Naveen Gowda)
- **Hyderabad Hitec City**: `emp013` (Karthik Reddy), `emp014` (Swathi Rao)
- **Chennai T. Nagar**: `emp015` (Suresh Raman), `emp016` (Meena Sundaram)
- **Pune Koregaon Park**: `emp017` (Anil Deshmukh), `emp018` (Sneha Shinde)
- **Kolkata Park Street**: `emp019` (Debashis Sen), `emp020` (Riya Mukherjee)
- **Ahmedabad CG Road**: `emp021` (Jignesh Patel), `emp022` (Bhavna Shah)
- **Jaipur MI Road**: `emp023` (Manish Rathore), `emp024` (Priyanka Shekhawat)

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide Icons, React Router v6
- **Backend**: Node.js, Express.js, better-sqlite3 (SQLite WAL mode), JSON Web Tokens (JWT), bcryptjs
- **Database**: SQLite with ACID transactions and 22 relational tables

---

## 📄 License

Proprietary © 2026 EcoFone India. All rights reserved.
