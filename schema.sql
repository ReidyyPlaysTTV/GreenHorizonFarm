
-- Create the users table for login
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL -- In a real app, this should be a hashed password
);

-- Create the personnel table
CREATE TABLE IF NOT EXISTS `personnel` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `rank` ENUM(
    'Commissioner', 'Deputy Comissioner', 'Warden', 'Deputy Warden', 'Major', 'Captain', 
    'Corrections Sergeant', 'Senior Corrections Officer', 'Correctional Officer', 'Probationary Correctional Officer'
  ) NOT NULL,
  `badgeNumber` VARCHAR(10) NOT NULL,
  `department` ENUM(
    'Commissioners Office', 'High Command', 'Command', 'NCOS', 'Corrections', 'Training'
  ) NOT NULL,
  `avatarUrl` VARCHAR(255)
);

-- Create the archived_personnel table
CREATE TABLE IF NOT EXISTS `archived_personnel` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `rank` VARCHAR(255) NOT NULL,
  `status` ENUM('Fired', 'Resigned') NOT NULL,
  `date` DATE NOT NULL,
  `reason` TEXT
);

-- Create the blacklisted_personnel table
CREATE TABLE IF NOT EXISTS `blacklisted_personnel` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `reason` TEXT,
  `dateAdded` DATE NOT NULL
);

-- Create the application form fields table
CREATE TABLE IF NOT EXISTS `application_form_fields` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `type` ENUM('text', 'textarea', 'select') NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `order` INT NOT NULL
);

-- Create the application field options table (for select/multiple choice)
CREATE TABLE IF NOT EXISTS `application_field_options` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `field_id` VARCHAR(36) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`field_id`) REFERENCES `application_form_fields`(`id`) ON DELETE CASCADE
);

-- Create the applications table
CREATE TABLE IF NOT EXISTS `applications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responses` JSON
);

-- ---
-- Seed Data
-- ---

-- Clear existing data
DELETE FROM `personnel`;
DELETE FROM `archived_personnel`;
DELETE FROM `blacklisted_personnel`;
DELETE FROM `applications`;
DELETE FROM `application_field_options`;
DELETE FROM `application_form_fields`;
DELETE FROM `users`;


-- Seed Users
INSERT INTO `users` (`username`, `password`) VALUES ('admin', 'password');

-- Seed Personnel
INSERT INTO `personnel` (`id`, `name`, `rank`, `badgeNumber`, `department`, `avatarUrl`) VALUES
('c7a8b9e0-5d6c-11ee-8c99-0242ac120002', 'John Smith', 'Warden', '1001', 'High Command', 'https://i.pravatar.cc/150?u=c7a8b9e0'),
('d3a4b5c6-5d6c-11ee-8c99-0242ac120002', 'Jane Doe', 'Captain', '1002', 'Command', 'https://i.pravatar.cc/150?u=d3a4b5c6'),
('e9f0a1b2-5d6c-11ee-8c99-0242ac120002', 'Mike Johnson', 'Senior Corrections Officer', '2001', 'Corrections', 'https://i.pravatar.cc/150?u=e9f0a1b2'),
('f5a6b7c8-5d6c-11ee-8c99-0242ac120002', 'Emily White', 'Correctional Officer', '2002', 'Corrections', 'https://i.pravatar.cc/150?u=f5a6b7c8');

-- Seed Archived Personnel
INSERT INTO `archived_personnel` (`id`, `name`, `rank`, `status`, `date`, `reason`) VALUES
('a1b2c3d4-5d6d-11ee-8c99-0242ac120002', 'Former Officer', 'Correctional Officer', 'Fired', '2023-09-01', 'Breach of conduct.');

-- Seed Blacklisted Personnel
INSERT INTO `blacklisted_personnel` (`id`, `name`, `reason`, `dateAdded`) VALUES
('b5c6d7e8-5d6d-11ee-8c99-0242ac120002', 'Trouble Maker', 'Repeated security violations.', '2023-08-15');

-- Seed Application Form Fields
INSERT INTO `application_form_fields` (`id`, `type`, `label`, `order`) VALUES
('field-1', 'text', 'Full Name', 1),
('field-2', 'text', 'Date of Birth', 2),
('field-3', 'textarea', 'Why do you want to join the DOC?', 3);

-- Seed Applications
INSERT INTO `applications` (`id`, `status`, `submittedAt`, `responses`) VALUES
('app-1', 'Pending', '2023-10-01 10:00:00', JSON_ARRAY(
    JSON_OBJECT('fieldId', 'field-1', 'label', 'Full Name', 'answer', 'Peter Jones', 'type', 'text'),
    JSON_OBJECT('fieldId', 'field-2', 'label', 'Date of Birth', 'answer', '1995-05-20', 'type', 'text'),
    JSON_OBJECT('fieldId', 'field-3', 'label', 'Why do you want to join the DOC?', 'answer', 'I am passionate about rehabilitation and maintaining a safe environment for both staff and inmates. I believe my communication skills and calm demeanor make me a good fit for this role.', 'type', 'textarea')
)),
('app-2', 'Approved', '2023-09-28 15:30:00', JSON_ARRAY(
    JSON_OBJECT('fieldId', 'field-1', 'label', 'Full Name', 'answer', 'Maria Garcia', 'type', 'text'),
    JSON_OBJECT('fieldId', 'field-2', 'label', 'Date of Birth', 'answer', '1992-11-12', 'type', 'text'),
    JSON_OBJECT('fieldId', 'field-3', 'label', 'Why do you want to join the DOC?', 'answer', 'My goal is to contribute to a structured system that helps individuals on their path to reintegration into society. I have prior experience in a similar field.', 'type', 'textarea')
));
