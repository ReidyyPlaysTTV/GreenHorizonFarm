-- Personnel Table: Stores all active personnel records.
CREATE TABLE personnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    badgeNumber VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    avatarUrl VARCHAR(255)
);

-- Archived Personnel Table: Stores records of fired or resigned personnel.
CREATE TABLE archived_personnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    status ENUM('Fired', 'Resigned') NOT NULL,
    date DATE NOT NULL,
    reason TEXT
);

-- Blacklisted Personnel Table: Stores individuals who are barred.
CREATE TABLE blacklisted_personnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reason TEXT,
    dateAdded DATE NOT NULL
);

-- Applications Table: Stores all submitted applications.
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    reasonForApplying TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table: Stores login credentials.
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
