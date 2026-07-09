-- Green Horizon Farm Management System
-- Full Production Schema & Seed Script
-- Target: MariaDB / MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `roles` json NOT NULL,
  `status` enum('Active','Banned') NOT NULL DEFAULT 'Active',
  `avatarUrl` varchar(255) DEFAULT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for personnel
-- ----------------------------
CREATE TABLE IF NOT EXISTS `personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `badgeNumber` varchar(10) DEFAULT NULL,
  `discord_username` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `hire_date` date DEFAULT current_date(),
  `department` varchar(255) DEFAULT 'General',
  `status` enum('Active','LOA','Inactive','Low Activity','Medical Leave','Suspended') NOT NULL DEFAULT 'Active',
  `loa_until` date DEFAULT NULL,
  `is_rehired` tinyint(1) NOT NULL DEFAULT 0,
  `userId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for detailed_farm_orders
-- ----------------------------
CREATE TABLE IF NOT EXISTS `detailed_farm_orders` (
  `id` varchar(36) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `items_sold` json NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total_price` decimal(10,2) DEFAULT 0.00,
  `logistics_used` tinyint(1) DEFAULT 0,
  `employee_cut_value` decimal(10,2) DEFAULT 0.00,
  `employee_cut_percentage` int(11) DEFAULT 0,
  `completed_by` varchar(255) NOT NULL,
  `collaborators` json DEFAULT NULL,
  `status` enum('Active','Completed','Cancelled') DEFAULT 'Completed',
  `created_at` datetime DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for business_orders
-- ----------------------------
CREATE TABLE IF NOT EXISTS `business_orders` (
  `id` varchar(36) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `items` json NOT NULL,
  `status` enum('Pending','Accepted','Completed','Cancelled','Expired') NOT NULL DEFAULT 'Pending',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for app_settings
-- ----------------------------
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for farm_products
-- ----------------------------
CREATE TABLE IF NOT EXISTS `farm_products` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role` varchar(50) NOT NULL,
  `permission` varchar(50) NOT NULL,
  PRIMARY KEY (`role`,`permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` varchar(36) NOT NULL,
  `user` varchar(255) NOT NULL,
  `actionType` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for announcements
-- ----------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `user_id` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for security_time_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS `security_time_logs` (
  `id` varchar(36) NOT NULL,
  `user` varchar(255) NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for security_incidents
-- ----------------------------
CREATE TABLE IF NOT EXISTS `security_incidents` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(255) NOT NULL,
  `pd_called` tinyint(1) DEFAULT 0,
  `injured_details` text DEFAULT NULL,
  `reported_by` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for farm_events
-- ----------------------------
CREATE TABLE IF NOT EXISTS `farm_events` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `revenue` decimal(15,2) DEFAULT 0.00,
  `event_date` datetime NOT NULL,
  `status` enum('Scheduled','Cancelled','Completed') DEFAULT 'Scheduled',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for farm_transactions
-- ----------------------------
CREATE TABLE IF NOT EXISTS `farm_transactions` (
  `id` varchar(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `category` enum('Income','Expense','Expenditure','Employee Cut') NOT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for financial_settings
-- ----------------------------
CREATE TABLE IF NOT EXISTS `financial_settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for manager_plans
-- ----------------------------
CREATE TABLE IF NOT EXISTS `manager_plans` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `feedback` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for promotion_suggestions
-- ----------------------------
CREATE TABLE IF NOT EXISTS `promotion_suggestions` (
  `id` varchar(36) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `suggested_rank` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `suggested_by` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `feedback` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for ceo_chat
-- ----------------------------
CREATE TABLE IF NOT EXISTS `ceo_chat` (
  `id` varchar(36) NOT NULL,
  `author` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for businesses
-- ----------------------------
CREATE TABLE IF NOT EXISTS `businesses` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for access_requests
-- ----------------------------
CREATE TABLE IF NOT EXISTS `access_requests` (
  `id` varchar(36) NOT NULL,
  `requested_username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Denied') DEFAULT 'Pending',
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for archived_personnel
-- ----------------------------
CREATE TABLE IF NOT EXISTS `archived_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `discord_username` varchar(255) DEFAULT NULL,
  `status` enum('Fired','Resigned') NOT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `reason` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for blacklisted_personnel
-- ----------------------------
CREATE TABLE IF NOT EXISTS `blacklisted_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `discord_username` varchar(255) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `dateAdded` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for callsign_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS `callsign_logs` (
  `id` varchar(36) NOT NULL,
  `callsign` varchar(10) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `action` enum('Assigned','Unassigned') NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for application_form_fields
-- ----------------------------
CREATE TABLE IF NOT EXISTS `application_form_fields` (
  `id` varchar(36) NOT NULL,
  `type` enum('text','textarea','select') NOT NULL,
  `label` varchar(255) NOT NULL,
  `field_order` int(11) NOT NULL,
  `required` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for application_field_options
-- ----------------------------
CREATE TABLE IF NOT EXISTS `application_field_options` (
  `id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `application_field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `application_form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for applications
-- ----------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` varchar(50) NOT NULL,
  `responses` json NOT NULL,
  `status` enum('Pending','Under Review','Approved','Rejected') DEFAULT 'Pending',
  `reviewer_comment` text DEFAULT NULL,
  `reviewer_id` varchar(36) DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `submittedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for farm_procedures
-- ----------------------------
CREATE TABLE IF NOT EXISTS `farm_procedures` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `author_name` varchar(255) NOT NULL,
  `author_rank` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for staff_incidents
-- ----------------------------
CREATE TABLE IF NOT EXISTS `staff_incidents` (
  `id` varchar(36) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `issued_by` varchar(255) NOT NULL,
  `incident_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for gallery_images
-- ----------------------------
CREATE TABLE IF NOT EXISTS `gallery_images` (
  `id` varchar(36) NOT NULL,
  `src` text NOT NULL,
  `alt` varchar(255) DEFAULT NULL,
  `hint` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for changelogs
-- ----------------------------
CREATE TABLE IF NOT EXISTS `changelogs` (
  `id` varchar(36) NOT NULL,
  `version` varchar(50) NOT NULL,
  `added_features` text DEFAULT NULL,
  `fixes` text DEFAULT NULL,
  `removed_features` text DEFAULT NULL,
  `other` text DEFAULT NULL,
  `author_id` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- INITIAL SEED DATA
-- ----------------------------

-- Seed System Accounts
INSERT INTO `users` (`id`, `username`, `password`, `roles`, `status`, `avatarUrl`) VALUES 
('leon-green-uuid-001', 'Leon Green', 'Katarina97', '["Developer", "CEO"]', 'Active', 'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png'),
('admin-uuid-001', 'admin', 'adminpassword', '["Administrator"]', 'Active', NULL);

-- Seed Leon Green on Roster
INSERT INTO `personnel` (`id`, `name`, `rank`, `department`, `status`, `hire_date`, `userId`) VALUES
(UUID(), 'Leon Green', 'CEO', 'Management', 'Active', CURRENT_DATE(), 'leon-green-uuid-001');

-- Seed Default Products
INSERT INTO `farm_products` (`id`, `name`, `category`, `price`) VALUES
(UUID(), 'Fresh Milk', 'Produce', 50.00),
(UUID(), 'Organic Eggs', 'Produce', 25.00),
(UUID(), 'Fresh Bread', 'Produce', 30.00),
(UUID(), 'Crate of Carrots', 'Produce', 150.00),
(UUID(), 'Prime Beef', 'Meat', 200.00),
(UUID(), 'Pork Belly', 'Meat', 175.00),
(UUID(), 'Premium Seeds', 'Supplies', 45.00),
(UUID(), 'Standard Logistics Fee', 'Logistics', 500.00);

-- Seed Permission Groups (Default)
INSERT INTO `role_permissions` (`role`, `permission`) VALUES
('Manager', 'ACCESS_DASHBOARD'),
('Manager', 'VIEW_EMPLOYEES'),
('Manager', 'VIEW_USERS'),
('Manager', 'VIEW_SOPS'),
('Manager', 'VIEW_ANNOUNCEMENTS'),
('Manager', 'ACCESS_FARMERS'),
('Manager', 'ACCESS_EVENTS'),
('Manager', 'ACCESS_MANAGER_PORTAL'),
('Manager', 'ACCESS_FINANCES'),
('Manager', 'VIEW_APPLICATIONS'),
('Manager', 'MANAGE_APPLICATIONS'),
('Manager', 'HIRE_EMPLOYEES'),
('Manager', 'MANAGE_ACCESS_REQUESTS'),
('Security', 'ACCESS_DASHBOARD'),
('Security', 'VIEW_EMPLOYEES'),
('Security', 'VIEW_SOPS'),
('Security', 'ACCESS_SECURITY'),
('Farm Hand', 'ACCESS_DASHBOARD'),
('Farm Hand', 'VIEW_EMPLOYEES'),
('Farm Hand', 'VIEW_SOPS'),
('Farm Hand', 'ACCESS_FARMERS');

SET FOREIGN_KEY_CHECKS = 1;
