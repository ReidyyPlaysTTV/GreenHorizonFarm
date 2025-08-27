-- This SQL schema is generated based on the application's source code.
-- It defines the structure for all the database tables used by the roster system.

-- Table for storing registered user accounts.
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'User',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `avatarUrl` VARCHAR(255)
);

-- Table for storing user access requests.
CREATE TABLE IF NOT EXISTS `access_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `requested_username` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Denied') NOT NULL DEFAULT 'Pending',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing active personnel records.
CREATE TABLE IF NOT EXISTS `personnel` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `rank` VARCHAR(255) NOT NULL,
  `badgeNumber` VARCHAR(10) NOT NULL UNIQUE,
  `discord_username` VARCHAR(255),
  `department` VARCHAR(255),
  `avatarUrl` VARCHAR(255),
  `status` ENUM('Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended') NOT NULL DEFAULT 'Active',
  `loa_until` DATE,
  `is_rehired` BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table for storing records of personnel who have been fired or have resigned.
CREATE TABLE IF NOT EXISTS `archived_personnel` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `rank` VARCHAR(255) NOT NULL,
  `discord_username` VARCHAR(255),
  `status` ENUM('Fired', 'Resigned') NOT NULL,
  `date` DATETIME NOT NULL,
  `reason` TEXT
);

-- Table for storing individuals who are blacklisted from the department.
CREATE TABLE IF NOT EXISTS `blacklisted_personnel` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `discord_username` VARCHAR(255),
  `reason` TEXT,
  `dateAdded` DATETIME NOT NULL
);

-- Table for storing submitted applications.
CREATE TABLE IF NOT EXISTS `applications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `responses` JSON NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for logging significant personnel events like hiring, firing, promotions, etc.
CREATE TABLE IF NOT EXISTS `personnel_events` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `personnel_name` VARCHAR(255) NOT NULL,
  `event_type` ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `date` DATETIME NOT NULL
);

-- Table for storing user-submitted bug reports.
CREATE TABLE IF NOT EXISTS `bug_reports` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` DATETIME NOT NULL
);

-- Table for storing user-submitted feature suggestions.
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` DATETIME NOT NULL
);

-- Table for a chronological record of all actions performed in the system.
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user` VARCHAR(255) NOT NULL,
  `actionType` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for logging changes in callsign assignments.
CREATE TABLE IF NOT EXISTS `callsign_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `callsign` VARCHAR(10) NOT NULL,
  `personnel_name` VARCHAR(255) NOT NULL,
  `action` ENUM('Assigned', 'Unassigned') NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for defining the dynamic fields on the application form.
CREATE TABLE IF NOT EXISTS `application_form_fields` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `type` ENUM('text', 'textarea', 'select') NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `order` INT NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT TRUE
);

-- Table for storing the options for 'select' type fields in the application form.
CREATE TABLE IF NOT EXISTS `application_field_options` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `field_id` VARCHAR(36) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`field_id`) REFERENCES `application_form_fields`(`id`) ON DELETE CASCADE
);
