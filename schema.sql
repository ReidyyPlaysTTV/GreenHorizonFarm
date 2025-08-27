-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL
);

-- Departments ENUM is shared across tables
-- Departments: Commissioners Office, High Command, Command, NCOS, Corrections, Training

-- Ranks ENUM
SET @sql = NULL;
SELECT
  GROUP_CONCAT(DISTINCT
    CONCAT(
      '\'',
      `rank`,
      '\''
    )
  ) INTO @sql
FROM
  `personnel`;

SET @sql = CONCAT('ALTER TABLE `personnel` MODIFY `rank` ENUM(', 
                  '\'Commissioner\',',
                  '\'Deputy Comissioner\',',
                  '\'Warden\',',
                  '\'Deputy Warden\',',
                  '\'Major\',',
                  '\'Captain\',',
                  '\'Corrections Sergeant\',',
                  '\'Senior Corrections Officer\',',
                  '\'Correctional Officer\',',
                  '\'Probationary Correctional Officer\');');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- Personnel Table
CREATE TABLE IF NOT EXISTS `personnel` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `rank` ENUM('Commissioner', 'Deputy Comissioner', 'Warden', 'Deputy Warden', 'Major', 'Captain', 'Corrections Sergeant', 'Senior Corrections Officer', 'Correctional Officer', 'Probationary Correctional Officer') NOT NULL,
    `badgeNumber` VARCHAR(255) NOT NULL,
    `department` ENUM('Commissioners Office', 'High Command', 'Command', 'NCOS', 'Corrections', 'Training') NOT NULL,
    `avatarUrl` VARCHAR(255)
);

-- Archived Personnel Table
CREATE TABLE IF NOT EXISTS `archived_personnel` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `rank` VARCHAR(255) NOT NULL,
    `status` ENUM('Fired', 'Resigned') NOT NULL,
    `date` DATE NOT NULL,
    `reason` TEXT
);

-- Blacklisted Personnel Table
CREATE TABLE IF NOT EXISTS `blacklisted_personnel` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `reason` TEXT,
    `dateAdded` DATE NOT NULL
);

-- Applications Table
CREATE TABLE IF NOT EXISTS `applications` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `age` INT NOT NULL,
    `reasonForApplying` TEXT NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    `submittedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data before inserting new sample data to avoid duplicates
DELETE FROM `personnel`;
DELETE FROM `archived_personnel`;
DELETE FROM `blacklisted_personnel`;
DELETE FROM `applications`;
DELETE FROM `users`;


-- Sample Data Insertion

-- Sample Users
INSERT INTO `users` (`username`, `password`) VALUES
('admin', 'password123'), -- In a real app, use hashed passwords!
('jdoe', 'securepass');

-- Sample Personnel
INSERT INTO `personnel` (`id`, `name`, `rank`, `badgeNumber`, `department`, `avatarUrl`) VALUES
('P001', 'John Doe', 'Commissioner', '101', 'Commissioners Office', 'https://i.pravatar.cc/150?u=P001'),
('P002', 'Jane Smith', 'Deputy Comissioner', '102', 'Commissioners Office', 'https://i.pravatar.cc/150?u=P002'),
('P003', 'Peter Jones', 'Warden', '201', 'High Command', 'https://i.pravatar.cc/150?u=P003'),
('P004', 'Mary Williams', 'Deputy Warden', '202', 'High Command', 'https://i.pravatar.cc/150?u=P004'),
('P005', 'David Brown', 'Major', '301', 'Command', 'https://i.pravatar.cc/150?u=P005'),
('P006', 'Patricia Garcia', 'Captain', '302', 'Command', 'https://i.pravatar.cc/150?u=P006'),
('P007', 'Robert Miller', 'Corrections Sergeant', '401', 'NCOS', 'https://i.pravatar.cc/150?u=P007'),
('P008', 'Jennifer Davis', 'Senior Corrections Officer', '501', 'Corrections', 'https://i.pravatar.cc/150?u=P008'),
('P009', 'Michael Rodriguez', 'Correctional Officer', '502', 'Corrections', 'https://i.pravatar.cc/150?u=P009'),
('P010', 'Linda Martinez', 'Probationary Correctional Officer', '503', 'Corrections', 'https://i.pravatar.cc/150?u=P010'),
('P011', 'William Hernandez', 'Correctional Officer', '504', 'Corrections', 'https://i.pravatar.cc/150?u=P011'),
('P012', 'Elizabeth Lopez', 'Correctional Officer', '505', 'Corrections', 'https://i.pravatar.cc/150?u=P012'),
('P013', 'James Gonzalez', 'Correctional Officer', '601', 'Training', 'https://i.pravatar.cc/150?u=P013');

-- Sample Archived Personnel
INSERT INTO `archived_personnel` (`id`, `name`, `rank`, `status`, `date`, `reason`) VALUES
('AP001', 'Former Officer', 'Correctional Officer', 'Fired', '2023-10-26', 'Violation of conduct.'),
('AP002', 'Another Ex-Officer', 'Senior Corrections Officer', 'Resigned', '2023-09-15', 'Personal reasons.');

-- Sample Blacklisted Personnel
INSERT INTO `blacklisted_personnel` (`id`, `name`, `reason`, `dateAdded`) VALUES
('BP001', 'Trouble Maker', 'Repeated security breaches.', '2023-01-20');

-- Sample Applications
INSERT INTO `applications` (`id`, `name`, `age`, `reasonForApplying`, `status`, `submittedAt`) VALUES
('APP001', 'Aspiring Officer', 25, 'I want to help maintain order and contribute to the community.', 'Pending', '2024-05-10 09:00:00'),
('APP002', 'Eager Applicant', 31, 'My father was a correctional officer and I want to follow in his footsteps.', 'Approved', '2024-05-08 14:30:00'),
('APP003', 'Hopeful Candidate', 22, 'I believe I have the right temperament and skills for this demanding job.', 'Rejected', '2024-05-05 11:20:00');
