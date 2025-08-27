-- Database schema for the DOC Roster Application

-- Main table for active personnel
CREATE TABLE `personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `badgeNumber` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badgeNumber_UNIQUE` (`badgeNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for users who can log into the application
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'User',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table to store fired or resigned personnel records
CREATE TABLE `archived_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `status` enum('Fired','Resigned') NOT NULL,
  `date` datetime NOT NULL,
  `reason` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf82_general_ci;

-- Table for individuals blacklisted from the department
CREATE TABLE `blacklisted_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `dateAdded` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Stores the fields that make up the dynamic application form
CREATE TABLE `application_form_fields` (
  `id` varchar(36) NOT NULL,
  `type` enum('text','textarea','select') NOT NULL,
  `label` varchar(255) NOT NULL,
  `order` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Stores the options for 'select' type fields in the application form
CREATE TABLE `application_field_options` (
  `id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `field_id_fk_idx` (`field_id`),
  CONSTRAINT `field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `application_form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Stores submitted applications
CREATE TABLE `applications` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responses` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Logs major personnel events like hires, fires, promotions, and demotions
CREATE TABLE `personnel_events` (
  `id` varchar(36) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `event_type` enum('Hired','Fired','Promoted','Demoted') NOT NULL,
  `description` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for user-submitted bug reports
CREATE TABLE `bug_reports` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for user-submitted feature suggestions
CREATE TABLE `suggestions` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for global application settings, like maintenance mode
CREATE TABLE `app_settings` (
  `key` varchar(50) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
