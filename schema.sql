-- Create the departments type if it doesn't exist
-- In MySQL, ENUMs are defined directly in the column definition.

-- Table structure for table `personnel`
CREATE TABLE IF NOT EXISTS `personnel` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` ENUM('Commissioner', 'Deputy Comissioner', 'Warden', 'Deputy Warden', 'Major', 'Captain', 'Corrections Sergeant', 'Senior Corrections Officer', 'Correctional Officer', 'Probationary Correctional Officer') NOT NULL,
  `badgeNumber` varchar(255) NOT NULL,
  `department` ENUM('Commissioners Office', 'High Command', 'Command', 'NCOS', 'Corrections', 'Training') NOT NULL,
  `avatarUrl` varchar(255) DEFAULT 'https://picsum.photos/100/100',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `personnel`
INSERT INTO `personnel` (`id`, `name`, `rank`, `badgeNumber`, `department`, `avatarUrl`) VALUES
('1', 'John Doe', 'Warden', '1001', 'Command', 'https://picsum.photos/100/100'),
('2', 'Jane Smith', 'Captain', '1002', 'Corrections', 'https://picsum.photos/100/100'),
('3', 'Peter Jones', 'Corrections Sergeant', '2001', 'Corrections', 'https://picsum.photos/100/100'),
('4', 'Mary Williams', 'Senior Corrections Officer', '3001', 'NCOS', 'https://picsum.photos/100/100'),
('5', 'David Brown', 'Correctional Officer', '4001', 'Corrections', 'https://picsum.photos/100/100'),
('6', 'Sarah Miller', 'Probationary Correctional Officer', '5001', 'Training', 'https://picsum.photos/100/100'),
('7', 'Michael Davis', 'Commissioner', '1000', 'Commissioners Office', 'https://picsum.photos/100/100'),
('8', 'Emily White', 'Major', '1005', 'High Command', 'https://picsum.photos/100/100');


-- Table structure for table `archived_personnel`
CREATE TABLE IF NOT EXISTS `archived_personnel` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `status` ENUM('Fired', 'Resigned') NOT NULL,
  `date` date NOT NULL,
  `reason` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `archived_personnel`
INSERT INTO `archived_personnel` (`id`, `name`, `rank`, `status`, `date`, `reason`) VALUES
('1', 'James Johnson', 'Correctional Officer', 'Fired', '2023-10-26', 'Violation of conduct.'),
('2', 'Linda Garcia', 'Corrections Sergeant', 'Resigned', '2023-09-15', 'Personal reasons.');

-- Table structure for table `blacklisted_personnel`
CREATE TABLE IF NOT EXISTS `blacklisted_personnel` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `dateAdded` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `blacklisted_personnel`
INSERT INTO `blacklisted_personnel` (`id`, `name`, `reason`, `dateAdded`) VALUES
('1', 'Robert Smith', 'Repeated security breaches.', '2023-01-20');


-- Table structure for table `applications`
CREATE TABLE IF NOT EXISTS `applications` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `reasonForApplying` text NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `applications`
INSERT INTO `applications` (`id`, `name`, `age`, `reasonForApplying`, `status`, `submittedAt`) VALUES
('1', 'Chris Lee', 28, 'I want to contribute to the safety of the community.', 'Pending', '2024-05-20 10:00:00'),
('2', 'Patricia Green', 35, 'I have prior experience in law enforcement and believe I would be a good fit.', 'Approved', '2024-05-18 14:30:00'),
('3', 'Daniel Harris', 22, 'Looking for a challenging and rewarding career.', 'Rejected', '2024-05-19 09:00:00'),
('4', 'Jessica Clark', 31, 'My father was a correctional officer, and I want to follow in his footsteps.', 'Pending', '2024-05-21 11:20:00');

-- Table structure for table `users`
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `users`
INSERT INTO `users` (`username`, `password`) VALUES
('admin', 'password'); -- It is highly recommended to use hashed passwords in a real application
