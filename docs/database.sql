
-- Full Application Schema for Green Horizon Farm Management System
-- Database: zap1311701-1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. Users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `roles` JSON NOT NULL,
    `status` ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active',
    `avatarUrl` VARCHAR(255),
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Personnel table
CREATE TABLE IF NOT EXISTS `personnel` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `rank` VARCHAR(255) NOT NULL,
    `badgeNumber` VARCHAR(10),
    `discord_username` VARCHAR(255),
    `phone_number` VARCHAR(20),
    `bank_account` VARCHAR(50),
    `hire_date` DATE DEFAULT (CURRENT_DATE),
    `department` VARCHAR(255) DEFAULT 'General',
    `status` ENUM('Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended') NOT NULL DEFAULT 'Active',
    `loa_until` DATE,
    `is_rehired` BOOLEAN NOT NULL DEFAULT FALSE,
    `userId` VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Personnel Events
CREATE TABLE IF NOT EXISTS `personnel_events` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `personnel_name` VARCHAR(255) NOT NULL,
    `event_type` ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL,
    `description` TEXT,
    `date` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Farm Orders
CREATE TABLE IF NOT EXISTS `detailed_farm_orders` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `business_name` VARCHAR(255) NOT NULL,
    `items_sold` JSON NOT NULL,
    `discount_amount` DECIMAL(10, 2) DEFAULT 0,
    `total_price` DECIMAL(10, 2) DEFAULT 0,
    `logistics_used` BOOLEAN DEFAULT FALSE,
    `employee_cut_value` DECIMAL(10, 2) DEFAULT 0,
    `employee_cut_percentage` INT DEFAULT 0,
    `completed_by` VARCHAR(255) NOT NULL,
    `collaborators` JSON,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Business Orders (B2B)
CREATE TABLE IF NOT EXISTS `business_orders` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `business_name` VARCHAR(255) NOT NULL,
    `contact_info` VARCHAR(255),
    `items` JSON NOT NULL,
    `status` ENUM('Pending', 'Accepted', 'Completed', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. App Settings
CREATE TABLE IF NOT EXISTS `app_settings` (
    `setting_key` VARCHAR(255) NOT NULL PRIMARY KEY,
    `setting_value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Farm Procedures (SOPs)
CREATE TABLE IF NOT EXISTS `farm_procedures` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(255),
    `author_name` VARCHAR(255) NOT NULL,
    `author_rank` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Farm Products
CREATE TABLE IF NOT EXISTS `farm_products` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10, 2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user` VARCHAR(255) NOT NULL,
    `actionType` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Announcements
CREATE TABLE IF NOT EXISTS `announcements` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `content` TEXT NOT NULL,
    `priority` ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    `user_id` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Security Time Logs
CREATE TABLE IF NOT EXISTS `security_time_logs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user` VARCHAR(255) NOT NULL,
    `hours` DECIMAL(5, 2) NOT NULL,
    `description` TEXT,
    `date` DATE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Security Incidents
CREATE TABLE IF NOT EXISTS `security_incidents` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `pd_called` BOOLEAN DEFAULT FALSE,
    `injured_details` TEXT,
    `reported_by` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Farm Events
CREATE TABLE IF NOT EXISTS `farm_events` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `revenue` DECIMAL(15, 2) DEFAULT 0,
    `event_date` DATETIME NOT NULL,
    `status` ENUM('Scheduled', 'Cancelled', 'Completed') DEFAULT 'Scheduled',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Farm Transactions
CREATE TABLE IF NOT EXISTS `farm_transactions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category` ENUM('Income', 'Expense', 'Expenditure', 'Employee Cut') NOT NULL,
    `description` TEXT,
    `transaction_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Financial Settings
CREATE TABLE IF NOT EXISTS `financial_settings` (
    `setting_key` VARCHAR(255) NOT NULL PRIMARY KEY,
    `setting_value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Staff Incidents
CREATE TABLE IF NOT EXISTS `staff_incidents` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `personnel_name` VARCHAR(255) NOT NULL,
    `reason` TEXT NOT NULL,
    `issued_by` VARCHAR(255) NOT NULL,
    `incident_date` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Manager Plans
CREATE TABLE IF NOT EXISTS `manager_plans` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(255) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    `feedback` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Promotion Suggestions
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

-- 19. CEO Chat
CREATE TABLE IF NOT EXISTS `ceo_chat` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `author` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. Gallery Images
CREATE TABLE IF NOT EXISTS `gallery_images` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `src TEXT` NOT NULL,
    `alt` VARCHAR(255),
    `hint` VARCHAR(100),
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. Changelogs
CREATE TABLE IF NOT EXISTS `changelogs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `version` VARCHAR(50) NOT NULL,
    `added_features` TEXT,
    `fixes` TEXT,
    `removed_features` TEXT,
    `other` TEXT,
    `author_id` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. Application Form Fields
CREATE TABLE IF NOT EXISTS `application_form_fields` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `type` ENUM('text', 'textarea', 'select') NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `field_order` INT NOT NULL,
    `required` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. Application Field Options
CREATE TABLE IF NOT EXISTS `application_field_options` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `field_id` VARCHAR(36) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    FOREIGN KEY (`field_id`) REFERENCES `application_form_fields`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. Applications
CREATE TABLE IF NOT EXISTS `applications` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `responses` JSON NOT NULL,
    `status` ENUM('Pending', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Pending',
    `reviewer_comment` TEXT,
    `reviewer_id` VARCHAR(36),
    `reviewedAt` DATETIME,
    `submittedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 25. Access Requests
CREATE TABLE IF NOT EXISTS `access_requests` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `requested_username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 26. Archived Personnel
CREATE TABLE IF NOT EXISTS `archived_personnel` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `rank` VARCHAR(255) NOT NULL,
    `discord_username` VARCHAR(255),
    `status` ENUM('Fired', 'Resigned') NOT NULL,
    `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `reason` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. Blacklisted Personnel
CREATE TABLE IF NOT EXISTS `blacklisted_personnel` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `discord_username` VARCHAR(255),
    `reason` TEXT,
    `dateAdded` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. Callsign Logs
CREATE TABLE IF NOT EXISTS `callsign_logs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `callsign` VARCHAR(10) NOT NULL,
    `personnel_name` VARCHAR(255) NOT NULL,
    `action` ENUM('Assigned', 'Unassigned') NOT NULL,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. Role Permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role` VARCHAR(50) NOT NULL,
    `permission` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`role`, `permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial Seed Data
INSERT INTO `users` (`id`, `username`, `password`, `roles`, `status`) VALUES
('developer-id', 'Leon Green', 'Katarina97', '["Developer", "CEO"]', 'Active'),
('admin-id', 'admin', 'adminpassword', '["Administrator"]', 'Active')
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`);

COMMIT;
