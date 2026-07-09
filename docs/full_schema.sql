
-- Green Horizon Farm Management System
-- Full Database Schema & Seeding Script
-- Target: MariaDB 10.x+ / MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. AUTHENTICATION & USERS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `roles` JSON NOT NULL,
    `status` ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active',
    `avatarUrl` VARCHAR(255) DEFAULT NULL,
    `lastLogin` DATETIME DEFAULT NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`username`),
    INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 2. PERSONNEL & ROSTER
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `personnel` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `rank` VARCHAR(255) NOT NULL,
    `badgeNumber` VARCHAR(10) DEFAULT NULL,
    `discord_username` VARCHAR(255) DEFAULT NULL,
    `phone_number` VARCHAR(20) DEFAULT NULL,
    `bank_account` VARCHAR(50) DEFAULT NULL,
    `hire_date` DATE DEFAULT (CURRENT_DATE),
    `department` VARCHAR(255) DEFAULT 'General',
    `status` ENUM('Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended') NOT NULL DEFAULT 'Active',
    `loa_until` DATE DEFAULT NULL,
    `is_rehired` BOOLEAN NOT NULL DEFAULT FALSE,
    `userId` VARCHAR(36) DEFAULT NULL,
    INDEX (`name`),
    INDEX (`userId`),
    INDEX (`status`),
    CONSTRAINT `fk_personnel_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `personnel_events` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `personnel_name` VARCHAR(255) NOT NULL,
    `event_type` ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL,
    `description` TEXT,
    `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`date`),
    INDEX (`personnel_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 3. LOGISTICS & INVENTORY
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `farm_products` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10, 2) DEFAULT 0.00,
    `local_price` DECIMAL(10, 2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `businesses` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `bank_account` VARCHAR(50) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 4. SALES & ORDERS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `detailed_farm_orders` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `business_name` VARCHAR(255) NOT NULL,
    `items_sold` JSON NOT NULL,
    `discount_amount` DECIMAL(10, 2) DEFAULT 0.00,
    `total_price` DECIMAL(10, 2) DEFAULT 0.00,
    `logistics_used` BOOLEAN DEFAULT FALSE,
    `employee_cut_value` DECIMAL(10, 2) DEFAULT 0.00,
    `employee_cut_percentage` INT DEFAULT 0,
    `completed_by` VARCHAR(255) NOT NULL,
    `collaborators` JSON DEFAULT NULL,
    `status` ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Completed',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME DEFAULT NULL,
    INDEX (`status`),
    INDEX (`completed_by`),
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `business_orders` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `business_name` VARCHAR(255) NOT NULL,
    `contact_info` VARCHAR(255) DEFAULT NULL,
    `items` JSON NOT NULL,
    `status` ENUM('Pending', 'Accepted', 'Completed', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`status`),
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 5. FINANCES & ACCOUNTING
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `farm_transactions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category` ENUM('Income', 'Expense', 'Expenditure', 'Employee Cut') NOT NULL,
    `description` TEXT,
    `transaction_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`category`),
    INDEX (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `financial_settings` (
    `setting_key` VARCHAR(255) NOT NULL PRIMARY KEY,
    `setting_value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 6. MANAGEMENT & SECURITY
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `security_time_logs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user` VARCHAR(255) NOT NULL,
    `hours` DECIMAL(5, 2) NOT NULL,
    `description` TEXT,
    `date` DATE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`user`),
    INDEX (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `security_incidents` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `pd_called` BOOLEAN DEFAULT FALSE,
    `injured_details` TEXT,
    `reported_by` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `staff_incidents` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `personnel_name` VARCHAR(255) NOT NULL,
    `reason` TEXT NOT NULL,
    `issued_by` VARCHAR(255) NOT NULL,
    `incident_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`personnel_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `manager_plans` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(255) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    `feedback` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `promotion_suggestions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `personnel_name` VARCHAR(255) NOT NULL,
    `suggested_rank` VARCHAR(255) NOT NULL,
    `reason` TEXT NOT NULL,
    `suggested_by` VARCHAR(255) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    `feedback` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 7. COMMUNICATIONS & CONTENT
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `announcements` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `content` TEXT NOT NULL,
    `priority` ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    `user_id` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_announcement_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `farm_procedures` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `author_name` VARCHAR(255) NOT NULL,
    `author_rank` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gallery_images` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `src` TEXT NOT NULL,
    `alt` VARCHAR(255) DEFAULT NULL,
    `hint` VARCHAR(100) DEFAULT NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 8. SYSTEM & AUDIT
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user` VARCHAR(255) NOT NULL,
    `actionType` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (`user`),
    INDEX (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role` VARCHAR(50) NOT NULL,
    `permission` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`role`, `permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `app_settings` (
    `setting_key` VARCHAR(255) NOT NULL PRIMARY KEY,
    `setting_value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 9. INITIAL SEED DATA
-- ---------------------------------------------------------

-- Admin & Developer Seed
INSERT IGNORE INTO `users` (`id`, `username`, `password`, `roles`, `status`, `avatarUrl`) VALUES
('leon-green-uuid', 'Leon Green', 'Katarina97', '["Developer", "CEO"]', 'Active', 'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png'),
('admin-uuid', 'admin', 'adminpassword', '["Administrator"]', 'Active', NULL);

-- Default Settings
INSERT IGNORE INTO `app_settings` (`setting_key`, `setting_value`) VALUES
('applications_open', 'true'),
('maintenance_mode', 'false');

-- Default Bank Balance
INSERT IGNORE INTO `financial_settings` (`setting_key`, `setting_value`) VALUES
('base_bank_balance', '0');

SET FOREIGN_KEY_CHECKS = 1;
