-- DOC Roster Application SQL Schema
-- Version 1.1

-- This file contains the complete database schema for the DOC Roster application.

-- Table for active personnel
CREATE TABLE `personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `badgeNumber` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for blacklisted individuals
CREATE TABLE `blacklisted_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `dateAdded` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for dynamic application form fields
CREATE TABLE `application_form_fields` (
  `id` varchar(36) NOT NULL,
  `type` enum('text','textarea','select') NOT NULL,
  `label` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for options of 'select' type fields
CREATE TABLE `application_field_options` (
  `id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `application_field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `application_form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table to store submitted applications
CREATE TABLE `applications` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `responses` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for application users
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'User',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for bug reports
CREATE TABLE `bug_reports` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for feature suggestions
CREATE TABLE `suggestions` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for recent personnel events
CREATE TABLE `personnel_events` (
  `id` varchar(36) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `event_type` enum('Hired','Fired','Promoted','Demoted') NOT NULL,
  `description` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for global application settings
CREATE TABLE `app_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Default setting for maintenance mode
INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES ('maintenance_mode', 'false');
