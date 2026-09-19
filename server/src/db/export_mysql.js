const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/ecofone.db');
if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

const schemaSql = `-- =====================================================================
-- ECOFONE MULTI-STORE POS & INVENTORY MANAGEMENT SYSTEM
-- MySQL Database Dump & Schema
-- Generated: ${new Date().toISOString()}
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS \`ecofone\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`ecofone\`;

-- ---------------------------------------------------------------------
-- Table structure for \`stores\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`stores\`;
CREATE TABLE \`stores\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL UNIQUE,
  \`address\` TEXT,
  \`city\` VARCHAR(100) NOT NULL,
  \`state\` VARCHAR(100) NOT NULL,
  \`pincode\` VARCHAR(20),
  \`phone\` VARCHAR(50),
  \`email\` VARCHAR(100),
  \`gstin\` VARCHAR(50),
  \`manager\` VARCHAR(100),
  \`status\` VARCHAR(20) DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`users\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`employee_id\` VARCHAR(50) NOT NULL UNIQUE,
  \`username\` VARCHAR(100) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(50),
  \`email\` VARCHAR(100),
  \`address\` TEXT,
  \`role\` ENUM('admin', 'employee') NOT NULL,
  \`assigned_store_id\` INT DEFAULT NULL,
  \`status\` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  \`permissions\` LONGTEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_users_store\` FOREIGN KEY (\`assigned_store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`suppliers\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`suppliers\`;
CREATE TABLE \`suppliers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`contact_person\` VARCHAR(255),
  \`phone\` VARCHAR(50),
  \`email\` VARCHAR(100),
  \`address\` TEXT,
  \`city\` VARCHAR(100),
  \`state\` VARCHAR(100),
  \`gstin\` VARCHAR(50),
  \`status\` VARCHAR(20) DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`brands\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`brands\`;
CREATE TABLE \`brands\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL UNIQUE,
  \`status\` VARCHAR(20) DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`phone_models\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`phone_models\`;
CREATE TABLE \`phone_models\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`brand_id\` INT NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`status\` VARCHAR(20) DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`uk_brand_model\` (\`brand_id\`, \`name\`),
  CONSTRAINT \`fk_models_brand\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`grades\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`grades\`;
CREATE TABLE \`grades\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(50) NOT NULL UNIQUE,
  \`description\` TEXT,
  \`status\` VARCHAR(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`phone_inventory\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`phone_inventory\`;
CREATE TABLE \`phone_inventory\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`internal_product_id\` VARCHAR(100) NOT NULL UNIQUE,
  \`brand\` VARCHAR(100) NOT NULL,
  \`model\` VARCHAR(150) NOT NULL,
  \`variant\` VARCHAR(100),
  \`ram\` VARCHAR(50),
  \`storage\` VARCHAR(50),
  \`color\` VARCHAR(50),
  \`imei1\` VARCHAR(50) NOT NULL UNIQUE,
  \`imei2\` VARCHAR(50) UNIQUE,
  \`serial_number\` VARCHAR(100),
  \`condition_grade\` VARCHAR(50) NOT NULL DEFAULT 'Grade A',
  \`battery_health\` VARCHAR(50),
  \`purchase_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`refurbishment_cost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`additional_cost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_cost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`selling_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`discount\` DECIMAL(12,2) DEFAULT 0.00,
  \`tax_rate\` DECIMAL(5,2) DEFAULT 5.00,
  \`final_selling_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`supplier_id\` INT DEFAULT NULL,
  \`purchase_id\` INT DEFAULT NULL,
  \`purchase_date\` DATE DEFAULT NULL,
  \`warranty_period_months\` INT DEFAULT 6,
  \`warranty_expiry\` DATE DEFAULT NULL,
  \`current_store_id\` INT NOT NULL,
  \`stock_status\` ENUM('AVAILABLE', 'SOLD', 'RESERVED', 'IN_TRANSIT', 'RETURNED', 'DEFECTIVE', 'UNDER_REFURBISHMENT') DEFAULT 'AVAILABLE',
  \`date_added\` DATE DEFAULT (CURRENT_DATE),
  \`date_sold\` DATE DEFAULT NULL,
  \`notes\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_phone_inv_imei1\` (\`imei1\`),
  KEY \`idx_phone_inv_store\` (\`current_store_id\`),
  KEY \`idx_phone_inv_status\` (\`stock_status\`),
  CONSTRAINT \`fk_phone_inv_store\` FOREIGN KEY (\`current_store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_phone_inv_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`customers\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`customers\`;
CREATE TABLE \`customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`customer_code\` VARCHAR(50) NOT NULL UNIQUE,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(50) NOT NULL,
  \`email\` VARCHAR(100),
  \`address\` TEXT,
  \`city\` VARCHAR(100),
  \`state\` VARCHAR(100),
  \`pincode\` VARCHAR(20),
  \`gstin\` VARCHAR(50),
  \`id_proof_type\` VARCHAR(50),
  \`id_proof_number\` VARCHAR(100),
  \`total_purchases\` INT DEFAULT 0,
  \`total_spent\` DECIMAL(12,2) DEFAULT 0.00,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_cust_phone\` (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`purchases\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`purchases\`;
CREATE TABLE \`purchases\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`purchase_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`invoice_number\` VARCHAR(100),
  \`supplier_id\` INT NOT NULL,
  \`store_id\` INT NOT NULL,
  \`purchase_date\` DATE NOT NULL,
  \`total_amount\` DECIMAL(12,2) DEFAULT 0.00,
  \`tax_amount\` DECIMAL(12,2) DEFAULT 0.00,
  \`notes\` TEXT,
  \`created_by\` INT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_purchases_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`),
  CONSTRAINT \`fk_purchases_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_purchases_user\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`sales\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`sales\`;
CREATE TABLE \`sales\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sale_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`invoice_number\` VARCHAR(100) NOT NULL UNIQUE,
  \`sale_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`store_id\` INT NOT NULL,
  \`employee_id\` INT NOT NULL,
  \`customer_id\` INT NOT NULL,
  \`subtotal\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`discount_total\` DECIMAL(12,2) DEFAULT 0.00,
  \`taxable_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`cgst\` DECIMAL(12,2) DEFAULT 0.00,
  \`sgst\` DECIMAL(12,2) DEFAULT 0.00,
  \`igst\` DECIMAL(12,2) DEFAULT 0.00,
  \`total_tax\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`grand_total\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`exchange_amount\` DECIMAL(12,2) DEFAULT 0.00,
  \`net_payable\` DECIMAL(12,2) DEFAULT 0.00,
  \`payment_status\` VARCHAR(50) DEFAULT 'PAID',
  \`status\` ENUM('COMPLETED', 'VOID', 'RETURNED') DEFAULT 'COMPLETED',
  \`notes\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY \`idx_sales_store\` (\`store_id\`),
  KEY \`idx_sales_date\` (\`sale_date\`),
  KEY \`idx_sales_invoice\` (\`invoice_number\`),
  CONSTRAINT \`fk_sales_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_sales_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`fk_sales_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`accessories\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`accessories\`;
CREATE TABLE \`accessories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`accessory_id\` VARCHAR(50) NOT NULL UNIQUE,
  \`sku\` VARCHAR(100) NOT NULL UNIQUE,
  \`barcode\` VARCHAR(100),
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`brand\` VARCHAR(100) NOT NULL,
  \`variant\` VARCHAR(100),
  \`description\` TEXT,
  \`supplier_id\` INT DEFAULT NULL,
  \`supplier_name\` VARCHAR(255),
  \`purchase_price_inclusive\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`purchase_taxable_value\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`purchase_gst\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`mrp_inclusive\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`selling_price_inclusive\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`selling_taxable_value\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`selling_gst\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`gst_rate\` DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  \`price_includes_gst\` TINYINT(1) NOT NULL DEFAULT 1,
  \`quantity\` INT NOT NULL DEFAULT 0,
  \`minimum_stock\` INT NOT NULL DEFAULT 5,
  \`reorder_level\` INT NOT NULL DEFAULT 10,
  \`store_id\` INT NOT NULL,
  \`warranty_period\` VARCHAR(50) DEFAULT '6 Months',
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'In Stock',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_acc_sku\` (\`sku\`),
  KEY \`idx_acc_barcode\` (\`barcode\`),
  KEY \`idx_acc_store\` (\`store_id\`),
  KEY \`idx_acc_category\` (\`category\`),
  CONSTRAINT \`fk_acc_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_acc_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`sale_items\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`sale_items\`;
CREATE TABLE \`sale_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sale_id\` INT NOT NULL,
  \`item_type\` VARCHAR(20) DEFAULT 'phone',
  \`phone_id\` INT DEFAULT NULL,
  \`accessory_id\` INT DEFAULT NULL,
  \`imei1\` VARCHAR(50),
  \`brand\` VARCHAR(100) NOT NULL,
  \`model\` VARCHAR(150) NOT NULL,
  \`variant\` VARCHAR(100),
  \`condition_grade\` VARCHAR(50),
  \`unit_cost\` DECIMAL(12,2) NOT NULL,
  \`selling_price\` DECIMAL(12,2) NOT NULL,
  \`discount\` DECIMAL(12,2) DEFAULT 0.00,
  \`taxable_amount\` DECIMAL(12,2) NOT NULL,
  \`tax_rate\` DECIMAL(5,2) DEFAULT 18.00,
  \`price_includes_gst\` TINYINT(1) DEFAULT 0,
  \`cgst\` DECIMAL(12,2) DEFAULT 0.00,
  \`sgst\` DECIMAL(12,2) DEFAULT 0.00,
  \`igst\` DECIMAL(12,2) DEFAULT 0.00,
  \`total_tax\` DECIMAL(12,2) NOT NULL,
  \`final_price\` DECIMAL(12,2) NOT NULL,
  \`quantity\` INT DEFAULT 1,
  \`warranty_period_months\` INT DEFAULT 6,
  \`warranty_expiry\` DATE DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_sale_items_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_sale_items_phone\` FOREIGN KEY (\`phone_id\`) REFERENCES \`phone_inventory\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_sale_items_acc\` FOREIGN KEY (\`accessory_id\`) REFERENCES \`accessories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`payments\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`payments\`;
CREATE TABLE \`payments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sale_id\` INT NOT NULL,
  \`payment_method\` ENUM('Cash', 'UPI', 'Card', 'Bank Transfer', 'Other') NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`reference_number\` VARCHAR(100),
  \`payment_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_payments_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`stock_transfers\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`stock_transfers\`;
CREATE TABLE \`stock_transfers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transfer_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`from_store_id\` INT NOT NULL,
  \`to_store_id\` INT NOT NULL,
  \`transfer_date\` DATE NOT NULL,
  \`received_date\` DATE DEFAULT NULL,
  \`initiated_by\` INT NOT NULL,
  \`received_by\` INT DEFAULT NULL,
  \`status\` ENUM('Pending', 'Approved', 'In Transit', 'Received', 'Cancelled') DEFAULT 'Pending',
  \`notes\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_transfer_from_store\` FOREIGN KEY (\`from_store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_transfer_to_store\` FOREIGN KEY (\`to_store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_transfer_initiated_by\` FOREIGN KEY (\`initiated_by\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`fk_transfer_received_by\` FOREIGN KEY (\`received_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`stock_transfer_items\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`stock_transfer_items\`;
CREATE TABLE \`stock_transfer_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transfer_id\` INT NOT NULL,
  \`phone_id\` INT NOT NULL,
  \`imei1\` VARCHAR(50) NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_transfer_items_transfer\` FOREIGN KEY (\`transfer_id\`) REFERENCES \`stock_transfers\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_transfer_items_phone\` FOREIGN KEY (\`phone_id\`) REFERENCES \`phone_inventory\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`returns\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`returns\`;
CREATE TABLE \`returns\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`return_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`sale_id\` INT NOT NULL,
  \`invoice_number\` VARCHAR(100) NOT NULL,
  \`store_id\` INT NOT NULL,
  \`customer_id\` INT NOT NULL,
  \`return_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`reason\` TEXT NOT NULL,
  \`status\` ENUM('Requested', 'Approved', 'Rejected', 'Returned', 'Refunded') DEFAULT 'Requested',
  \`refund_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`refund_method\` VARCHAR(100) DEFAULT 'Original Payment Method',
  \`notes\` TEXT,
  \`processed_by\` INT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_returns_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`),
  CONSTRAINT \`fk_returns_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_returns_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`),
  CONSTRAINT \`fk_returns_processed_by\` FOREIGN KEY (\`processed_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`return_items\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`return_items\`;
CREATE TABLE \`return_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`return_id\` INT NOT NULL,
  \`phone_id\` INT NOT NULL,
  \`imei1\` VARCHAR(50) NOT NULL,
  \`sale_item_id\` INT DEFAULT NULL,
  \`condition_received\` VARCHAR(100),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_return_items_return\` FOREIGN KEY (\`return_id\`) REFERENCES \`returns\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_return_items_phone\` FOREIGN KEY (\`phone_id\`) REFERENCES \`phone_inventory\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`warranties\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`warranties\`;
CREATE TABLE \`warranties\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`phone_id\` INT NOT NULL,
  \`imei1\` VARCHAR(50) NOT NULL,
  \`customer_id\` INT NOT NULL,
  \`sale_id\` INT NOT NULL,
  \`invoice_number\` VARCHAR(100) NOT NULL,
  \`warranty_period_months\` INT DEFAULT 6,
  \`start_date\` DATE NOT NULL,
  \`end_date\` DATE NOT NULL,
  \`status\` ENUM('Active', 'Expired', 'Claimed', 'Void') DEFAULT 'Active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY \`idx_warranties_imei\` (\`imei1\`),
  KEY \`idx_warranties_invoice\` (\`invoice_number\`),
  CONSTRAINT \`fk_warranties_phone\` FOREIGN KEY (\`phone_id\`) REFERENCES \`phone_inventory\` (\`id\`),
  CONSTRAINT \`fk_warranties_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`),
  CONSTRAINT \`fk_warranties_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`expenses\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`expenses\`;
CREATE TABLE \`expenses\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`store_id\` INT DEFAULT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`expense_date\` DATE NOT NULL,
  \`receipt_number\` VARCHAR(100),
  \`created_by\` INT DEFAULT NULL,
  \`notes\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_expenses_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_expenses_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`tax_rates\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`tax_rates\`;
CREATE TABLE \`tax_rates\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`rate\` DECIMAL(5,2) NOT NULL,
  \`cgst_rate\` DECIMAL(5,2) NOT NULL,
  \`sgst_rate\` DECIMAL(5,2) NOT NULL,
  \`igst_rate\` DECIMAL(5,2) NOT NULL,
  \`is_default\` TINYINT(1) DEFAULT 0,
  \`status\` VARCHAR(20) DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`settings\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`settings\`;
CREATE TABLE \`settings\` (
  \`key\` VARCHAR(100) PRIMARY KEY,
  \`value\` LONGTEXT NOT NULL,
  \`group_name\` VARCHAR(50) DEFAULT 'general',
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`audit_logs\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`audit_logs\`;
CREATE TABLE \`audit_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT DEFAULT NULL,
  \`username\` VARCHAR(100),
  \`action\` VARCHAR(255) NOT NULL,
  \`store_id\` INT DEFAULT NULL,
  \`entity_type\` VARCHAR(100),
  \`entity_id\` VARCHAR(100),
  \`details\` LONGTEXT,
  \`ip_address\` VARCHAR(50),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY \`idx_audit_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`notifications\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`notifications\`;
CREATE TABLE \`notifications\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT DEFAULT NULL,
  \`store_id\` INT DEFAULT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`is_read\` TINYINT(1) DEFAULT 0,
  \`link\` VARCHAR(255),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`exchanged_phones\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`exchanged_phones\`;
CREATE TABLE \`exchanged_phones\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`exchange_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`sale_id\` INT DEFAULT NULL,
  \`invoice_number\` VARCHAR(100),
  \`store_id\` INT NOT NULL,
  \`employee_id\` INT NOT NULL,
  \`customer_id\` INT NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_phone\` VARCHAR(50) NOT NULL,
  \`customer_email\` VARCHAR(100),
  \`customer_address\` TEXT,
  \`customer_id_proof_type\` VARCHAR(50),
  \`customer_id_proof_number\` VARCHAR(100),
  \`brand\` VARCHAR(100) NOT NULL,
  \`model\` VARCHAR(150) NOT NULL,
  \`variant\` VARCHAR(100),
  \`color\` VARCHAR(50),
  \`imei1\` VARCHAR(50) NOT NULL,
  \`imei2\` VARCHAR(50),
  \`serial_number\` VARCHAR(100),
  \`condition_grade\` VARCHAR(50) DEFAULT 'Grade B',
  \`battery_health\` VARCHAR(50),
  \`device_condition\` TEXT,
  \`functional_issues\` TEXT,
  \`accessories_included\` TEXT,
  \`exchange_value\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('IN_STOCK', 'REFURBISHING', 'ADDED_TO_INVENTORY', 'SCRAPPED', 'SOLD') DEFAULT 'IN_STOCK',
  \`phone_inventory_id\` INT DEFAULT NULL,
  \`exchange_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`notes\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_exch_imei1\` (\`imei1\`),
  KEY \`idx_exch_store\` (\`store_id\`),
  KEY \`idx_exch_sale\` (\`sale_id\`),
  CONSTRAINT \`fk_exch_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_exch_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`),
  CONSTRAINT \`fk_exch_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`fk_exch_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`),
  CONSTRAINT \`fk_exch_phone_inv\` FOREIGN KEY (\`phone_inventory_id\`) REFERENCES \`phone_inventory\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for \`accessory_purchases\`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS \`accessory_purchases\`;
CREATE TABLE \`accessory_purchases\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`purchase_order_no\` VARCHAR(50),
  \`supplier_id\` INT DEFAULT NULL,
  \`supplier_name\` VARCHAR(255),
  \`accessory_id\` INT DEFAULT NULL,
  \`quantity\` INT NOT NULL,
  \`purchase_price_inclusive\` DECIMAL(12,2) NOT NULL,
  \`taxable_value_per_unit\` DECIMAL(12,2) NOT NULL,
  \`gst_per_unit\` DECIMAL(12,2) NOT NULL,
  \`total_purchase_value\` DECIMAL(12,2) NOT NULL,
  \`total_taxable_value\` DECIMAL(12,2) NOT NULL,
  \`total_gst\` DECIMAL(12,2) NOT NULL,
  \`purchase_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`store_id\` INT DEFAULT NULL,
  KEY \`idx_acc_purchases_acc\` (\`accessory_id\`),
  CONSTRAINT \`fk_acc_purchases_acc\` FOREIGN KEY (\`accessory_id\`) REFERENCES \`accessories\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_acc_purchases_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_acc_purchases_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Table insertion order to respect foreign key hierarchies
const tables = [
  'settings',
  'tax_rates',
  'grades',
  'brands',
  'phone_models',
  'suppliers',
  'stores',
  'users',
  'customers',
  'phone_inventory',
  'accessories',
  'accessory_purchases',
  'purchases',
  'sales',
  'sale_items',
  'payments',
  'stock_transfers',
  'stock_transfer_items',
  'returns',
  'return_items',
  'warranties',
  'expenses',
  'audit_logs',
  'notifications',
  'exchanged_phones'
];

let dataSql = `\n-- =====================================================================\n-- ECOFONE DATA DUMP\n-- =====================================================================\n\n`;

for (const tableName of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) continue;

    dataSql += `-- ---------------------------------------------------------------------\n`;
    dataSql += `-- Dumping data for table \`${tableName}\` (${rows.length} rows)\n`;
    dataSql += `-- ---------------------------------------------------------------------\n`;
    dataSql += `LOCK TABLES \`${tableName}\` WRITE;\n`;

    const cols = Object.keys(rows[0]);
    const colList = cols.map(c => `\`${c}\``).join(', ');

    // Chunk inserts in batches of 50 for optimal MySQL performance
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const valuesList = chunk.map(row => {
        const vals = cols.map(c => escapeSqlString(row[c]));
        return `(${vals.join(', ')})`;
      }).join(',\n  ');

      dataSql += `INSERT INTO \`${tableName}\` (${colList}) VALUES\n  ${valuesList};\n`;
    }

    dataSql += `UNLOCK TABLES;\n\n`;
  } catch (err) {
    console.warn(`Could not export data for table ${tableName}:`, err.message);
  }
}

const finalSql = `${schemaSql}\n${dataSql}\nSET FOREIGN_KEY_CHECKS = 1;\n-- =====================================================================\n-- END OF MYSQL DUMP\n-- =====================================================================\n`;

const targetFiles = [
  path.resolve(__dirname, '../../../ecofone_mysql.sql'),
  path.resolve(__dirname, '../../data/ecofone_mysql.sql')
];

for (const target of targetFiles) {
  fs.writeFileSync(target, finalSql, 'utf8');
  console.log(`✅ Successfully generated MySQL database file at: ${target}`);
}
