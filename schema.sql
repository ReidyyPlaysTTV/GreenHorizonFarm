-- Full Database Schema

--
-- Table structure for table `access_requests`
--
DROP TABLE IF EXISTS `access_requests`;
CREATE TABLE `access_requests` (
  `id` varchar(36) NOT NULL,
  `requested_username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Denied') NOT NULL DEFAULT 'Pending',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `requested_username` (`requested_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `application_form_fields`
--
DROP TABLE IF EXISTS `application_form_fields`;
CREATE TABLE `application_form_fields` (
  `id` varchar(36) NOT NULL,
  `type` enum('text','textarea','select') NOT NULL,
  `label` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `application_field_options`
--
DROP TABLE IF EXISTS `application_field_options`;
CREATE TABLE `application_field_options` (
  `id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `application_field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `application_form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `applications`
--
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` varchar(36) NOT NULL,
  `responses` json NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `archived_personnel`
--
DROP TABLE IF EXISTS `archived_personnel`;
CREATE TABLE `archived_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `discord_username` varchar(255) DEFAULT NULL,
  `status` enum('Fired','Resigned') NOT NULL,
  `date` datetime NOT NULL,
  `reason` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `audit_logs`
--
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `user` varchar(255) NOT NULL,
  `actionType` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `blacklisted_personnel`
--
DROP TABLE IF EXISTS `blacklisted_personnel`;
CREATE TABLE `blacklisted_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `discord_username` varchar(255) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `dateAdded` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `bug_reports`
--
DROP TABLE IF EXISTS `bug_reports`;
CREATE TABLE `bug_reports` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `callsign_logs`
--
DROP TABLE IF EXISTS `callsign_logs`;
CREATE TABLE `callsign_logs` (
  `id` varchar(36) NOT NULL,
  `callsign` varchar(10) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `action` enum('Assigned','Unassigned') NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `personnel`
--
DROP TABLE IF EXISTS `personnel`;
CREATE TABLE `personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `badgeNumber` varchar(10) NOT NULL,
  `discord_username` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `status` enum('Active','LOA','Inactive','Low Activity','Medical Leave','Suspended') NOT NULL DEFAULT 'Active',
  `loa_until` date DEFAULT NULL,
  `is_rehired` tinyint(1) NOT NULL DEFAULT 0,
  `userId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badgeNumber` (`badgeNumber`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `personnel_events`
--
DROP TABLE IF EXISTS `personnel_events`;
CREATE TABLE `personnel_events` (
  `id` varchar(36) NOT NULL,
  `personnel_name` varchar(255) NOT NULL,
  `event_type` enum('Hired','Fired','Promoted','Demoted','Rehired') NOT NULL,
  `description` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `suggestions`
--
DROP TABLE IF EXISTS `suggestions`;
CREATE TABLE `suggestions` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'User',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `avatarUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
