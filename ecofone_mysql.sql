-- =====================================================================
-- ECOFONE MULTI-STORE POS & INVENTORY MANAGEMENT SYSTEM
-- MySQL Database Dump & Schema
-- Generated: 2026-09-18T13:00:35.675Z
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `ecofone` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ecofone`;

-- ---------------------------------------------------------------------
-- Table structure for `stores`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `stores`;
CREATE TABLE `stores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `address` TEXT,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(20),
  `phone` VARCHAR(50),
  `email` VARCHAR(100),
  `gstin` VARCHAR(50),
  `manager` VARCHAR(100),
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `users`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `email` VARCHAR(100),
  `address` TEXT,
  `role` ENUM('admin', 'employee') NOT NULL,
  `assigned_store_id` INT DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `permissions` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_store` FOREIGN KEY (`assigned_store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `suppliers`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(255),
  `phone` VARCHAR(50),
  `email` VARCHAR(100),
  `address` TEXT,
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `gstin` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `brands`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `phone_models`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `phone_models`;
CREATE TABLE `phone_models` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `brand_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_brand_model` (`brand_id`, `name`),
  CONSTRAINT `fk_models_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `grades`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `grades`;
CREATE TABLE `grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `status` VARCHAR(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `phone_inventory`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `phone_inventory`;
CREATE TABLE `phone_inventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `internal_product_id` VARCHAR(100) NOT NULL UNIQUE,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `variant` VARCHAR(100),
  `ram` VARCHAR(50),
  `storage` VARCHAR(50),
  `color` VARCHAR(50),
  `imei1` VARCHAR(50) NOT NULL UNIQUE,
  `imei2` VARCHAR(50) UNIQUE,
  `serial_number` VARCHAR(100),
  `condition_grade` VARCHAR(50) NOT NULL DEFAULT 'Grade A',
  `battery_health` VARCHAR(50),
  `purchase_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `refurbishment_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `additional_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 5.00,
  `final_selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier_id` INT DEFAULT NULL,
  `purchase_id` INT DEFAULT NULL,
  `purchase_date` DATE DEFAULT NULL,
  `warranty_period_months` INT DEFAULT 6,
  `warranty_expiry` DATE DEFAULT NULL,
  `current_store_id` INT NOT NULL,
  `stock_status` ENUM('AVAILABLE', 'SOLD', 'RESERVED', 'IN_TRANSIT', 'RETURNED', 'DEFECTIVE', 'UNDER_REFURBISHMENT') DEFAULT 'AVAILABLE',
  `date_added` DATE DEFAULT (CURRENT_DATE),
  `date_sold` DATE DEFAULT NULL,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_phone_inv_imei1` (`imei1`),
  KEY `idx_phone_inv_store` (`current_store_id`),
  KEY `idx_phone_inv_status` (`stock_status`),
  CONSTRAINT `fk_phone_inv_store` FOREIGN KEY (`current_store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_phone_inv_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `customers`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_code` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100),
  `address` TEXT,
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `pincode` VARCHAR(20),
  `gstin` VARCHAR(50),
  `id_proof_type` VARCHAR(50),
  `id_proof_number` VARCHAR(100),
  `total_purchases` INT DEFAULT 0,
  `total_spent` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_cust_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `purchases`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_number` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_number` VARCHAR(100),
  `supplier_id` INT NOT NULL,
  `store_id` INT NOT NULL,
  `purchase_date` DATE NOT NULL,
  `total_amount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) DEFAULT 0.00,
  `notes` TEXT,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_purchases_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_purchases_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_purchases_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `sales`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_number` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
  `sale_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `store_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `total_tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `exchange_amount` DECIMAL(12,2) DEFAULT 0.00,
  `net_payable` DECIMAL(12,2) DEFAULT 0.00,
  `payment_status` VARCHAR(50) DEFAULT 'PAID',
  `status` ENUM('COMPLETED', 'VOID', 'RETURNED') DEFAULT 'COMPLETED',
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_sales_store` (`store_id`),
  KEY `idx_sales_date` (`sale_date`),
  KEY `idx_sales_invoice` (`invoice_number`),
  CONSTRAINT `fk_sales_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_sales_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `accessories`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `accessories`;
CREATE TABLE `accessories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `accessory_id` VARCHAR(50) NOT NULL UNIQUE,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `barcode` VARCHAR(100),
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `variant` VARCHAR(100),
  `description` TEXT,
  `supplier_id` INT DEFAULT NULL,
  `supplier_name` VARCHAR(255),
  `purchase_price_inclusive` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `purchase_taxable_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `purchase_gst` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `mrp_inclusive` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_price_inclusive` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_taxable_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_gst` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  `price_includes_gst` TINYINT(1) NOT NULL DEFAULT 1,
  `quantity` INT NOT NULL DEFAULT 0,
  `minimum_stock` INT NOT NULL DEFAULT 5,
  `reorder_level` INT NOT NULL DEFAULT 10,
  `store_id` INT NOT NULL,
  `warranty_period` VARCHAR(50) DEFAULT '6 Months',
  `status` VARCHAR(50) NOT NULL DEFAULT 'In Stock',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_acc_sku` (`sku`),
  KEY `idx_acc_barcode` (`barcode`),
  KEY `idx_acc_store` (`store_id`),
  KEY `idx_acc_category` (`category`),
  CONSTRAINT `fk_acc_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_acc_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `sale_items`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `item_type` VARCHAR(20) DEFAULT 'phone',
  `phone_id` INT DEFAULT NULL,
  `accessory_id` INT DEFAULT NULL,
  `imei1` VARCHAR(50),
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `variant` VARCHAR(100),
  `condition_grade` VARCHAR(50),
  `unit_cost` DECIMAL(12,2) NOT NULL,
  `selling_price` DECIMAL(12,2) NOT NULL,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `price_includes_gst` TINYINT(1) DEFAULT 0,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `total_tax` DECIMAL(12,2) NOT NULL,
  `final_price` DECIMAL(12,2) NOT NULL,
  `quantity` INT DEFAULT 1,
  `warranty_period_months` INT DEFAULT 6,
  `warranty_expiry` DATE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sale_items_phone` FOREIGN KEY (`phone_id`) REFERENCES `phone_inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sale_items_acc` FOREIGN KEY (`accessory_id`) REFERENCES `accessories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `payments`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `payment_method` ENUM('Cash', 'UPI', 'Card', 'Bank Transfer', 'Other') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `reference_number` VARCHAR(100),
  `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `stock_transfers`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transfers`;
CREATE TABLE `stock_transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_number` VARCHAR(50) NOT NULL UNIQUE,
  `from_store_id` INT NOT NULL,
  `to_store_id` INT NOT NULL,
  `transfer_date` DATE NOT NULL,
  `received_date` DATE DEFAULT NULL,
  `initiated_by` INT NOT NULL,
  `received_by` INT DEFAULT NULL,
  `status` ENUM('Pending', 'Approved', 'In Transit', 'Received', 'Cancelled') DEFAULT 'Pending',
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_transfer_from_store` FOREIGN KEY (`from_store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_transfer_to_store` FOREIGN KEY (`to_store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_transfer_initiated_by` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_transfer_received_by` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `stock_transfer_items`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transfer_items`;
CREATE TABLE `stock_transfer_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_id` INT NOT NULL,
  `phone_id` INT NOT NULL,
  `imei1` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_transfer_items_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transfer_items_phone` FOREIGN KEY (`phone_id`) REFERENCES `phone_inventory` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `returns`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `returns`;
CREATE TABLE `returns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `return_number` VARCHAR(50) NOT NULL UNIQUE,
  `sale_id` INT NOT NULL,
  `invoice_number` VARCHAR(100) NOT NULL,
  `store_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `return_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `reason` TEXT NOT NULL,
  `status` ENUM('Requested', 'Approved', 'Rejected', 'Returned', 'Refunded') DEFAULT 'Requested',
  `refund_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `refund_method` VARCHAR(100) DEFAULT 'Original Payment Method',
  `notes` TEXT,
  `processed_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_returns_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  CONSTRAINT `fk_returns_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_returns_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_returns_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `return_items`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `return_items`;
CREATE TABLE `return_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `return_id` INT NOT NULL,
  `phone_id` INT NOT NULL,
  `imei1` VARCHAR(50) NOT NULL,
  `sale_item_id` INT DEFAULT NULL,
  `condition_received` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_return_items_return` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_return_items_phone` FOREIGN KEY (`phone_id`) REFERENCES `phone_inventory` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `warranties`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `warranties`;
CREATE TABLE `warranties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phone_id` INT NOT NULL,
  `imei1` VARCHAR(50) NOT NULL,
  `customer_id` INT NOT NULL,
  `sale_id` INT NOT NULL,
  `invoice_number` VARCHAR(100) NOT NULL,
  `warranty_period_months` INT DEFAULT 6,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('Active', 'Expired', 'Claimed', 'Void') DEFAULT 'Active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_warranties_imei` (`imei1`),
  KEY `idx_warranties_invoice` (`invoice_number`),
  CONSTRAINT `fk_warranties_phone` FOREIGN KEY (`phone_id`) REFERENCES `phone_inventory` (`id`),
  CONSTRAINT `fk_warranties_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_warranties_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `expenses`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `store_id` INT DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `receipt_number` VARCHAR(100),
  `created_by` INT DEFAULT NULL,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_expenses_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expenses_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `tax_rates`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `tax_rates`;
CREATE TABLE `tax_rates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `rate` DECIMAL(5,2) NOT NULL,
  `cgst_rate` DECIMAL(5,2) NOT NULL,
  `sgst_rate` DECIMAL(5,2) NOT NULL,
  `igst_rate` DECIMAL(5,2) NOT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `settings`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT NOT NULL,
  `group_name` VARCHAR(50) DEFAULT 'general',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `audit_logs`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `username` VARCHAR(100),
  `action` VARCHAR(255) NOT NULL,
  `store_id` INT DEFAULT NULL,
  `entity_type` VARCHAR(100),
  `entity_id` VARCHAR(100),
  `details` LONGTEXT,
  `ip_address` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `notifications`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `store_id` INT DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `link` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `exchanged_phones`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `exchanged_phones`;
CREATE TABLE `exchanged_phones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exchange_number` VARCHAR(50) NOT NULL UNIQUE,
  `sale_id` INT DEFAULT NULL,
  `invoice_number` VARCHAR(100),
  `store_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `customer_email` VARCHAR(100),
  `customer_address` TEXT,
  `customer_id_proof_type` VARCHAR(50),
  `customer_id_proof_number` VARCHAR(100),
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `variant` VARCHAR(100),
  `color` VARCHAR(50),
  `imei1` VARCHAR(50) NOT NULL,
  `imei2` VARCHAR(50),
  `serial_number` VARCHAR(100),
  `condition_grade` VARCHAR(50) DEFAULT 'Grade B',
  `battery_health` VARCHAR(50),
  `device_condition` TEXT,
  `functional_issues` TEXT,
  `accessories_included` TEXT,
  `exchange_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('IN_STOCK', 'REFURBISHING', 'ADDED_TO_INVENTORY', 'SCRAPPED', 'SOLD') DEFAULT 'IN_STOCK',
  `phone_inventory_id` INT DEFAULT NULL,
  `exchange_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_exch_imei1` (`imei1`),
  KEY `idx_exch_store` (`store_id`),
  KEY `idx_exch_sale` (`sale_id`),
  CONSTRAINT `fk_exch_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exch_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `fk_exch_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_exch_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_exch_phone_inv` FOREIGN KEY (`phone_inventory_id`) REFERENCES `phone_inventory` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table structure for `accessory_purchases`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `accessory_purchases`;
CREATE TABLE `accessory_purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_order_no` VARCHAR(50),
  `supplier_id` INT DEFAULT NULL,
  `supplier_name` VARCHAR(255),
  `accessory_id` INT DEFAULT NULL,
  `quantity` INT NOT NULL,
  `purchase_price_inclusive` DECIMAL(12,2) NOT NULL,
  `taxable_value_per_unit` DECIMAL(12,2) NOT NULL,
  `gst_per_unit` DECIMAL(12,2) NOT NULL,
  `total_purchase_value` DECIMAL(12,2) NOT NULL,
  `total_taxable_value` DECIMAL(12,2) NOT NULL,
  `total_gst` DECIMAL(12,2) NOT NULL,
  `purchase_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `store_id` INT DEFAULT NULL,
  KEY `idx_acc_purchases_acc` (`accessory_id`),
  CONSTRAINT `fk_acc_purchases_acc` FOREIGN KEY (`accessory_id`) REFERENCES `accessories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_acc_purchases_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_acc_purchases_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- ECOFONE DATA DUMP
-- =====================================================================

-- ---------------------------------------------------------------------
-- Dumping data for table `settings` (13 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `settings` WRITE;
INSERT INTO `settings` (`key`, `value`, `group_name`, `updated_at`) VALUES
  ('company_name', 'Ecofone', 'general', '2026-09-17 07:17:33'),
  ('company_tagline', 'Luxury within reach', 'general', '2026-09-17 07:17:33'),
  ('logo_url', '/logo.png', 'general', '2026-09-17 07:17:33'),
  ('currency_symbol', '₹', 'general', '2026-09-17 07:17:33'),
  ('currency_code', 'INR', 'general', '2026-09-17 07:17:33'),
  ('company_address', 'SACHAN COMPLEX KRISHNA NAGAR', 'general', '2026-09-17 07:17:33'),
  ('company_phone', '+91 1800 266 3263', 'general', '2026-09-17 07:17:33'),
  ('company_email', 'contact@ecofone.in', 'general', '2026-09-17 07:17:33'),
  ('company_gstin', '27AABCE1234F1Z5', 'tax', '2026-09-17 07:17:33'),
  ('invoice_prefix', 'ECO', 'invoice', '2026-09-17 07:17:33'),
  ('invoice_footer', 'Thank you for choosing Ecofone! Certified Refurbished Premium Devices.', 'invoice', '2026-09-17 07:17:33'),
  ('invoice_terms', '1. 6 Months Ecofone Certified Warranty included.\n2. Warranty covers manufacturing and hardware defects.\n3. Physical and liquid damages are void from warranty.\n4. Original tax invoice is required for warranty and claims.', 'invoice', '2026-09-17 07:17:33'),
  ('default_tax_rate', '5.0', 'tax', '2026-09-17 07:17:33');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `tax_rates` (3 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `tax_rates` WRITE;
INSERT INTO `tax_rates` (`id`, `name`, `rate`, `cgst_rate`, `sgst_rate`, `igst_rate`, `is_default`, `status`, `created_at`) VALUES
  (7, 'GST 5% (Margin Scheme Rule 32(5))', 5, 2.5, 2.5, 5, 1, 'active', '2026-09-17 04:15:30'),
  (8, 'GST 12% (Refurbished Basic)', 12, 6, 6, 12, 0, 'active', '2026-09-17 04:15:30'),
  (9, 'GST 18% (Standard Electronics)', 18, 9, 9, 18, 0, 'active', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `grades` (5 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `grades` WRITE;
INSERT INTO `grades` (`id`, `name`, `description`, `status`) VALUES
  (11, 'Like New', 'Zero scratches, 95%+ battery health, immaculate screen and body', 'active'),
  (12, 'Grade A', 'Barely visible micro-scratches, 90%+ battery health, fully tested 64-point check', 'active'),
  (13, 'Grade B', 'Minor signs of light use on bezel, 85%+ battery health, perfect display', 'active'),
  (14, 'Grade C', 'Visible cosmetic wear, 100% functional guarantee, 80%+ battery health', 'active'),
  (15, 'Fair', 'Noticeable scratches, great value budget pick, completely operational', 'active');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `brands` (6 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `brands` WRITE;
INSERT INTO `brands` (`id`, `name`, `status`, `created_at`) VALUES
  (13, 'Apple', 'active', '2026-09-17 04:15:30'),
  (14, 'Samsung', 'active', '2026-09-17 04:15:30'),
  (15, 'OnePlus', 'active', '2026-09-17 04:15:30'),
  (16, 'Google', 'active', '2026-09-17 04:15:30'),
  (17, 'Xiaomi', 'active', '2026-09-17 04:15:30'),
  (18, 'Vivo', 'active', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `phone_models` (38 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `phone_models` WRITE;
INSERT INTO `phone_models` (`id`, `brand_id`, `name`, `status`, `created_at`) VALUES
  (77, 13, 'iPhone 11', 'active', '2026-09-17 04:15:30'),
  (78, 13, 'iPhone 12', 'active', '2026-09-17 04:15:30'),
  (79, 13, 'iPhone 12 Pro', 'active', '2026-09-17 04:15:30'),
  (80, 13, 'iPhone 13', 'active', '2026-09-17 04:15:30'),
  (81, 13, 'iPhone 13 Pro', 'active', '2026-09-17 04:15:30'),
  (82, 13, 'iPhone 13 Pro Max', 'active', '2026-09-17 04:15:30'),
  (83, 13, 'iPhone 14', 'active', '2026-09-17 04:15:30'),
  (84, 13, 'iPhone 14 Pro', 'active', '2026-09-17 04:15:30'),
  (85, 13, 'iPhone 15', 'active', '2026-09-17 04:15:30'),
  (86, 13, 'iPhone 15 Pro', 'active', '2026-09-17 04:15:30'),
  (87, 13, 'iPhone SE (2022)', 'active', '2026-09-17 04:15:30'),
  (88, 14, 'Galaxy S21 5G', 'active', '2026-09-17 04:15:30'),
  (89, 14, 'Galaxy S22 5G', 'active', '2026-09-17 04:15:30'),
  (90, 14, 'Galaxy S22 Ultra', 'active', '2026-09-17 04:15:30'),
  (91, 14, 'Galaxy S23 5G', 'active', '2026-09-17 04:15:30'),
  (92, 14, 'Galaxy S23 Ultra', 'active', '2026-09-17 04:15:30'),
  (93, 14, 'Galaxy S24', 'active', '2026-09-17 04:15:30'),
  (94, 14, 'Galaxy A54 5G', 'active', '2026-09-17 04:15:30'),
  (95, 14, 'Galaxy Note 20 Ultra', 'active', '2026-09-17 04:15:30'),
  (96, 15, 'OnePlus 9 Pro', 'active', '2026-09-17 04:15:30'),
  (97, 15, 'OnePlus 10 Pro', 'active', '2026-09-17 04:15:30'),
  (98, 15, 'OnePlus 11 5G', 'active', '2026-09-17 04:15:30'),
  (99, 15, 'OnePlus 12R', 'active', '2026-09-17 04:15:30'),
  (100, 15, 'OnePlus Nord 3 5G', 'active', '2026-09-17 04:15:30'),
  (101, 15, 'OnePlus Nord CE 3', 'active', '2026-09-17 04:15:30'),
  (102, 16, 'Pixel 6 Pro', 'active', '2026-09-17 04:15:30'),
  (103, 16, 'Pixel 7', 'active', '2026-09-17 04:15:30'),
  (104, 16, 'Pixel 7 Pro', 'active', '2026-09-17 04:15:30'),
  (105, 16, 'Pixel 8', 'active', '2026-09-17 04:15:30'),
  (106, 16, 'Pixel 8 Pro', 'active', '2026-09-17 04:15:30'),
  (107, 16, 'Pixel 7a', 'active', '2026-09-17 04:15:30'),
  (108, 17, 'Xiaomi 13 Pro', 'active', '2026-09-17 04:15:30'),
  (109, 17, 'Xiaomi 12 Pro', 'active', '2026-09-17 04:15:30'),
  (110, 17, 'Redmi Note 12 Pro+ 5G', 'active', '2026-09-17 04:15:30'),
  (111, 17, 'Redmi Note 13 Pro+ 5G', 'active', '2026-09-17 04:15:30'),
  (112, 18, 'Vivo X90 Pro', 'active', '2026-09-17 04:15:30'),
  (113, 18, 'Vivo V29 Pro', 'active', '2026-09-17 04:15:30'),
  (114, 18, 'Vivo V30 5G', 'active', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `suppliers` (5 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `suppliers` WRITE;
INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `city`, `state`, `gstin`, `status`, `created_at`) VALUES
  (8, 'ReTech Global Wholesale', 'Sunil Narang', '+91 98110 54321', 'sales@retech.in', 'Plot 45, Okhla Industrial Area', 'New Delhi', 'Delhi', '07AAACR1234A1Z1', 'active', '2026-09-17 04:15:30'),
  (9, 'Apex Mobile Recyclers', 'Hemant Mehta', '+91 98202 87654', 'info@apexmobile.com', 'Sector 18, Vashi', 'Navi Mumbai', 'Maharashtra', '27AAACA9876B1Z2', 'active', '2026-09-17 04:15:30'),
  (10, 'Nordic Devices India', 'Ashwin Iyer', '+91 98450 11223', 'wholesale@nordicdev.in', 'Electronics City Phase 1', 'Bengaluru', 'Karnataka', '29AAACN4567C1Z3', 'active', '2026-09-17 04:15:30'),
  (11, 'TechRevive Solutions', 'Venkat Chary', '+91 98490 33445', 'orders@techrevive.co', 'Balanagar Industrial Estate', 'Hyderabad', 'Telangana', '36AAACT7890D1Z4', 'active', '2026-09-17 04:15:30'),
  (12, 'GreenCell Mobility', 'Sameer Khan', '+91 98290 55667', 'sales@greencell.in', 'Sitapura Industrial Area', 'Jaipur', 'Rajasthan', '08AAACG2345E1Z5', 'active', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `stores` (12 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `stores` WRITE;
INSERT INTO `stores` (`id`, `name`, `code`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `gstin`, `manager`, `status`, `created_at`, `updated_at`) VALUES
  (13, 'Ecofone Mumbai Flagship', 'ECO-MUM-01', 'Shop 12-14, Ground Floor, The Capital, BKC', 'Mumbai', 'Maharashtra', '400051', '+91 98201 11001', 'mumbai.bkc@ecofone.in', '27AABCE1234F1Z5', 'Rajesh Kulkarni', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (14, 'Ecofone South Mumbai', 'ECO-MUM-02', 'Unit 4, Colaba Causeway, Near Regal Cinema', 'Mumbai', 'Maharashtra', '400001', '+91 98201 11002', 'mumbai.colaba@ecofone.in', '27AABCE1234F1Z5', 'Sunita Rao', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (15, 'Ecofone Delhi Connaught Place', 'ECO-DEL-01', 'B-Block 22, Inner Circle, Connaught Place', 'New Delhi', 'Delhi', '110001', '+91 98101 22001', 'delhi.cp@ecofone.in', '07AABCE1234F1Z2', 'Vikas Sharma', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (16, 'Ecofone Delhi South Extension', 'ECO-DEL-02', 'F-18, Main Market, South Extension Part 1', 'New Delhi', 'Delhi', '110049', '+91 98101 22002', 'delhi.southex@ecofone.in', '07AABCE1234F1Z2', 'Neha Kapoor', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (17, 'Ecofone Bengaluru Indiranagar', 'ECO-BLR-01', '542, 100 Feet Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', '+91 98451 33001', 'blr.indiranagar@ecofone.in', '29AABCE1234F1Z8', 'Arun Kumar', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (18, 'Ecofone Bengaluru Koramangala', 'ECO-BLR-02', '80 Feet Road, 4th Block, Koramangala', 'Bengaluru', 'Karnataka', '560034', '+91 98451 33002', 'blr.koramangala@ecofone.in', '29AABCE1234F1Z8', 'Pooja Hegde', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (19, 'Ecofone Hyderabad Hitec City', 'ECO-HYD-01', 'Cyber Towers Junction, Madhapur', 'Hyderabad', 'Telangana', '500081', '+91 98491 44001', 'hyd.hitec@ecofone.in', '36AABCE1234F1Z3', 'Karthik Reddy', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (20, 'Ecofone Chennai T. Nagar', 'ECO-CHN-01', '45 Usman Road, T. Nagar', 'Chennai', 'Tamil Nadu', '600017', '+91 98401 55001', 'chn.tnagar@ecofone.in', '33AABCE1234F1Z0', 'Suresh Raman', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (21, 'Ecofone Pune Koregaon Park', 'ECO-PUN-01', 'Lane 7, North Main Road, Koregaon Park', 'Pune', 'Maharashtra', '411001', '+91 98221 66001', 'pune.kp@ecofone.in', '27AABCE1234F1Z5', 'Anil Deshmukh', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (22, 'Ecofone Kolkata Park Street', 'ECO-KOL-01', '78 Park Street, Near Mocambo', 'Kolkata', 'West Bengal', '700016', '+91 98301 77001', 'kol.parkst@ecofone.in', '19AABCE1234F1Z4', 'Debashis Sen', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (23, 'Ecofone Ahmedabad CG Road', 'ECO-AMD-01', 'Dev Arc Complex, C.G. Road, Navrangpura', 'Ahmedabad', 'Gujarat', '380009', '+91 98981 88001', 'amd.cgroad@ecofone.in', '24AABCE1234F1Z9', 'Jignesh Patel', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (24, 'Ecofone Jaipur MI Road', 'ECO-JAI-01', 'Near Panch Batti, M.I. Road', 'Jaipur', 'Rajasthan', '302001', '+91 98291 99001', 'jai.miroad@ecofone.in', '08AABCE1234F1Z1', 'Manish Rathore', 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `users` (25 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `users` WRITE;
INSERT INTO `users` (`id`, `employee_id`, `username`, `password_hash`, `full_name`, `phone`, `email`, `address`, `role`, `assigned_store_id`, `status`, `created_at`, `updated_at`, `permissions`) VALUES
  (27, 'ECO-EMP-000', 'admin', '$2a$10$rmUZ50SH4POtzO1iDTxkmO0.NIuK6EeDPvEaH17SLuJhTIoUMyDia', 'Aman Singhania (CEO)', '+91 98200 99999', 'ceo@ecofone.in', 'Ecofone Headquarters, Mumbai', 'admin', NULL, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (28, 'ECO-EMP-001', 'emp001', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Rajesh Kulkarni', '+91 98200 10001', 'emp001@ecofone.in', 'Mumbai, India', 'employee', 13, 'active', '2026-09-17 04:15:30', '2026-09-17 05:55:33', '{"dashboard":{"view":true,"edit":false},"pos":{"view":false,"edit":false},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true,"edit":false},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true,"edit":false},"profile":{"view":true,"edit":true}}'),
  (29, 'ECO-EMP-002', 'emp002', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Pooja Bhosle', '+91 98200 10002', 'emp002@ecofone.in', 'Mumbai, India', 'employee', 13, 'active', '2026-09-17 04:15:30', '2026-09-17 05:44:33', '{"dashboard":{"view":true},"pos":{"view":true,"edit":true},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true},"profile":{"view":true,"edit":true}}'),
  (30, 'ECO-EMP-003', 'emp003', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Sunita Rao', '+91 98200 10003', 'emp003@ecofone.in', 'Mumbai, India', 'employee', 14, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (31, 'ECO-EMP-004', 'emp004', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Amit Jadhav', '+91 98200 10004', 'emp004@ecofone.in', 'Mumbai, India', 'employee', 14, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (32, 'ECO-EMP-005', 'emp005', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Vikas Sharma', '+91 98200 10005', 'emp005@ecofone.in', 'New Delhi, India', 'employee', 15, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (33, 'ECO-EMP-006', 'emp006', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Kavita Rawat', '+91 98200 10006', 'emp006@ecofone.in', 'New Delhi, India', 'employee', 15, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (34, 'ECO-EMP-007', 'emp007', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Neha Kapoor', '+91 98200 10007', 'emp007@ecofone.in', 'New Delhi, India', 'employee', 16, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (35, 'ECO-EMP-008', 'emp008', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Rohan Bhatia', '+91 98200 10008', 'emp008@ecofone.in', 'New Delhi, India', 'employee', 16, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (36, 'ECO-EMP-009', 'emp009', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Arun Kumar', '+91 98200 10009', 'emp009@ecofone.in', 'Bengaluru, India', 'employee', 17, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (37, 'ECO-EMP-010', 'emp010', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Divya Murthy', '+91 98200 10010', 'emp010@ecofone.in', 'Bengaluru, India', 'employee', 17, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (38, 'ECO-EMP-011', 'emp011', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Pooja Hegde', '+91 98200 10011', 'emp011@ecofone.in', 'Bengaluru, India', 'employee', 18, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (39, 'ECO-EMP-012', 'emp012', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Naveen Gowda', '+91 98200 10012', 'emp012@ecofone.in', 'Bengaluru, India', 'employee', 18, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (40, 'ECO-EMP-013', 'emp013', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Karthik Reddy', '+91 98200 10013', 'emp013@ecofone.in', 'Hyderabad, India', 'employee', 19, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (41, 'ECO-EMP-014', 'emp014', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Swathi Rao', '+91 98200 10014', 'emp014@ecofone.in', 'Hyderabad, India', 'employee', 19, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (42, 'ECO-EMP-015', 'emp015', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Suresh Raman', '+91 98200 10015', 'emp015@ecofone.in', 'Chennai, India', 'employee', 20, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (43, 'ECO-EMP-016', 'emp016', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Meena Sundaram', '+91 98200 10016', 'emp016@ecofone.in', 'Chennai, India', 'employee', 20, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (44, 'ECO-EMP-017', 'emp017', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Anil Deshmukh', '+91 98200 10017', 'emp017@ecofone.in', 'Pune, India', 'employee', 21, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (45, 'ECO-EMP-018', 'emp018', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Sneha Shinde', '+91 98200 10018', 'emp018@ecofone.in', 'Pune, India', 'employee', 21, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (46, 'ECO-EMP-019', 'emp019', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Debashis Sen', '+91 98200 10019', 'emp019@ecofone.in', 'Kolkata, India', 'employee', 22, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (47, 'ECO-EMP-020', 'emp020', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Riya Mukherjee', '+91 98200 10020', 'emp020@ecofone.in', 'Kolkata, India', 'employee', 22, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (48, 'ECO-EMP-021', 'emp021', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Jignesh Patel', '+91 98200 10021', 'emp021@ecofone.in', 'Ahmedabad, India', 'employee', 23, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (49, 'ECO-EMP-022', 'emp022', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Bhavna Shah', '+91 98200 10022', 'emp022@ecofone.in', 'Ahmedabad, India', 'employee', 23, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (50, 'ECO-EMP-023', 'emp023', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Manish Rathore', '+91 98200 10023', 'emp023@ecofone.in', 'Jaipur, India', 'employee', 24, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL),
  (51, 'ECO-EMP-024', 'emp024', '$2a$10$rmUZ50SH4POtzO1iDTxkmOWyZ1XRcW9TZ8JO0Gke3RPbTMqaG5ub.', 'Priyanka Shekhawat', '+91 98200 10024', 'emp024@ecofone.in', 'Jaipur, India', 'employee', 24, 'active', '2026-09-17 04:15:30', '2026-09-17 04:15:30', NULL);
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `customers` (19 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `customers` WRITE;
INSERT INTO `customers` (`id`, `customer_code`, `full_name`, `phone`, `email`, `address`, `city`, `state`, `pincode`, `gstin`, `id_proof_type`, `id_proof_number`, `total_purchases`, `total_spent`, `created_at`, `updated_at`) VALUES
  (31, 'CUST-0001', 'Aditya Roy', '+91 98200 45671', 'aditya.roy@gmail.com', 'Flat 402, Sea Green Apartments, Bandra West', 'Mumbai', 'Maharashtra', '400050', NULL, 'Aadhaar', 'XXXX-XXXX-1234', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (32, 'CUST-0002', 'Kiran Bedi', '+91 98100 45672', 'kiran.b@outlook.com', 'A-45, Defence Colony', 'New Delhi', 'Delhi', '110024', NULL, 'PAN Card', 'ABCDE1234F', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (33, 'CUST-0003', 'Manoj Gowda', '+91 98450 45673', 'manoj.gowda@techcorp.in', 'Villa 12, Palm Meadows, Whitefield', 'Bengaluru', 'Karnataka', '560066', '29AAACM1234D1Z1', 'Driving License', 'KA-01-2020-0012', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (34, 'CUST-0004', 'Deepa Venkat', '+91 98400 45674', 'deepa.v@gmail.com', '14 Besant Nagar 2nd Avenue', 'Chennai', 'Tamil Nadu', '600090', NULL, 'Aadhaar', 'XXXX-XXXX-5678', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (35, 'CUST-0005', 'Tarun Kothari', '+91 98220 45675', 'tarun.k@yahoo.com', '21 Boat Club Road', 'Pune', 'Maharashtra', '411001', NULL, 'Passport', 'Z1234567', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (36, 'CUST-0006', 'Sanjay Aggarwal', '+91 98100 89001', 'sanjay.ag@rediffmail.com', 'Plot 88, Model Town', 'New Delhi', 'Delhi', '110009', NULL, 'Aadhaar', 'XXXX-XXXX-3344', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (37, 'CUST-0007', 'Anita Deshmukh', '+91 98200 89002', 'anita.d@gmail.com', '102 Windermere, Oshiwara', 'Mumbai', 'Maharashtra', '400053', NULL, 'PAN Card', 'BGHYT4567L', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (38, 'CUST-0008', 'Gautam Singhal', '+91 98450 89003', 'gautam@singhalenterprises.com', '34 Lavelle Road', 'Bengaluru', 'Karnataka', '560001', '29AAACG9988H1Z4', 'Aadhaar', 'XXXX-XXXX-7788', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (39, 'CUST-0009', 'Naveen Choudhary', '+91 98490 89004', 'naveen.ch@gmail.com', 'Banjara Hills Road No 10', 'Hyderabad', 'Telangana', '500034', NULL, 'Driving License', 'TS-09-2022-8877', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (40, 'CUST-0010', 'Meera Subramaniam', '+91 98400 89005', 'meera.sub@hotmail.com', '5 Harrington Road, Chetpet', 'Chennai', 'Tamil Nadu', '600031', NULL, 'Passport', 'P9876543', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (41, 'CUST-0011', 'Rohit Sen', '+91 98300 89006', 'rohit.sen@gmail.com', 'Flat 3B, Ballygunge Circular Road', 'Kolkata', 'West Bengal', '700019', NULL, 'Aadhaar', 'XXXX-XXXX-9900', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (42, 'CUST-0012', 'Parthiv Patel', '+91 98980 89007', 'parthiv.p@yahoo.com', '12 Satellite Road', 'Ahmedabad', 'Gujarat', '380015', NULL, 'Aadhaar', 'XXXX-XXXX-4455', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (43, 'CUST-0013', 'Simran Rathore', '+91 98290 89008', 'simran.r@gmail.com', 'C-Scheme, Subhash Marg', 'Jaipur', 'Rajasthan', '302001', NULL, 'PAN Card', 'JKLM8901N', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (44, 'CUST-0014', 'Prashant Joshi', '+91 98220 89009', 'prashant.j@gmail.com', 'Prabhat Road, Deccan Gymkhana', 'Pune', 'Maharashtra', '411004', NULL, 'Aadhaar', 'XXXX-XXXX-2233', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (45, 'CUST-0015', 'Kavita Menon', '+91 98450 89010', 'kavita.m@gmail.com', 'Jayanagar 4th Block', 'Bengaluru', 'Karnataka', '560011', NULL, 'Aadhaar', 'XXXX-XXXX-6677', 0, 0, '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (46, 'CUST-0016', 'Vikramaditya Verma', '9876543210', 'vikram@example.com', '', 'Mumbai', 'Maharashtra', '', NULL, NULL, NULL, 0, 0, '2026-09-17 04:26:16', '2026-09-17 04:26:16'),
  (47, 'CUST-0017', 'Ananya Deshmukh', '9822011223', '', '', 'Mumbai', 'Maharashtra', '', NULL, 'Aadhaar', NULL, 0, 0, '2026-09-17 04:26:31', '2026-09-17 06:04:53'),
  (48, 'CUST-0018', 'yash', '6392971921', '', '', 'Mumbai', 'Maharashtra', '', NULL, 'Aadhaar', NULL, 1, 22400, '2026-09-17 07:17:58', '2026-09-17 07:17:58'),
  (49, 'CUST-0019', 'abhishek', '9598459685', '', '', 'lucknow', 'Maharashtra', '', NULL, 'Aadhaar', '698569545984', 1, 54800, '2026-09-17 07:35:38', '2026-09-17 07:35:38');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `phone_inventory` (133 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `phone_inventory` WRITE;
INSERT INTO `phone_inventory` (`id`, `internal_product_id`, `brand`, `model`, `variant`, `ram`, `storage`, `color`, `imei1`, `imei2`, `serial_number`, `condition_grade`, `battery_health`, `purchase_price`, `refurbishment_cost`, `additional_cost`, `total_cost`, `selling_price`, `discount`, `tax_rate`, `final_selling_price`, `supplier_id`, `purchase_id`, `purchase_date`, `warranty_period_months`, `warranty_expiry`, `current_store_id`, `stock_status`, `date_added`, `date_sold`, `notes`, `created_at`, `updated_at`) VALUES
  (161, 'ECO-PH-00001', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000001', '358941100000001', 'SNAP880001', 'Like New', '98%', 28000, 1000, 300, 29300, 42000, 1000, 5, 48380, 8, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (162, 'ECO-PH-00002', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000002', '358941100000002', 'SNAP880002', 'Grade A', '94%', 42000, 1250, 300, 43550, 62000, 0, 5, 73160, 9, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (163, 'ECO-PH-00003', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000003', '358941100000003', 'SNAP880003', 'Grade A', '91%', 35000, 1500, 300, 36800, 51000, 0, 5, 60180, 10, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (164, 'ECO-PH-00004', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000004', '358941100000004', 'SNAP880004', 'Grade B', '89%', 52000, 1750, 300, 54050, 74000, 1000, 5, 86140, 11, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (165, 'ECO-PH-00005', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000005', '358941100000005', 'SNAP880005', 'Grade B', '96%', 45000, 2000, 300, 47300, 63000, 0, 5, 74340, 12, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (166, 'ECO-PH-00006', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000006', '358941100000006', 'SNAP880006', 'Grade A', '92%', 20000, 2250, 300, 22550, 31000, 0, 5, 36580, 8, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 06:04:26'),
  (167, 'ECO-PH-00007', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000007', '358941100000007', 'SNSA880007', 'Like New', '88%', 34000, 2500, 300, 36800, 49000, 1000, 5, 56640, 9, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (168, 'ECO-PH-00008', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000008', '358941100000008', 'SNSA880008', 'Grade A', '98%', 55000, 2750, 300, 58050, 78000, 0, 5, 92040, 10, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 06:04:53'),
  (169, 'ECO-PH-00009', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000009', '358941100000009', 'SNSA880009', 'Grade A', '94%', 38000, 3000, 300, 41300, 54000, 0, 5, 63720, 11, NULL, '2026-08-01', 6, '2027-02-01', 13, 'SOLD', '2026-08-10', '2026-09-17', 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 07:35:38'),
  (170, 'ECO-PH-00010', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000010', '358941100000010', 'SNSA880010', 'Grade B', '91%', 14000, 3250, 300, 17550, 22000, 1000, 5, 24780, 12, NULL, '2026-08-01', 6, '2027-02-01', 13, 'SOLD', '2026-08-10', '2026-09-17', 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 07:17:58'),
  (171, 'ECO-PH-00011', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000011', '358941100000011', 'SNON880011', 'Grade B', '89%', 27000, 3500, 300, 30800, 39000, 0, 5, 46020, 8, NULL, '2026-08-01', 6, '2027-02-01', 13, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:26:16'),
  (172, 'ECO-PH-00012', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000012', '358941100000012', 'SNON880012', 'Like New', '98%', 24000, 1000, 300, 25300, 34000, 1000, 5, 38940, 8, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (173, 'ECO-PH-00013', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000013', '358941100000013', 'SNGO880013', 'Grade A', '94%', 22000, 1250, 300, 23550, 33000, 0, 5, 38940, 9, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (174, 'ECO-PH-00014', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000014', '358941100000014', 'SNGO880014', 'Grade A', '91%', 48000, 1500, 300, 49800, 69000, 0, 5, 81420, 10, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (175, 'ECO-PH-00015', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000015', '358941100000015', 'SNAP880015', 'Grade B', '89%', 28000, 1750, 300, 30050, 42000, 1000, 5, 48380, 11, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (176, 'ECO-PH-00016', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000016', '358941100000016', 'SNAP880016', 'Grade B', '96%', 42000, 2000, 300, 44300, 62000, 0, 5, 73160, 12, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (177, 'ECO-PH-00017', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000017', '358941100000017', 'SNAP880017', 'Grade A', '92%', 35000, 2250, 300, 37550, 51000, 0, 5, 60180, 8, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (178, 'ECO-PH-00018', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000018', '358941100000018', 'SNAP880018', 'Like New', '88%', 52000, 2500, 300, 54800, 74000, 1000, 5, 86140, 9, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (179, 'ECO-PH-00019', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000019', '358941100000019', 'SNAP880019', 'Grade A', '98%', 45000, 2750, 300, 48050, 63000, 0, 5, 74340, 10, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (180, 'ECO-PH-00020', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000020', '358941100000020', 'SNAP880020', 'Grade A', '94%', 20000, 3000, 300, 23300, 31000, 0, 5, 36580, 11, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (181, 'ECO-PH-00021', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000021', '358941100000021', 'SNSA880021', 'Grade B', '91%', 34000, 3250, 300, 37550, 49000, 1000, 5, 56640, 12, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (182, 'ECO-PH-00022', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000022', '358941100000022', 'SNSA880022', 'Grade B', '89%', 55000, 3500, 300, 58800, 78000, 0, 5, 92040, 8, NULL, '2026-08-01', 6, '2027-02-01', 14, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (183, 'ECO-PH-00023', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000023', '358941100000023', 'SNSA880023', 'Like New', '98%', 38000, 1000, 300, 39300, 54000, 1000, 5, 62540, 8, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (184, 'ECO-PH-00024', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000024', '358941100000024', 'SNSA880024', 'Grade A', '94%', 14000, 1250, 300, 15550, 22000, 0, 5, 25960, 9, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (185, 'ECO-PH-00025', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000025', '358941100000025', 'SNON880025', 'Grade A', '91%', 27000, 1500, 300, 28800, 39000, 0, 5, 46020, 10, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (186, 'ECO-PH-00026', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000026', '358941100000026', 'SNON880026', 'Grade B', '89%', 24000, 1750, 300, 26050, 34000, 1000, 5, 38940, 11, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 07:16:49'),
  (187, 'ECO-PH-00027', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000027', '358941100000027', 'SNGO880027', 'Grade B', '96%', 22000, 2000, 300, 24300, 33000, 0, 5, 38940, 12, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (188, 'ECO-PH-00028', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000028', '358941100000028', 'SNGO880028', 'Grade A', '92%', 48000, 2250, 300, 50550, 69000, 0, 5, 81420, 8, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (189, 'ECO-PH-00029', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000029', '358941100000029', 'SNAP880029', 'Like New', '88%', 28000, 2500, 300, 30800, 42000, 1000, 5, 48380, 9, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (190, 'ECO-PH-00030', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000030', '358941100000030', 'SNAP880030', 'Grade A', '98%', 42000, 2750, 300, 45050, 62000, 0, 5, 73160, 10, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (191, 'ECO-PH-00031', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000031', '358941100000031', 'SNAP880031', 'Grade A', '94%', 35000, 3000, 300, 38300, 51000, 0, 5, 60180, 11, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (192, 'ECO-PH-00032', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000032', '358941100000032', 'SNAP880032', 'Grade B', '91%', 52000, 3250, 300, 55550, 74000, 1000, 5, 86140, 12, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (193, 'ECO-PH-00033', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000033', '358941100000033', 'SNAP880033', 'Grade B', '89%', 45000, 3500, 300, 48800, 63000, 0, 5, 74340, 8, NULL, '2026-08-01', 6, '2027-02-01', 15, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (194, 'ECO-PH-00034', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000034', '358941100000034', 'SNAP880034', 'Like New', '98%', 20000, 1000, 300, 21300, 31000, 1000, 5, 35400, 8, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (195, 'ECO-PH-00035', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000035', '358941100000035', 'SNSA880035', 'Grade A', '94%', 34000, 1250, 300, 35550, 49000, 0, 5, 57820, 9, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (196, 'ECO-PH-00036', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000036', '358941100000036', 'SNSA880036', 'Grade A', '91%', 55000, 1500, 300, 56800, 78000, 0, 5, 92040, 10, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (197, 'ECO-PH-00037', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000037', '358941100000037', 'SNSA880037', 'Grade B', '89%', 38000, 1750, 300, 40050, 54000, 1000, 5, 62540, 11, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (198, 'ECO-PH-00038', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000038', '358941100000038', 'SNSA880038', 'Grade B', '96%', 14000, 2000, 300, 16300, 22000, 0, 5, 25960, 12, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (199, 'ECO-PH-00039', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000039', '358941100000039', 'SNON880039', 'Grade A', '92%', 27000, 2250, 300, 29550, 39000, 0, 5, 46020, 8, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (200, 'ECO-PH-00040', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000040', '358941100000040', 'SNON880040', 'Like New', '88%', 24000, 2500, 300, 26800, 34000, 1000, 5, 38940, 9, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (201, 'ECO-PH-00041', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000041', '358941100000041', 'SNGO880041', 'Grade A', '98%', 22000, 2750, 300, 25050, 33000, 0, 5, 38940, 10, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (202, 'ECO-PH-00042', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000042', '358941100000042', 'SNGO880042', 'Grade A', '94%', 48000, 3000, 300, 51300, 69000, 0, 5, 81420, 11, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (203, 'ECO-PH-00043', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000043', '358941100000043', 'SNAP880043', 'Grade B', '91%', 28000, 3250, 300, 31550, 42000, 1000, 5, 48380, 12, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (204, 'ECO-PH-00044', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000044', '358941100000044', 'SNAP880044', 'Grade B', '89%', 42000, 3500, 300, 45800, 62000, 0, 5, 73160, 8, NULL, '2026-08-01', 6, '2027-02-01', 16, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (205, 'ECO-PH-00045', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000045', '358941100000045', 'SNAP880045', 'Like New', '98%', 35000, 1000, 300, 36300, 51000, 1000, 5, 59000, 8, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (206, 'ECO-PH-00046', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000046', '358941100000046', 'SNAP880046', 'Grade A', '94%', 52000, 1250, 300, 53550, 74000, 0, 5, 87320, 9, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (207, 'ECO-PH-00047', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000047', '358941100000047', 'SNAP880047', 'Grade A', '91%', 45000, 1500, 300, 46800, 63000, 0, 5, 74340, 10, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (208, 'ECO-PH-00048', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000048', '358941100000048', 'SNAP880048', 'Grade B', '89%', 20000, 1750, 300, 22050, 31000, 1000, 5, 35400, 11, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (209, 'ECO-PH-00049', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000049', '358941100000049', 'SNSA880049', 'Grade B', '96%', 34000, 2000, 300, 36300, 49000, 0, 5, 57820, 12, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (210, 'ECO-PH-00050', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000050', '358941100000050', 'SNSA880050', 'Grade A', '92%', 55000, 2250, 300, 57550, 78000, 0, 5, 92040, 8, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30');
INSERT INTO `phone_inventory` (`id`, `internal_product_id`, `brand`, `model`, `variant`, `ram`, `storage`, `color`, `imei1`, `imei2`, `serial_number`, `condition_grade`, `battery_health`, `purchase_price`, `refurbishment_cost`, `additional_cost`, `total_cost`, `selling_price`, `discount`, `tax_rate`, `final_selling_price`, `supplier_id`, `purchase_id`, `purchase_date`, `warranty_period_months`, `warranty_expiry`, `current_store_id`, `stock_status`, `date_added`, `date_sold`, `notes`, `created_at`, `updated_at`) VALUES
  (211, 'ECO-PH-00051', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000051', '358941100000051', 'SNSA880051', 'Like New', '88%', 38000, 2500, 300, 40800, 54000, 1000, 5, 62540, 9, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (212, 'ECO-PH-00052', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000052', '358941100000052', 'SNSA880052', 'Grade A', '98%', 14000, 2750, 300, 17050, 22000, 0, 5, 25960, 10, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (213, 'ECO-PH-00053', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000053', '358941100000053', 'SNON880053', 'Grade A', '94%', 27000, 3000, 300, 30300, 39000, 0, 5, 46020, 11, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (214, 'ECO-PH-00054', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000054', '358941100000054', 'SNON880054', 'Grade B', '91%', 24000, 3250, 300, 27550, 34000, 1000, 5, 38940, 12, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (215, 'ECO-PH-00055', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000055', '358941100000055', 'SNGO880055', 'Grade B', '89%', 22000, 3500, 300, 25800, 33000, 0, 5, 38940, 8, NULL, '2026-08-01', 6, '2027-02-01', 17, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (216, 'ECO-PH-00056', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000056', '358941100000056', 'SNGO880056', 'Like New', '98%', 48000, 1000, 300, 49300, 69000, 1000, 5, 80240, 8, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (217, 'ECO-PH-00057', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000057', '358941100000057', 'SNAP880057', 'Grade A', '94%', 28000, 1250, 300, 29550, 42000, 0, 5, 49560, 9, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (218, 'ECO-PH-00058', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000058', '358941100000058', 'SNAP880058', 'Grade A', '91%', 42000, 1500, 300, 43800, 62000, 0, 5, 73160, 10, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (219, 'ECO-PH-00059', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000059', '358941100000059', 'SNAP880059', 'Grade B', '89%', 35000, 1750, 300, 37050, 51000, 1000, 5, 59000, 11, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (220, 'ECO-PH-00060', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000060', '358941100000060', 'SNAP880060', 'Grade B', '96%', 52000, 2000, 300, 54300, 74000, 0, 5, 87320, 12, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (221, 'ECO-PH-00061', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000061', '358941100000061', 'SNAP880061', 'Grade A', '92%', 45000, 2250, 300, 47550, 63000, 0, 5, 74340, 8, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (222, 'ECO-PH-00062', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000062', '358941100000062', 'SNAP880062', 'Like New', '88%', 20000, 2500, 300, 22800, 31000, 1000, 5, 35400, 9, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (223, 'ECO-PH-00063', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000063', '358941100000063', 'SNSA880063', 'Grade A', '98%', 34000, 2750, 300, 37050, 49000, 0, 5, 57820, 10, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (224, 'ECO-PH-00064', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000064', '358941100000064', 'SNSA880064', 'Grade A', '94%', 55000, 3000, 300, 58300, 78000, 0, 5, 92040, 11, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (225, 'ECO-PH-00065', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000065', '358941100000065', 'SNSA880065', 'Grade B', '91%', 38000, 3250, 300, 41550, 54000, 1000, 5, 62540, 12, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (226, 'ECO-PH-00066', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000066', '358941100000066', 'SNSA880066', 'Grade B', '89%', 14000, 3500, 300, 17800, 22000, 0, 5, 25960, 8, NULL, '2026-08-01', 6, '2027-02-01', 18, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (227, 'ECO-PH-00067', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000067', '358941100000067', 'SNON880067', 'Like New', '98%', 27000, 1000, 300, 28300, 39000, 1000, 5, 44840, 8, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (228, 'ECO-PH-00068', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000068', '358941100000068', 'SNON880068', 'Grade A', '94%', 24000, 1250, 300, 25550, 34000, 0, 5, 40120, 9, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (229, 'ECO-PH-00069', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000069', '358941100000069', 'SNGO880069', 'Grade A', '91%', 22000, 1500, 300, 23800, 33000, 0, 5, 38940, 10, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (230, 'ECO-PH-00070', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000070', '358941100000070', 'SNGO880070', 'Grade B', '89%', 48000, 1750, 300, 50050, 69000, 1000, 5, 80240, 11, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (231, 'ECO-PH-00071', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000071', '358941100000071', 'SNAP880071', 'Grade B', '96%', 28000, 2000, 300, 30300, 42000, 0, 5, 49560, 12, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 07:16:45'),
  (232, 'ECO-PH-00072', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000072', '358941100000072', 'SNAP880072', 'Grade A', '92%', 42000, 2250, 300, 44550, 62000, 0, 5, 73160, 8, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (233, 'ECO-PH-00073', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000073', '358941100000073', 'SNAP880073', 'Like New', '88%', 35000, 2500, 300, 37800, 51000, 1000, 5, 59000, 9, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (234, 'ECO-PH-00074', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000074', '358941100000074', 'SNAP880074', 'Grade A', '98%', 52000, 2750, 300, 55050, 74000, 0, 5, 87320, 10, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (235, 'ECO-PH-00075', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000075', '358941100000075', 'SNAP880075', 'Grade A', '94%', 45000, 3000, 300, 48300, 63000, 0, 5, 74340, 11, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (236, 'ECO-PH-00076', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000076', '358941100000076', 'SNAP880076', 'Grade B', '91%', 20000, 3250, 300, 23550, 31000, 1000, 5, 35400, 12, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (237, 'ECO-PH-00077', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000077', '358941100000077', 'SNSA880077', 'Grade B', '89%', 34000, 3500, 300, 37800, 49000, 0, 5, 57820, 8, NULL, '2026-08-01', 6, '2027-02-01', 19, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (238, 'ECO-PH-00078', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000078', '358941100000078', 'SNSA880078', 'Like New', '98%', 55000, 1000, 300, 56300, 78000, 1000, 5, 90860, 8, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (239, 'ECO-PH-00079', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000079', '358941100000079', 'SNSA880079', 'Grade A', '94%', 38000, 1250, 300, 39550, 54000, 0, 5, 63720, 9, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (240, 'ECO-PH-00080', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000080', '358941100000080', 'SNSA880080', 'Grade A', '91%', 14000, 1500, 300, 15800, 22000, 0, 5, 25960, 10, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (241, 'ECO-PH-00081', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000081', '358941100000081', 'SNON880081', 'Grade B', '89%', 27000, 1750, 300, 29050, 39000, 1000, 5, 44840, 11, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (242, 'ECO-PH-00082', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000082', '358941100000082', 'SNON880082', 'Grade B', '96%', 24000, 2000, 300, 26300, 34000, 0, 5, 40120, 12, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (243, 'ECO-PH-00083', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000083', '358941100000083', 'SNGO880083', 'Grade A', '92%', 22000, 2250, 300, 24550, 33000, 0, 5, 38940, 8, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (244, 'ECO-PH-00084', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000084', '358941100000084', 'SNGO880084', 'Like New', '88%', 48000, 2500, 300, 50800, 69000, 1000, 5, 80240, 9, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (245, 'ECO-PH-00085', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000085', '358941100000085', 'SNAP880085', 'Grade A', '98%', 28000, 2750, 300, 31050, 42000, 0, 5, 49560, 10, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (246, 'ECO-PH-00086', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000086', '358941100000086', 'SNAP880086', 'Grade A', '94%', 42000, 3000, 300, 45300, 62000, 0, 5, 73160, 11, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (247, 'ECO-PH-00087', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000087', '358941100000087', 'SNAP880087', 'Grade B', '91%', 35000, 3250, 300, 38550, 51000, 1000, 5, 59000, 12, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (248, 'ECO-PH-00088', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000088', '358941100000088', 'SNAP880088', 'Grade B', '89%', 52000, 3500, 300, 55800, 74000, 0, 5, 87320, 8, NULL, '2026-08-01', 6, '2027-02-01', 20, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (249, 'ECO-PH-00089', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000089', '358941100000089', 'SNAP880089', 'Like New', '98%', 45000, 1000, 300, 46300, 63000, 1000, 5, 73160, 8, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (250, 'ECO-PH-00090', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000090', '358941100000090', 'SNAP880090', 'Grade A', '94%', 20000, 1250, 300, 21550, 31000, 0, 5, 36580, 9, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (251, 'ECO-PH-00091', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000091', '358941100000091', 'SNSA880091', 'Grade A', '91%', 34000, 1500, 300, 35800, 49000, 0, 5, 57820, 10, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (252, 'ECO-PH-00092', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000092', '358941100000092', 'SNSA880092', 'Grade B', '89%', 55000, 1750, 300, 57050, 78000, 1000, 5, 90860, 11, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (253, 'ECO-PH-00093', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000093', '358941100000093', 'SNSA880093', 'Grade B', '96%', 38000, 2000, 300, 40300, 54000, 0, 5, 63720, 12, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (254, 'ECO-PH-00094', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000094', '358941100000094', 'SNSA880094', 'Grade A', '92%', 14000, 2250, 300, 16550, 22000, 0, 5, 25960, 8, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (255, 'ECO-PH-00095', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000095', '358941100000095', 'SNON880095', 'Like New', '88%', 27000, 2500, 300, 29800, 39000, 1000, 5, 44840, 9, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (256, 'ECO-PH-00096', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000096', '358941100000096', 'SNON880096', 'Grade A', '98%', 24000, 2750, 300, 27050, 34000, 0, 5, 40120, 10, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (257, 'ECO-PH-00097', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000097', '358941100000097', 'SNGO880097', 'Grade A', '94%', 22000, 3000, 300, 25300, 33000, 0, 5, 38940, 11, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (258, 'ECO-PH-00098', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000098', '358941100000098', 'SNGO880098', 'Grade B', '91%', 48000, 3250, 300, 51550, 69000, 1000, 5, 80240, 12, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (259, 'ECO-PH-00099', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000099', '358941100000099', 'SNAP880099', 'Grade B', '89%', 28000, 3500, 300, 31800, 42000, 0, 5, 49560, 8, NULL, '2026-08-01', 6, '2027-02-01', 21, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (260, 'ECO-PH-00100', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000100', '358941100000100', 'SNAP880100', 'Like New', '98%', 42000, 1000, 300, 43300, 62000, 1000, 5, 71980, 8, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30');
INSERT INTO `phone_inventory` (`id`, `internal_product_id`, `brand`, `model`, `variant`, `ram`, `storage`, `color`, `imei1`, `imei2`, `serial_number`, `condition_grade`, `battery_health`, `purchase_price`, `refurbishment_cost`, `additional_cost`, `total_cost`, `selling_price`, `discount`, `tax_rate`, `final_selling_price`, `supplier_id`, `purchase_id`, `purchase_date`, `warranty_period_months`, `warranty_expiry`, `current_store_id`, `stock_status`, `date_added`, `date_sold`, `notes`, `created_at`, `updated_at`) VALUES
  (261, 'ECO-PH-00101', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000101', '358941100000101', 'SNAP880101', 'Grade A', '94%', 35000, 1250, 300, 36550, 51000, 0, 5, 60180, 9, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (262, 'ECO-PH-00102', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000102', '358941100000102', 'SNAP880102', 'Grade A', '91%', 52000, 1500, 300, 53800, 74000, 0, 5, 87320, 10, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (263, 'ECO-PH-00103', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000103', '358941100000103', 'SNAP880103', 'Grade B', '89%', 45000, 1750, 300, 47050, 63000, 1000, 5, 73160, 11, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (264, 'ECO-PH-00104', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000104', '358941100000104', 'SNAP880104', 'Grade B', '96%', 20000, 2000, 300, 22300, 31000, 0, 5, 36580, 12, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (265, 'ECO-PH-00105', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000105', '358941100000105', 'SNSA880105', 'Grade A', '92%', 34000, 2250, 300, 36550, 49000, 0, 5, 57820, 8, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (266, 'ECO-PH-00106', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000106', '358941100000106', 'SNSA880106', 'Like New', '88%', 55000, 2500, 300, 57800, 78000, 1000, 5, 90860, 9, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (267, 'ECO-PH-00107', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000107', '358941100000107', 'SNSA880107', 'Grade A', '98%', 38000, 2750, 300, 41050, 54000, 0, 5, 63720, 10, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (268, 'ECO-PH-00108', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000108', '358941100000108', 'SNSA880108', 'Grade A', '94%', 14000, 3000, 300, 17300, 22000, 0, 5, 25960, 11, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (269, 'ECO-PH-00109', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000109', '358941100000109', 'SNON880109', 'Grade B', '91%', 27000, 3250, 300, 30550, 39000, 1000, 5, 44840, 12, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (270, 'ECO-PH-00110', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000110', '358941100000110', 'SNON880110', 'Grade B', '89%', 24000, 3500, 300, 27800, 34000, 0, 5, 40120, 8, NULL, '2026-08-01', 6, '2027-02-01', 22, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (271, 'ECO-PH-00111', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000111', '358941100000111', 'SNGO880111', 'Like New', '98%', 22000, 1000, 300, 23300, 33000, 1000, 5, 37760, 8, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (272, 'ECO-PH-00112', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000112', '358941100000112', 'SNGO880112', 'Grade A', '94%', 48000, 1250, 300, 49550, 69000, 0, 5, 81420, 9, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (273, 'ECO-PH-00113', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000113', '358941100000113', 'SNAP880113', 'Grade A', '91%', 28000, 1500, 300, 29800, 42000, 0, 5, 49560, 10, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (274, 'ECO-PH-00114', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000114', '358941100000114', 'SNAP880114', 'Grade B', '89%', 42000, 1750, 300, 44050, 62000, 1000, 5, 71980, 11, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (275, 'ECO-PH-00115', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000115', '358941100000115', 'SNAP880115', 'Grade B', '96%', 35000, 2000, 300, 37300, 51000, 0, 5, 60180, 12, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (276, 'ECO-PH-00116', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000116', '358941100000116', 'SNAP880116', 'Grade A', '92%', 52000, 2250, 300, 54550, 74000, 0, 5, 87320, 8, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (277, 'ECO-PH-00117', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000117', '358941100000117', 'SNAP880117', 'Like New', '88%', 45000, 2500, 300, 47800, 63000, 1000, 5, 73160, 9, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (278, 'ECO-PH-00118', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000118', '358941100000118', 'SNAP880118', 'Grade A', '98%', 20000, 2750, 300, 23050, 31000, 0, 5, 36580, 10, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (279, 'ECO-PH-00119', 'Samsung', 'Galaxy S23 5G', '8GB/256GB Phantom Black', '8GB', '256GB', 'Phantom Black', '358941090000119', '358941100000119', 'SNSA880119', 'Grade A', '94%', 34000, 3000, 300, 37300, 49000, 0, 5, 57820, 11, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (280, 'ECO-PH-00120', 'Samsung', 'Galaxy S23 Ultra', '12GB/256GB Green', '12GB', '256GB', 'Green', '358941090000120', '358941100000120', 'SNSA880120', 'Grade B', '91%', 55000, 3250, 300, 58550, 78000, 1000, 5, 90860, 12, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (281, 'ECO-PH-00121', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', '12GB', '256GB', 'Burgundy', '358941090000121', '358941100000121', 'SNSA880121', 'Grade B', '89%', 38000, 3500, 300, 41800, 54000, 0, 5, 63720, 8, NULL, '2026-08-01', 6, '2027-02-01', 23, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (282, 'ECO-PH-00122', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', '8GB', '128GB', 'Awesome Lime', '358941090000122', '358941100000122', 'SNSA880122', 'Like New', '98%', 14000, 1000, 300, 15300, 22000, 1000, 5, 24780, 8, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (283, 'ECO-PH-00123', 'OnePlus', 'OnePlus 11 5G', '16GB/256GB Titan Black', '16GB', '256GB', 'Titan Black', '358941090000123', '358941100000123', 'SNON880123', 'Grade A', '94%', 27000, 1250, 300, 28550, 39000, 0, 5, 46020, 9, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (284, 'ECO-PH-00124', 'OnePlus', 'OnePlus 12R', '8GB/128GB Cool Blue', '8GB', '128GB', 'Cool Blue', '358941090000124', '358941100000124', 'SNON880124', 'Grade A', '91%', 24000, 1500, 300, 25800, 34000, 0, 5, 40120, 10, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (285, 'ECO-PH-00125', 'Google', 'Pixel 7', '8GB/128GB Lemongrass', '8GB', '128GB', 'Lemongrass', '358941090000125', '358941100000125', 'SNGO880125', 'Grade B', '89%', 22000, 1750, 300, 24050, 33000, 1000, 5, 37760, 11, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (286, 'ECO-PH-00126', 'Google', 'Pixel 8 Pro', '12GB/128GB Bay Blue', '12GB', '128GB', 'Bay Blue', '358941090000126', '358941100000126', 'SNGO880126', 'Grade B', '96%', 48000, 2000, 300, 50300, 69000, 0, 5, 81420, 12, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (287, 'ECO-PH-00127', 'Apple', 'iPhone 13', '128GB Midnight', '4GB', '128GB', 'Midnight', '358941090000127', '358941100000127', 'SNAP880127', 'Grade A', '92%', 28000, 2250, 300, 30550, 42000, 0, 5, 49560, 8, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (288, 'ECO-PH-00128', 'Apple', 'iPhone 13 Pro', '256GB Sierra Blue', '6GB', '256GB', 'Sierra Blue', '358941090000128', '358941100000128', 'SNAP880128', 'Like New', '88%', 42000, 2500, 300, 44800, 62000, 1000, 5, 71980, 9, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (289, 'ECO-PH-00129', 'Apple', 'iPhone 14', '128GB Starlight', '6GB', '128GB', 'Starlight', '358941090000129', '358941100000129', 'SNAP880129', 'Grade A', '98%', 35000, 2750, 300, 38050, 51000, 0, 5, 60180, 10, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (290, 'ECO-PH-00130', 'Apple', 'iPhone 14 Pro', '128GB Deep Purple', '6GB', '128GB', 'Deep Purple', '358941090000130', '358941100000130', 'SNAP880130', 'Grade A', '94%', 52000, 3000, 300, 55300, 74000, 0, 5, 87320, 11, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (291, 'ECO-PH-00131', 'Apple', 'iPhone 15', '128GB Black', '6GB', '128GB', 'Black', '358941090000131', '358941100000131', 'SNAP880131', 'Grade B', '91%', 45000, 3250, 300, 48550, 63000, 1000, 5, 73160, 12, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (292, 'ECO-PH-00132', 'Apple', 'iPhone 12', '64GB Blue', '4GB', '64GB', 'Blue', '358941090000132', '358941100000132', 'SNAP880132', 'Grade B', '89%', 20000, 3500, 300, 23800, 31000, 0, 5, 36580, 8, NULL, '2026-08-01', 6, '2027-02-01', 24, 'AVAILABLE', '2026-08-10', NULL, 'Certified Refurbished. Tested and sanitized.', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (293, 'ECO-EXC-29923', 'Apple', 'iphone 11', '128', '', '128', 'black', '665998569959595', NULL, '', 'Grade A', '98', 11000, 0, 0, 11000, 13750, 0, 5, 13887.5, NULL, NULL, '2026-09-17', 6, NULL, 21, 'AVAILABLE', '2026-09-17', NULL, 'Acquired via Customer Exchange #EXC-2026-000001 from abhishek', '2026-09-17 07:58:17', '2026-09-17 07:58:17');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `accessories` (72 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `accessories` WRITE;
INSERT INTO `accessories` (`id`, `accessory_id`, `sku`, `barcode`, `name`, `category`, `brand`, `variant`, `description`, `supplier_id`, `supplier_name`, `purchase_price_inclusive`, `purchase_taxable_value`, `purchase_gst`, `mrp_inclusive`, `selling_price_inclusive`, `selling_taxable_value`, `selling_gst`, `gst_rate`, `price_includes_gst`, `quantity`, `minimum_stock`, `reorder_level`, `store_id`, `warranty_period`, `status`, `created_at`, `updated_at`) VALUES
  (1, 'ACC-00001', 'SKU-CHA-0001', '890100000001', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 13, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 07:14:36'),
  (2, 'ACC-00002', 'SKU-CAB-0002', '890100000002', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 13, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (3, 'ACC-00003', 'SKU-CAS-0003', '890100000003', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 13, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (4, 'ACC-00004', 'SKU-CHA-0004', '890100000004', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 13, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (5, 'ACC-00005', 'SKU-SCR-0005', '890100000005', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 119, 5, 10, 13, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 06:04:53'),
  (6, 'ACC-00006', 'SKU-POW-0006', '890100000006', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 21, 5, 10, 13, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:26:31'),
  (7, 'ACC-00007', 'SKU-CHA-0007', '890100000007', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 14, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (8, 'ACC-00008', 'SKU-CAB-0008', '890100000008', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 14, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (9, 'ACC-00009', 'SKU-CAS-0009', '890100000009', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 14, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (10, 'ACC-00010', 'SKU-CHA-0010', '890100000010', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 14, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (11, 'ACC-00011', 'SKU-SCR-0011', '890100000011', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 14, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (12, 'ACC-00012', 'SKU-POW-0012', '890100000012', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 14, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (13, 'ACC-00013', 'SKU-CHA-0013', '890100000013', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 15, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (14, 'ACC-00014', 'SKU-CAB-0014', '890100000014', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 15, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (15, 'ACC-00015', 'SKU-CAS-0015', '890100000015', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 15, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (16, 'ACC-00016', 'SKU-CHA-0016', '890100000016', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 15, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (17, 'ACC-00017', 'SKU-SCR-0017', '890100000017', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 15, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (18, 'ACC-00018', 'SKU-POW-0018', '890100000018', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 15, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (19, 'ACC-00019', 'SKU-CHA-0019', '890100000019', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 16, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (20, 'ACC-00020', 'SKU-CAB-0020', '890100000020', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 16, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (21, 'ACC-00021', 'SKU-CAS-0021', '890100000021', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 16, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (22, 'ACC-00022', 'SKU-CHA-0022', '890100000022', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 16, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (23, 'ACC-00023', 'SKU-SCR-0023', '890100000023', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 16, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (24, 'ACC-00024', 'SKU-POW-0024', '890100000024', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 16, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (25, 'ACC-00025', 'SKU-CHA-0025', '890100000025', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 17, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (26, 'ACC-00026', 'SKU-CAB-0026', '890100000026', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 17, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (27, 'ACC-00027', 'SKU-CAS-0027', '890100000027', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 17, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (28, 'ACC-00028', 'SKU-CHA-0028', '890100000028', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 17, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (29, 'ACC-00029', 'SKU-SCR-0029', '890100000029', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 17, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (30, 'ACC-00030', 'SKU-POW-0030', '890100000030', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 17, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (31, 'ACC-00031', 'SKU-CHA-0031', '890100000031', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 18, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (32, 'ACC-00032', 'SKU-CAB-0032', '890100000032', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 18, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (33, 'ACC-00033', 'SKU-CAS-0033', '890100000033', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 18, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (34, 'ACC-00034', 'SKU-CHA-0034', '890100000034', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 18, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (35, 'ACC-00035', 'SKU-SCR-0035', '890100000035', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 18, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (36, 'ACC-00036', 'SKU-POW-0036', '890100000036', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 18, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (37, 'ACC-00037', 'SKU-CHA-0037', '890100000037', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 19, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (38, 'ACC-00038', 'SKU-CAB-0038', '890100000038', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 19, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (39, 'ACC-00039', 'SKU-CAS-0039', '890100000039', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 19, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (40, 'ACC-00040', 'SKU-CHA-0040', '890100000040', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 19, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (41, 'ACC-00041', 'SKU-SCR-0041', '890100000041', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 19, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (42, 'ACC-00042', 'SKU-POW-0042', '890100000042', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 19, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (43, 'ACC-00043', 'SKU-CHA-0043', '890100000043', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 20, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (44, 'ACC-00044', 'SKU-CAB-0044', '890100000044', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 20, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (45, 'ACC-00045', 'SKU-CAS-0045', '890100000045', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 20, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (46, 'ACC-00046', 'SKU-CHA-0046', '890100000046', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 20, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (47, 'ACC-00047', 'SKU-SCR-0047', '890100000047', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 20, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (48, 'ACC-00048', 'SKU-POW-0048', '890100000048', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 20, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (49, 'ACC-00049', 'SKU-CHA-0049', '890100000049', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 21, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (50, 'ACC-00050', 'SKU-CAB-0050', '890100000050', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 21, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30');
INSERT INTO `accessories` (`id`, `accessory_id`, `sku`, `barcode`, `name`, `category`, `brand`, `variant`, `description`, `supplier_id`, `supplier_name`, `purchase_price_inclusive`, `purchase_taxable_value`, `purchase_gst`, `mrp_inclusive`, `selling_price_inclusive`, `selling_taxable_value`, `selling_gst`, `gst_rate`, `price_includes_gst`, `quantity`, `minimum_stock`, `reorder_level`, `store_id`, `warranty_period`, `status`, `created_at`, `updated_at`) VALUES
  (51, 'ACC-00051', 'SKU-CAS-0051', '890100000051', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 21, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (52, 'ACC-00052', 'SKU-CHA-0052', '890100000052', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 21, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (53, 'ACC-00053', 'SKU-SCR-0053', '890100000053', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 21, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (54, 'ACC-00054', 'SKU-POW-0054', '890100000054', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 21, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (55, 'ACC-00055', 'SKU-CHA-0055', '890100000055', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 22, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (56, 'ACC-00056', 'SKU-CAB-0056', '890100000056', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 22, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (57, 'ACC-00057', 'SKU-CAS-0057', '890100000057', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 22, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (58, 'ACC-00058', 'SKU-CHA-0058', '890100000058', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 22, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (59, 'ACC-00059', 'SKU-SCR-0059', '890100000059', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 22, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (60, 'ACC-00060', 'SKU-POW-0060', '890100000060', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 22, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (61, 'ACC-00061', 'SKU-CHA-0061', '890100000061', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 23, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (62, 'ACC-00062', 'SKU-CAB-0062', '890100000062', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 23, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (63, 'ACC-00063', 'SKU-CAS-0063', '890100000063', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 23, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (64, 'ACC-00064', 'SKU-CHA-0064', '890100000064', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 23, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (65, 'ACC-00065', 'SKU-SCR-0065', '890100000065', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 23, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (66, 'ACC-00066', 'SKU-POW-0066', '890100000066', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 25, 5, 10, 23, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (67, 'ACC-00067', 'SKU-CHA-0067', '890100000067', '65W GaN Fast Charger', 'Chargers', 'Ecofone Power', 'Dual Port Type-C + USB-A', 'Ultra-compact 65W GaN fast charger with PD 3.0 support for iPhones and Android flagship devices.', NULL, 'Apex Mobile Distribution Hub', 826, 700, 126, 1499, 1180, 1000, 180, 18, 1, 45, 5, 10, 24, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (68, 'ACC-00068', 'SKU-CAB-0068', '890100000068', 'Type-C Braided Cable (1.2m)', 'Cables', 'Ecofone Connect', '1.2m / 60W Black', 'Durable nylon-braided Type-C to Type-C fast charging and data sync cable.', NULL, 'Apex Mobile Distribution Hub', 354, 300, 54, 799, 590, 500, 90, 18, 1, 80, 5, 10, 24, '6 Months Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (69, 'ACC-00069', 'SKU-CAS-0069', '890100000069', 'Premium Silicone Phone Cover', 'Cases & Covers', 'Ecofone Shield', 'Midnight Black / Soft Touch', 'Shockproof liquid silicone protective case with microfiber inner lining.', NULL, 'Apex Mobile Distribution Hub', 236, 200, 36, 699, 472, 400, 72, 18, 1, 60, 5, 10, 24, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (70, 'ACC-00070', 'SKU-CHA-0070', '890100000070', '20W PD USB-C Power Adapter', 'Chargers', 'Apple Certified', '20W Single Port Type-C', 'Fast charging adapter compatible with iPhone 11/12/13/14/15/16.', NULL, 'Apex Mobile Distribution Hub', 590, 500, 90, 1299, 944, 800, 144, 18, 1, 35, 5, 10, 24, '1 Year Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (71, 'ACC-00071', 'SKU-SCR-0071', '890100000071', '9H Tempered Glass Screen Guard', 'Screen Protectors', 'Ecofone Shield', 'Edge-to-Edge HD Clear', 'Oleophobic anti-fingerprint 9H hardness tempered glass with alignment frame.', NULL, 'Apex Mobile Distribution Hub', 118, 100, 18, 499, 295, 250, 45, 18, 1, 120, 5, 10, 24, 'No Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (72, 'ACC-00072', 'SKU-POW-0072', '890100000072', 'Magnetic Wireless Power Bank 10000mAh', 'Power Banks', 'Ecofone Power', '15W MagSafe + 20W PD', 'Slim magnetic snap-on wireless power bank with digital battery indicator.', NULL, 'Apex Mobile Distribution Hub', 1416, 1200, 216, 2999, 2360, 2000, 360, 18, 1, 21, 5, 10, 24, '1 Year Brand Warranty', 'In Stock', '2026-09-17 04:15:30', '2026-09-17 07:16:23');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `sales` (2 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `sales` WRITE;
INSERT INTO `sales` (`id`, `sale_number`, `invoice_number`, `sale_date`, `store_id`, `employee_id`, `customer_id`, `subtotal`, `discount_total`, `taxable_amount`, `cgst`, `sgst`, `igst`, `total_tax`, `grand_total`, `payment_status`, `status`, `notes`, `created_at`, `exchange_amount`, `net_payable`) VALUES
  (1, 'SL-2026-000001', 'ECO-2026-000001', '2026-09-17 07:17:58', 13, 27, 48, 22000, 0, 8000, 200, 200, 0, 400, 22400, 'PAID', 'COMPLETED', '', '2026-09-17 07:17:58', 0, 22400),
  (2, 'SL-2026-000002', 'ECO-2026-000002', '2026-09-17 07:35:38', 13, 27, 49, 54000, 0, 16000, 400, 400, 0, 800, 54800, 'PAID', 'COMPLETED', '', '2026-09-17 07:35:38', 11000, 43800);
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `sale_items` (2 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `sale_items` WRITE;
INSERT INTO `sale_items` (`id`, `sale_id`, `item_type`, `phone_id`, `accessory_id`, `imei1`, `brand`, `model`, `variant`, `condition_grade`, `unit_cost`, `selling_price`, `discount`, `taxable_amount`, `tax_rate`, `price_includes_gst`, `cgst`, `sgst`, `igst`, `total_tax`, `final_price`, `quantity`, `warranty_period_months`, `warranty_expiry`, `created_at`) VALUES
  (1, 1, 'phone', 170, NULL, '358941090000010', 'Samsung', 'Galaxy A54 5G', '8GB/128GB Awesome Lime', 'Grade B', 17550, 22000, 0, 8000, 5, 0, 200, 200, 0, 400, 22400, 1, 6, '2027-03-16', '2026-09-17 07:17:58'),
  (2, 2, 'phone', 169, NULL, '358941090000009', 'Samsung', 'Galaxy S22 Ultra', '12GB/256GB Burgundy', 'Grade A', 41300, 54000, 0, 16000, 5, 0, 400, 400, 0, 800, 54800, 1, 6, '2027-03-16', '2026-09-17 07:35:38');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `payments` (2 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `payments` WRITE;
INSERT INTO `payments` (`id`, `sale_id`, `payment_method`, `amount`, `reference_number`, `payment_date`, `created_at`) VALUES
  (1, 1, 'Cash', 22400, NULL, '2026-09-17 07:17:58', '2026-09-17 07:17:58'),
  (2, 2, 'Cash', 43800, NULL, '2026-09-17 07:35:38', '2026-09-17 07:35:38');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `stock_transfers` (3 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `stock_transfers` WRITE;
INSERT INTO `stock_transfers` (`id`, `transfer_number`, `from_store_id`, `to_store_id`, `transfer_date`, `received_date`, `initiated_by`, `received_by`, `status`, `notes`, `created_at`, `updated_at`) VALUES
  (6, 'TRF-2026-000001', 13, 17, '2026-08-20', '2026-08-22', 28, 36, 'Received', 'Urgent stock requirement for Bengaluru customer demo', '2026-09-17 04:15:30', '2026-09-17 04:15:30'),
  (7, 'TRF-2026-000002', 15, 16, '2026-09-10', '2026-09-17', 32, 27, 'Received', 'Inter-Delhi store replenishment', '2026-09-17 04:15:30', '2026-09-17 07:16:49'),
  (8, 'TRF-2026-000003', 19, 20, '2026-09-12', '2026-09-17', 40, 27, 'Received', 'Awaiting dispatch approval from Hyderabad', '2026-09-17 04:15:30', '2026-09-17 07:16:45');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `stock_transfer_items` (3 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `stock_transfer_items` WRITE;
INSERT INTO `stock_transfer_items` (`id`, `transfer_id`, `phone_id`, `imei1`, `created_at`) VALUES
  (8, 6, 171, '358941090000011', '2026-09-17 04:15:30'),
  (9, 7, 186, '358941090000026', '2026-09-17 04:15:30'),
  (10, 8, 231, '358941090000071', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `warranties` (2 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `warranties` WRITE;
INSERT INTO `warranties` (`id`, `phone_id`, `imei1`, `customer_id`, `sale_id`, `invoice_number`, `warranty_period_months`, `start_date`, `end_date`, `status`, `created_at`) VALUES
  (1, 170, '358941090000010', 48, 1, 'ECO-2026-000001', 6, '2026-09-17', '2027-03-17', 'Active', '2026-09-17 07:17:58'),
  (2, 169, '358941090000009', 49, 2, 'ECO-2026-000002', 6, '2026-09-17', '2027-03-17', 'Active', '2026-09-17 07:35:38');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `expenses` (9 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `expenses` WRITE;
INSERT INTO `expenses` (`id`, `store_id`, `category`, `description`, `amount`, `expense_date`, `receipt_number`, `created_by`, `notes`, `created_at`) VALUES
  (10, 13, 'Rent', 'Monthly showroom lease rent BKC', 85000, '2026-09-01', 'RCP-MUM-0901', 1, NULL, '2026-09-17 04:15:30'),
  (11, 13, 'Electricity', 'Electricity bill August', 14200, '2026-09-05', 'MSEB-8832', 1, NULL, '2026-09-17 04:15:30'),
  (12, 15, 'Rent', 'Monthly lease Connaught Place', 75000, '2026-09-01', 'RCP-DEL-0901', 1, NULL, '2026-09-17 04:15:30'),
  (13, 15, 'Marketing', 'Local storefront branding & display standees', 12500, '2026-09-08', 'MKT-DEL-44', 1, NULL, '2026-09-17 04:15:30'),
  (14, 17, 'Rent', 'Indiranagar outlet rent', 60000, '2026-09-01', 'RCP-BLR-0901', 1, NULL, '2026-09-17 04:15:30'),
  (15, 17, 'Internet', 'Commercial high-speed fiber broadband', 2800, '2026-09-02', 'ACT-5542', 1, NULL, '2026-09-17 04:15:30'),
  (16, 19, 'Transportation', 'Inter-store courier & insured transit logistics', 8900, '2026-09-07', 'BLUEDART-882', 1, NULL, '2026-09-17 04:15:30'),
  (17, 21, 'Packaging', 'Eco-friendly branded phone boxes & microfiber cloths', 15000, '2026-09-03', 'PKG-PUN-01', 1, NULL, '2026-09-17 04:15:30'),
  (18, NULL, 'Marketing', 'Digital marketing & Instagram ad campaign', 45000, '2026-09-04', 'META-ADS-2026', 1, NULL, '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `audit_logs` (142 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `audit_logs` WRITE;
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `store_id`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
  (1, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-14 07:13:18'),
  (2, 2, 'emp001', 'LOGIN', 1, 'USER', '2', 'User logged in successfully', '::1', '2026-09-14 07:13:18'),
  (3, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '37', '{"invoiceNumber":"ECO-2026-000037","itemsCount":1,"grandTotal":45430,"payment_method":"UPI"}', '::1', '2026-09-14 07:13:18'),
  (4, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-14 07:13:26'),
  (5, 1, 'admin', 'INITIATE_TRANSFER', 1, 'TRANSFER', '4', '{"transferNumber":"TRF-2026-000004","count":1,"to_store_id":2}', '::1', '2026-09-14 07:13:26'),
  (6, 1, 'admin', 'RECEIVE_TRANSFER', 2, 'TRANSFER', '4', '{"transferNumber":"TRF-2026-000004"}', '::1', '2026-09-14 07:13:26'),
  (7, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-14 07:14:02'),
  (8, 1, 'admin', 'VOID_INVOICE', 1, 'SALE', '37', '{"invoiceNumber":"ECO-2026-000037","reason":"Test customer return cancellation"}', '::1', '2026-09-14 07:14:02'),
  (9, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-14 07:15:45'),
  (10, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '38', '{"invoiceNumber":"ECO-2026-000038","itemsCount":1,"grandTotal":63720,"payment_method":"Cash"}', '::1', '2026-09-14 07:18:02'),
  (11, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '39', '{"invoiceNumber":"ECO-2026-000039","itemsCount":1,"grandTotal":36580,"payment_method":"UPI"}', '::1', '2026-09-14 07:19:37'),
  (12, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '40', '{"invoiceNumber":"ECO-2026-000040","itemsCount":1,"grandTotal":92040,"payment_method":"UPI"}', '::1', '2026-09-14 07:19:57'),
  (13, 1, 'admin', 'VOID_INVOICE', 1, 'SALE', '40', '{"invoiceNumber":"ECO-2026-000040","reason":"test"}', '::1', '2026-09-14 07:20:41'),
  (14, 1, 'admin', 'VOID_INVOICE', 1, 'SALE', '39', '{"invoiceNumber":"ECO-2026-000039","reason":"test"}', '::1', '2026-09-14 07:20:53'),
  (15, 1, 'admin', 'VOID_INVOICE', 1, 'SALE', '38', '{"invoiceNumber":"ECO-2026-000038","reason":"test"}', '::1', '2026-09-14 07:21:03'),
  (16, 1, 'admin', 'VOID_INVOICE', 12, 'SALE', '36', '{"invoiceNumber":"ECO-2026-000036","reason":"test"}', '::1', '2026-09-14 07:21:07'),
  (17, 1, 'admin', 'VOID_INVOICE', 12, 'SALE', '35', '{"invoiceNumber":"ECO-2026-000035","reason":"test"}', '::1', '2026-09-14 07:21:12'),
  (18, 1, 'admin', 'VOID_INVOICE', 12, 'SALE', '34', '{"invoiceNumber":"ECO-2026-000034","reason":"test"}', '::1', '2026-09-14 07:21:16'),
  (19, 1, 'admin', 'VOID_INVOICE', 11, 'SALE', '33', '{"invoiceNumber":"ECO-2026-000033","reason":"test"}', '::1', '2026-09-14 07:21:22'),
  (20, 1, 'admin', 'VOID_INVOICE', 11, 'SALE', '32', '{"invoiceNumber":"ECO-2026-000032","reason":"test"}', '::1', '2026-09-14 07:21:26'),
  (21, 1, 'admin', 'CREATE_EMPLOYEE', 1, 'USER', '26', '{"username":"yash","role":"employee"}', '::1', '2026-09-14 07:24:10'),
  (22, 2, 'emp001', 'LOGIN', 1, 'USER', '2', 'User logged in successfully', '::1', '2026-09-14 07:26:26'),
  (23, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-14 08:00:04'),
  (24, 1, 'admin', 'ADD_INVENTORY', 1, 'PHONE', '133', '{"internalId":"ECO-PH-00133","imei1":"6569451215464613113","brand":"Apple","model":"iPhone 12","totalCost":1600}', '::1', '2026-09-14 08:01:28'),
  (25, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-15 08:01:35'),
  (26, 1, 'admin', 'UPDATE_STORE', 1, 'STORE', '1', '{"name":"Ecofone Saharanpur","code":"ECO-MUM-01","status":"active"}', '::1', '2026-09-15 08:02:34'),
  (27, 1, 'admin', 'UPDATE_STORE', 1, 'STORE', '1', '{"name":"Ecofone Saharanpur","code":"ECO-MUM-01","status":"active"}', '::1', '2026-09-15 11:54:56'),
  (28, 2, 'emp001', 'LOGIN', 1, 'USER', '2', 'User logged in successfully', '::1', '2026-09-15 11:55:31'),
  (29, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-15 11:57:17'),
  (30, 2, 'emp001', 'LOGIN', 1, 'USER', '2', 'User logged in successfully', '::1', '2026-09-15 11:57:39'),
  (31, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-15 11:59:08'),
  (32, 1, 'admin', 'INITIATE_TRANSFER', 1, 'TRANSFER', '5', '{"transferNumber":"TRF-2026-000005","count":3,"to_store_id":8}', '::1', '2026-09-15 11:59:40'),
  (33, 1, 'admin', 'RECEIVE_TRANSFER', 8, 'TRANSFER', '5', '{"transferNumber":"TRF-2026-000005"}', '::1', '2026-09-15 11:59:49'),
  (34, 1, 'admin', 'RECEIVE_TRANSFER', 8, 'TRANSFER', '3', '{"transferNumber":"TRF-2026-000003"}', '::1', '2026-09-15 11:59:56'),
  (35, 1, 'admin', 'RECEIVE_TRANSFER', 4, 'TRANSFER', '2', '{"transferNumber":"TRF-2026-000002"}', '::1', '2026-09-15 12:00:01'),
  (36, 1, 'admin', 'UPDATE_SETTINGS', NULL, 'SETTINGS', NULL, 'Company and invoice settings updated', '::1', '2026-09-15 12:26:15'),
  (37, 6, 'emp005', 'LOGIN', 3, 'USER', '6', 'User logged in successfully', '::1', '2026-09-15 12:27:38'),
  (38, 6, 'emp005', 'COMPLETE_SALE', 3, 'SALE', '41', '{"invoiceNumber":"ECO-2026-000041","itemsCount":1,"grandTotal":87314.1,"payment_method":"UPI"}', '::1', '2026-09-15 12:30:47'),
  (39, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-15 12:33:38'),
  (40, 1, 'admin', 'RESET_PASSWORD', NULL, 'USER', '7', 'Admin reset user password', '::1', '2026-09-15 12:34:31'),
  (41, 7, 'emp006', 'LOGIN', 3, 'USER', '7', 'User logged in successfully', '::1', '2026-09-15 12:35:19'),
  (42, 7, 'emp006', 'COMPLETE_SALE', 3, 'SALE', '42', '{"invoiceNumber":"ECO-2026-000042","itemsCount":1,"grandTotal":37760,"payment_method":"UPI"}', '::1', '2026-09-15 12:36:41'),
  (43, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-15 12:36:58'),
  (44, 1, 'admin', 'UPDATE_SETTINGS', NULL, 'SETTINGS', NULL, 'Company and invoice settings updated', '::1', '2026-09-15 12:47:55'),
  (45, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '43', '{"invoiceNumber":"ECO-2026-000043","itemsCount":1,"grandTotal":57820,"payment_method":"Cash"}', '::1', '2026-09-15 14:22:00'),
  (46, 2, 'emp001', 'LOGIN', 1, 'USER', '2', 'User logged in successfully', '::1', '2026-09-15 15:13:49'),
  (47, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 05:12:41'),
  (48, 1, 'admin', 'UPDATE_SETTINGS', NULL, 'SETTINGS', NULL, 'Company and invoice settings updated', '::1', '2026-09-16 05:12:54'),
  (49, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '44', '{"invoiceNumber":"ECO-2026-000044","itemsCount":1,"grandTotal":84360,"payment_method":"Cash"}', '::1', '2026-09-16 05:13:53'),
  (50, 1, 'admin', 'UPDATE_INVENTORY', 8, 'PHONE', '133', '{"imei":"6569451215464613113","brand":"Apple","model":"iPhone 12","totalCost":1600,"selling_price":400,"stock_status":"AVAILABLE"}', '::1', '2026-09-16 05:40:37');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `store_id`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
  (51, 1, 'admin', 'TOGGLE_EMPLOYEE_STATUS', NULL, 'USER', '2', '{"status":"inactive"}', '::1', '2026-09-16 07:12:35'),
  (52, 1, 'admin', 'TOGGLE_EMPLOYEE_STATUS', NULL, 'USER', '2', '{"status":"active"}', '::1', '2026-09-16 07:13:04'),
  (53, 1, 'admin', 'TOGGLE_EMPLOYEE_STATUS', NULL, 'USER', '2', '{"status":"inactive"}', '::1', '2026-09-16 07:14:47'),
  (54, 10, 'emp009', 'LOGIN', 5, 'USER', '10', 'User logged in successfully', '::1', '2026-09-16 07:15:12'),
  (55, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 07:15:27'),
  (56, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '45', '{"invoiceNumber":"ECO-2026-000045","itemsCount":1,"grandTotal":74340,"exchangeAmount":12000,"netPayable":62340,"payment_method":"UPI","exchangeNumber":"EXC-2026-000001"}', '::1', '2026-09-16 07:29:45'),
  (57, 1, 'admin', 'EXCHANGE_TO_INVENTORY', 1, 'INVENTORY', '134', '{"exchange_id":1,"imei1":"864249940471327","internal_product_id":"ECO-EXC-20082","cost":12000,"selling_price":18500}', '::1', '2026-09-16 07:29:45'),
  (58, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '1', '{"oldStatus":"ADDED_TO_INVENTORY","newStatus":"REFURBISHING"}', '::1', '2026-09-16 07:33:23'),
  (59, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '1', '{"oldStatus":"REFURBISHING","newStatus":"IN_STOCK"}', '::1', '2026-09-16 07:33:26'),
  (60, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '1', '{"oldStatus":"IN_STOCK","newStatus":"SCRAPPED"}', '::1', '2026-09-16 07:33:27'),
  (61, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '1', '{"oldStatus":"SCRAPPED","newStatus":"REFURBISHING"}', '::1', '2026-09-16 07:33:30'),
  (62, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 07:50:54'),
  (63, 1, 'admin', 'BULK_STOCK_UPLOAD', 1, 'INVENTORY', '135', '{"totalProcessed":1,"importedCount":1,"failedCount":0}', '::1', '2026-09-16 07:50:54'),
  (64, 1, 'admin', 'BULK_STOCK_UPLOAD', 1, 'INVENTORY', '136', '{"totalProcessed":3,"importedCount":3,"failedCount":0}', '::1', '2026-09-16 07:55:37'),
  (65, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 08:02:42'),
  (66, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 08:21:40'),
  (67, 1, 'admin', 'DELETE_INVENTORY', 1, 'PHONE', '136', '{"imei":"864920051234567","brand":"Apple","model":"iPhone 14 Pro"}', '::1', '2026-09-16 09:40:14'),
  (68, 1, 'admin', 'DELETE_INVENTORY', 1, 'PHONE', '138', '{"imei":"864920054567890","brand":"OnePlus","model":"OnePlus 11 5G"}', '::1', '2026-09-16 09:40:19'),
  (69, 1, 'admin', 'DELETE_INVENTORY', 1, 'PHONE', '137', '{"imei":"864920059876543","brand":"Samsung","model":"Galaxy S23 Ultra"}', '::1', '2026-09-16 09:40:20'),
  (70, 1, 'admin', 'BULK_STOCK_UPLOAD', 1, 'INVENTORY', '139', '{"totalProcessed":3,"importedCount":3,"failedCount":0}', '::1', '2026-09-16 09:40:30'),
  (71, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 09:56:43'),
  (72, 1, 'admin', 'BULK_STOCK_UPLOAD', 1, 'INVENTORY', '142', '{"totalProcessed":4,"importedCount":4,"failedCount":0}', '::1', '2026-09-16 09:56:43'),
  (73, 1, 'admin', 'DELETE_INVENTORY', 1, 'PHONE', '141', '{"imei":"864920054567890","brand":"OnePlus","model":"OnePlus 11 5G"}', '::1', '2026-09-16 09:59:05'),
  (74, 1, 'admin', 'DELETE_INVENTORY', 1, 'PHONE', '140', '{"imei":"864920059876543","brand":"Samsung","model":"Galaxy S23 Ultra"}', '::1', '2026-09-16 09:59:06'),
  (75, 1, 'admin', 'DELETE_INVENTORY', 2, 'PHONE', '139', '{"imei":"864920051234567","brand":"Apple","model":"iPhone 14 Pro test"}', '::1', '2026-09-16 09:59:08'),
  (76, 1, 'admin', 'BULK_STOCK_UPLOAD', 1, 'INVENTORY', '146', '{"totalProcessed":3,"importedCount":3,"failedCount":0}', '::1', '2026-09-16 09:59:18'),
  (77, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '46', '{"invoiceNumber":"ECO-2026-000046","itemsCount":1,"grandTotal":20250,"exchangeAmount":0,"netPayable":20250,"payment_method":"UPI","exchangeNumber":null}', '::1', '2026-09-16 10:23:50'),
  (78, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '47', '{"invoiceNumber":"ECO-2026-000047","itemsCount":1,"grandTotal":29350,"exchangeAmount":5000,"netPayable":24350,"payment_method":"UPI","exchangeNumber":"EXC-2026-000002"}', '::1', '2026-09-16 10:23:50'),
  (79, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '48', '{"invoiceNumber":"ECO-2026-000048","itemsCount":1,"grandTotal":10000,"exchangeAmount":0,"netPayable":10000,"payment_method":"Cash","exchangeNumber":null}', '::1', '2026-09-16 10:23:50'),
  (80, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '49', '{"invoiceNumber":"ECO-2026-000046","itemsCount":1,"grandTotal":20250,"exchangeAmount":0,"netPayable":20250,"payment_method":"UPI","exchangeNumber":null}', '::1', '2026-09-16 10:24:21'),
  (81, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '50', '{"invoiceNumber":"ECO-2026-000047","itemsCount":1,"grandTotal":29350,"exchangeAmount":5000,"netPayable":24350,"payment_method":"UPI","exchangeNumber":"EXC-2026-000002"}', '::1', '2026-09-16 10:24:21'),
  (82, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '51', '{"invoiceNumber":"ECO-2026-000048","itemsCount":1,"grandTotal":10000,"exchangeAmount":0,"netPayable":10000,"payment_method":"Cash","exchangeNumber":null}', '::1', '2026-09-16 10:24:21'),
  (83, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '52', '{"invoiceNumber":"ECO-2026-000046","itemsCount":1,"grandTotal":20250,"exchangeAmount":0,"netPayable":20250,"payment_method":"UPI","exchangeNumber":null}', '::1', '2026-09-16 10:44:53'),
  (84, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '53', '{"invoiceNumber":"ECO-2026-000047","itemsCount":1,"grandTotal":29400,"exchangeAmount":5000,"netPayable":24400,"payment_method":"UPI","exchangeNumber":"EXC-2026-000002"}', '::1', '2026-09-16 10:44:53'),
  (85, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '54', '{"invoiceNumber":"ECO-2026-000048","itemsCount":1,"grandTotal":10000,"exchangeAmount":0,"netPayable":10000,"payment_method":"Cash","exchangeNumber":null}', '::1', '2026-09-16 10:44:53'),
  (86, 1, 'admin', 'COMPLETE_SALE', 1, 'SALE', '55', '{"invoiceNumber":"ECO-2026-000046","itemsCount":1,"grandTotal":18500,"exchangeAmount":11952,"netPayable":6548,"payment_method":"Cash","exchangeNumber":"EXC-2026-000002"}', '::1', '2026-09-16 10:53:44'),
  (87, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 12:39:14'),
  (88, 1, 'admin', 'TOGGLE_EMPLOYEE_STATUS', NULL, 'USER', '3', '{"status":"inactive"}', '::1', '2026-09-16 12:39:57'),
  (89, 7, 'emp006', 'LOGIN', 3, 'USER', '7', 'User logged in successfully', '::1', '2026-09-16 12:40:41'),
  (90, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 12:41:10'),
  (91, 1, 'admin', 'TOGGLE_EMPLOYEE_STATUS', NULL, 'USER', '7', '{"status":"inactive"}', '::1', '2026-09-16 12:41:25'),
  (92, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 12:41:47'),
  (93, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 12:51:56'),
  (94, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '5', '{"oldStatus":"IN_STOCK","newStatus":"REFURBISHING"}', '::1', '2026-09-16 12:56:11'),
  (95, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '5', '{"oldStatus":"REFURBISHING","newStatus":"SCRAPPED"}', '::1', '2026-09-16 12:56:12'),
  (96, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '5', '{"oldStatus":"SCRAPPED","newStatus":"REFURBISHING"}', '::1', '2026-09-16 12:56:13'),
  (97, 1, 'admin', 'UPDATE_EXCHANGE_STATUS', 1, 'EXCHANGE', '5', '{"oldStatus":"REFURBISHING","newStatus":"IN_STOCK"}', '::1', '2026-09-16 12:56:14'),
  (98, 6, 'emp005', 'LOGIN', 3, 'USER', '6', 'User logged in successfully', '::1', '2026-09-16 12:59:36'),
  (99, 6, 'emp005', 'COMPLETE_SALE', 3, 'SALE', '56', '{"invoiceNumber":"ECO-2026-000047","itemsCount":1,"grandTotal":51800,"exchangeAmount":10000,"netPayable":41800,"payment_method":"Cash","exchangeNumber":"EXC-2026-000003"}', '::1', '2026-09-16 13:02:06'),
  (100, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 13:03:57');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `store_id`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
  (101, 10, 'emp009', 'LOGIN', 5, 'USER', '10', 'User logged in successfully', '::1', '2026-09-16 13:06:35'),
  (102, 1, 'admin', 'LOGIN', NULL, 'USER', '1', 'User logged in successfully', '::1', '2026-09-16 13:09:16'),
  (103, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 04:25:22'),
  (104, 28, 'emp001', 'LOGIN', 13, 'USER', '28', 'User logged in successfully', '::1', '2026-09-17 04:26:16'),
  (105, 28, 'emp001', 'COMPLETE_SALE', 13, 'SALE', '94', '{"invoiceNumber":"ECO-2026-000037","itemsCount":2,"grandTotal":43660,"exchangeAmount":0,"netPayable":43660,"payment_method":"UPI","exchangeNumber":null}', '::1', '2026-09-17 04:26:16'),
  (106, 28, 'emp001', 'LOGIN', 13, 'USER', '28', 'User logged in successfully', '::1', '2026-09-17 04:26:31'),
  (107, 28, 'emp001', 'COMPLETE_SALE', 13, 'SALE', '95', '{"invoiceNumber":"ECO-2026-000038","itemsCount":2,"grandTotal":26460,"exchangeAmount":0,"netPayable":26460,"payment_method":"UPI","exchangeNumber":null}', '::1', '2026-09-17 04:26:31'),
  (108, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 04:27:41'),
  (109, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 04:50:01'),
  (110, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 05:39:47'),
  (111, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 05:40:21'),
  (112, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '28', '{"targetUser":"emp001","permissionsSummary":{"dashboard":{"view":true},"pos":{"view":true,"edit":false},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":false,"edit":false},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:40:21'),
  (113, 28, 'emp001', 'LOGIN', 13, 'USER', '28', 'User logged in successfully', '::1', '2026-09-17 05:40:21'),
  (114, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '28', '{"targetUser":"emp001","permissionsSummary":{"dashboard":{"view":true},"pos":{"view":true,"edit":true},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:40:21'),
  (115, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 05:44:33'),
  (116, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '29', '{"targetUser":"emp002","permissionsSummary":{"dashboard":{"view":true},"pos":{"view":true,"edit":false},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":false,"edit":false},"accessories":{"view":false,"edit":false},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:44:33'),
  (117, 29, 'emp002', 'LOGIN', 13, 'USER', '29', 'User logged in successfully', '::1', '2026-09-17 05:44:33'),
  (118, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '29', '{"targetUser":"emp002","permissionsSummary":{"dashboard":{"view":true},"pos":{"view":true,"edit":true},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:44:33'),
  (119, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '28', '{"targetUser":"emp001","permissionsSummary":{"dashboard":{"view":true,"edit":false},"pos":{"view":true,"edit":false},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true,"edit":false},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true,"edit":false},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:45:43'),
  (120, 28, 'emp001', 'LOGIN', 13, 'USER', '28', 'User logged in successfully', '::1', '2026-09-17 05:45:59'),
  (121, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 05:46:38'),
  (122, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '28', '{"targetUser":"emp001","permissionsSummary":{"dashboard":{"view":true,"edit":false},"pos":{"view":true,"edit":false},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true,"edit":false},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true,"edit":false},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:52:56'),
  (123, 28, 'emp001', 'LOGIN', 13, 'USER', '28', 'User logged in successfully', '::1', '2026-09-17 05:53:04'),
  (124, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 05:54:19'),
  (125, 27, 'admin', 'UPDATE_EMPLOYEE_PERMISSIONS', 13, 'USER', '28', '{"targetUser":"emp001","permissionsSummary":{"dashboard":{"view":true,"edit":false},"pos":{"view":false,"edit":false},"exchanged_phones":{"view":true,"edit":true},"inventory":{"view":true,"edit":true},"accessories":{"view":true,"edit":true},"stock_entry":{"view":true,"edit":true},"customers":{"view":true,"edit":true},"sales":{"view":true,"edit":false},"invoices":{"view":true,"edit":true},"returns":{"view":true,"edit":true},"warranty":{"view":true,"edit":false},"profile":{"view":true,"edit":true}}}', '::1', '2026-09-17 05:55:33'),
  (126, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 05:55:37'),
  (127, 28, 'emp001', 'LOGIN', 13, 'USER', '28', 'User logged in successfully', '::1', '2026-09-17 05:55:43'),
  (128, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-17 06:00:27'),
  (129, 27, 'admin', 'COMPLETE_SALE', 13, 'SALE', '96', '{"invoiceNumber":"ECO-2026-000039","itemsCount":1,"grandTotal":26817.5,"exchangeAmount":0,"netPayable":26817.5,"payment_method":"Cash","exchangeNumber":null}', '::1', '2026-09-17 06:04:26'),
  (130, 27, 'admin', 'COMPLETE_SALE', 13, 'SALE', '97', '{"invoiceNumber":"ECO-2026-000040","itemsCount":2,"grandTotal":67572.5,"exchangeAmount":0,"netPayable":67572.5,"payment_method":"Cash","exchangeNumber":null}', '::1', '2026-09-17 06:04:53'),
  (131, 27, 'admin', 'VOID_INVOICE', 13, 'SALE', '97', '{"invoiceNumber":"ECO-2026-000040","reason":"test"}', '::1', '2026-09-17 06:23:02'),
  (132, 27, 'admin', 'RECEIVE_TRANSFER', 20, 'TRANSFER', '8', '{"transferNumber":"TRF-2026-000003"}', '::1', '2026-09-17 07:16:45'),
  (133, 27, 'admin', 'RECEIVE_TRANSFER', 16, 'TRANSFER', '7', '{"transferNumber":"TRF-2026-000002"}', '::1', '2026-09-17 07:16:49'),
  (134, 27, 'admin', 'UPDATE_SETTINGS', NULL, 'SETTINGS', NULL, 'Company and invoice settings updated', '::1', '2026-09-17 07:17:33'),
  (135, 27, 'admin', 'COMPLETE_SALE', 13, 'SALE', '1', '{"invoiceNumber":"ECO-2026-000001","itemsCount":1,"grandTotal":22400,"exchangeAmount":0,"netPayable":22400,"payment_method":"Cash","exchangeNumber":null}', '::1', '2026-09-17 07:17:58'),
  (136, 27, 'admin', 'COMPLETE_SALE', 13, 'SALE', '2', '{"invoiceNumber":"ECO-2026-000002","itemsCount":1,"grandTotal":54800,"exchangeAmount":11000,"netPayable":43800,"payment_method":"Cash","exchangeNumber":"EXC-2026-000001"}', '::1', '2026-09-17 07:35:38'),
  (137, 27, 'admin', 'UPDATE_EXCHANGE_STATUS', 13, 'EXCHANGE', '1', '{"oldStatus":"IN_STOCK","newStatus":"REFURBISHING"}', '::1', '2026-09-17 07:55:53'),
  (138, 27, 'admin', 'UPDATE_EXCHANGE_STATUS', 13, 'EXCHANGE', '1', '{"oldStatus":"REFURBISHING","newStatus":"IN_STOCK"}', '::1', '2026-09-17 07:57:23'),
  (139, 27, 'admin', 'EXCHANGE_TO_INVENTORY', 13, 'INVENTORY', '293', '{"exchange_id":1,"imei1":"665998569959595959","internal_product_id":"ECO-EXC-29923","cost":11000,"selling_price":13750}', '::1', '2026-09-17 07:58:17'),
  (140, 27, 'admin', 'UPDATE_EXCHANGE_STATUS', 13, 'EXCHANGE', '1', '{"oldStatus":"ADDED_TO_INVENTORY","newStatus":"REFURBISHING"}', '::1', '2026-09-17 07:59:14'),
  (141, 27, 'admin', 'UPDATE_INVENTORY', 21, 'PHONE', '293', '{"imei":"665998569959595959","brand":"Apple","model":"iphone 11","totalCost":11000,"selling_price":13750,"stock_status":"AVAILABLE"}', '::1', '2026-09-17 08:00:33'),
  (142, 27, 'admin', 'LOGIN', NULL, 'USER', '27', 'User logged in successfully', '::1', '2026-09-18 07:32:59');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `notifications` (3 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `notifications` WRITE;
INSERT INTO `notifications` (`id`, `user_id`, `store_id`, `type`, `title`, `message`, `is_read`, `link`, `created_at`) VALUES
  (4, NULL, 15, 'TRANSFER_PENDING', 'Stock In Transit', 'Transfer TRF-2026-000002 has been dispatched to South Extension', 0, '/transfers', '2026-09-17 04:15:30'),
  (5, NULL, 17, 'LOW_STOCK', 'Low Stock Alert', 'iPhone 13 128GB stock is below threshold at Indiranagar', 0, '/inventory', '2026-09-17 04:15:30'),
  (6, 1, NULL, 'GENERAL', 'Monthly Sales Target', 'Ecofone crossed 30 units sales milestone this month!', 0, '/dashboard', '2026-09-17 04:15:30');
UNLOCK TABLES;

-- ---------------------------------------------------------------------
-- Dumping data for table `exchanged_phones` (1 rows)
-- ---------------------------------------------------------------------
LOCK TABLES `exchanged_phones` WRITE;
INSERT INTO `exchanged_phones` (`id`, `exchange_number`, `sale_id`, `invoice_number`, `store_id`, `employee_id`, `customer_id`, `customer_name`, `customer_phone`, `customer_email`, `customer_address`, `customer_id_proof_type`, `customer_id_proof_number`, `brand`, `model`, `variant`, `color`, `imei1`, `imei2`, `serial_number`, `condition_grade`, `battery_health`, `device_condition`, `functional_issues`, `accessories_included`, `exchange_value`, `status`, `phone_inventory_id`, `exchange_date`, `notes`, `created_at`, `updated_at`) VALUES
  (1, 'EXC-2026-000001', 2, 'ECO-2026-000002', 13, 27, 49, 'abhishek', '9598459685', '', '', 'Aadhaar', '698569545984', 'Apple', 'iphone 11', '128', 'black', '665998569959595', NULL, NULL, 'Grade B', '98', '', '', 'Box, Original Box, Original Charger', 11000, 'REFURBISHING', 293, '2026-09-17 07:35:38', 'Exchanged against Bill #ECO-2026-000002', '2026-09-17 07:35:38', '2026-09-17 07:59:14');
UNLOCK TABLES;


SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================================
-- END OF MYSQL DUMP
-- =====================================================================
