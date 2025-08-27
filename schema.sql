-- Database schema for the DOC Roster application

--
-- Table structure for table `personnel`
--

CREATE TABLE `personnel` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `badgeNumber` varchar(255) NOT NULL,
  `department` enum('Commissioners Office','High Command','Command','NCOS','Corrections','Training') NOT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `archived_personnel`
--

CREATE TABLE `archived_personnel` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `status` enum('Fired','Resigned') NOT NULL,
  `date` date NOT NULL,
  `reason` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `blacklisted_personnel`
--

CREATE TABLE `blacklisted_personnel` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `dateAdded` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `reasonForApplying` text NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `submittedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
