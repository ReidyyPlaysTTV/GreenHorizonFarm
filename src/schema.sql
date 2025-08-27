-- Adminer 4.8.1 MySQL 5.5.5-10.11.8-MariaDB-1:10.11.8+maria~ubu2204 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS `application_field_options`;
DROP TABLE IF EXISTS `application_form_fields`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `archived_personnel`;
DROP TABLE IF EXISTS `blacklisted_personnel`;
DROP TABLE IF EXISTS `personnel`;
DROP TABLE IF EXISTS `users`;

-- Create new tables
CREATE TABLE `application_field_options` (
  `id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `application_field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `application_form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `application_form_fields` (
  `id` varchar(36) NOT NULL,
  `type` enum('text','textarea','select') NOT NULL,
  `label` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `applications` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (json_valid(`responses`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `archived_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `status` enum('Fired','Resigned') NOT NULL,
  `date` date NOT NULL,
  `reason` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `blacklisted_personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `dateAdded` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `personnel` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` enum('Commissioner','Deputy Comissioner','Warden','Deputy Warden','Major','Captain','Corrections Sergeant','Senior Corrections Officer','Correctional Officer','Probationary Correctional Officer') NOT NULL,
  `badgeNumber` varchar(255) NOT NULL,
  `department` enum('Commissioners Office','High Command','Command','NCOS','Corrections','Training') NOT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `personnel` (`id`, `name`, `rank`, `badgeNumber`, `department`, `avatarUrl`) VALUES
('1',	'John Doe',	'Captain',	'1001',	'Command',	'https://picsum.photos/100'),
('2',	'Jane Smith',	'Senior Corrections Officer',	'1002',	'Corrections',	'https://picsum.photos/100'),
('3',	'Jim Brown',	'Commissioner',	'1',	'Commissioners Office',	'https://picsum.photos/100');

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `username`, `password`) VALUES
(1,	'admin',	'password');

-- 2024-05-22 13:00:00
