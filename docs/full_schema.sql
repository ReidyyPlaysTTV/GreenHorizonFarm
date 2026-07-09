-- Green Horizon Farm Management System
-- Full Database Schema & Initial Seeding Script

-- ---------------------------------------------------------
-- 1. Core Identity & Access Tables
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    roles JSON NOT NULL,
    status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active',
    avatarUrl VARCHAR(255),
    lastLogin DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_requests (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    requested_username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    PRIMARY KEY (role, permission)
);

-- ---------------------------------------------------------
-- 2. Personnel & Roster Management
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS personnel (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(255) NOT NULL,
    badgeNumber VARCHAR(10),
    discord_username VARCHAR(255),
    phone_number VARCHAR(20),
    bank_account VARCHAR(50),
    hire_date DATE DEFAULT (CURRENT_DATE),
    department VARCHAR(255) DEFAULT 'General',
    status ENUM('Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended') NOT NULL DEFAULT 'Active',
    loa_until DATE,
    is_rehired BOOLEAN NOT NULL DEFAULT FALSE,
    userId VARCHAR(36)
);

CREATE TABLE IF NOT EXISTS archived_personnel (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(255) NOT NULL,
    discord_username VARCHAR(255),
    status ENUM('Fired', 'Resigned') NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS blacklisted_personnel (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    discord_username VARCHAR(255),
    reason TEXT,
    dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personnel_events (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    personnel_name VARCHAR(255) NOT NULL,
    event_type ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL,
    description TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS callsign_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    callsign VARCHAR(10) NOT NULL,
    personnel_name VARCHAR(255) NOT NULL,
    action ENUM('Assigned', 'Unassigned') NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 3. Logistics & Order Engine
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    bank_account VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farm_products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS detailed_farm_orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    items_sold JSON NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) DEFAULT 0,
    logistics_used BOOLEAN DEFAULT FALSE,
    employee_cut_value DECIMAL(10, 2) DEFAULT 0,
    employee_cut_percentage INT DEFAULT 0,
    completed_by VARCHAR(255) NOT NULL,
    collaborators JSON,
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS business_orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    items JSON NOT NULL,
    status ENUM('Pending', 'Accepted', 'Completed', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 4. Financial & Accounting
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS farm_transactions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL,
    category ENUM('Income', 'Expense', 'Expenditure', 'Employee Cut') NOT NULL,
    description TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_settings (
    setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
    setting_value TEXT
);

-- ---------------------------------------------------------
-- 5. Security & Incident Logging
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS security_time_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user VARCHAR(255) NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_incidents (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    pd_called BOOLEAN DEFAULT FALSE,
    injured_details TEXT,
    reported_by VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 6. Management & Communication
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    content TEXT NOT NULL,
    priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    user_id VARCHAR(36) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS changelogs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    added_features TEXT,
    fixes TEXT,
    removed_features TEXT,
    other TEXT,
    author_id VARCHAR(36) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farm_procedures (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    author_name VARCHAR(255) NOT NULL,
    author_rank VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farm_events (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    revenue DECIMAL(15, 2) DEFAULT 0,
    event_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Cancelled', 'Completed') DEFAULT 'Scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_incidents (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    personnel_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    incident_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manager_plans (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_suggestions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    personnel_name VARCHAR(255) NOT NULL,
    suggested_rank VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    suggested_by VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ceo_chat (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 7. System Diagnostics & Technical
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user VARCHAR(255) NOT NULL,
    actionType VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
    setting_value TEXT
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
    submittedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
    submittedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery_images (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    src TEXT NOT NULL,
    alt VARCHAR(255),
    hint VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 8. Application Form Infrastructure
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS application_form_fields (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    type ENUM('text', 'textarea', 'select') NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_order INT NOT NULL,
    required BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS application_field_options (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    field_id VARCHAR(36) NOT NULL,
    value VARCHAR(255) NOT NULL,
    FOREIGN KEY (field_id) REFERENCES application_form_fields(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    responses JSON NOT NULL,
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Pending',
    reviewer_comment TEXT,
    reviewer_id VARCHAR(36),
    reviewedAt DATETIME,
    submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 9. SEEDING DATA
-- ---------------------------------------------------------

-- Default Users (Replace passwords after login!)
INSERT INTO users (id, username, password, roles, avatarUrl, status) VALUES 
('leon-green-uuid', 'Leon Green', 'Katarina97', '["Developer", "CEO"]', 'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png', 'Active'),
('admin-uuid', 'admin', 'adminpassword', '["Administrator"]', NULL, 'Active')
ON DUPLICATE KEY UPDATE username=username;

-- Default Personnel Record for CEO
INSERT INTO personnel (id, name, rank, status, hire_date, userId) VALUES
('ceo-personnel-uuid', 'Leon Green', 'CEO', 'Active', CURRENT_DATE, 'leon-green-uuid')
ON DUPLICATE KEY UPDATE name=name;

-- Default App Settings
INSERT INTO app_settings (setting_key, setting_value) VALUES 
('applications_open', 'true'),
('maintenance_mode', 'false'),
('sop_link', 'https://docs.google.com/presentation/d/1jjUe1Jx2odazolqiyGnuCiEVEE3NPrHQVMn3_cw9A2s/embed?start=false&loop=false&delayms=3000')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- Default Products
INSERT INTO farm_products (id, name, category, price) VALUES
(UUID(), 'Fresh Milk', 'Produce', 50.00),
(UUID(), 'Organic Eggs', 'Produce', 25.00),
(UUID(), 'Artisan Bread', 'Produce', 35.00),
(UUID(), 'Prime Beef', 'Meat', 120.00),
(UUID(), 'Standard Delivery', 'Logistics', 150.00)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Default Role Permissions
INSERT IGNORE INTO role_permissions (role, permission) VALUES 
('Manager', 'ACCESS_DASHBOARD'), ('Manager', 'VIEW_EMPLOYEES'), ('Manager', 'VIEW_USERS'), ('Manager', 'VIEW_SOPS'), ('Manager', 'VIEW_ANNOUNCEMENTS'), ('Manager', 'ACCESS_FARMERS'), ('Manager', 'ACCESS_EVENTS'), ('Manager', 'ACCESS_MANAGER_PORTAL'), ('Manager', 'ACCESS_FINANCES'), ('Manager', 'VIEW_APPLICATIONS'), ('Manager', 'MANAGE_APPLICATIONS'), ('Manager', 'HIRE_EMPLOYEES'), ('Manager', 'MANAGE_ACCESS_REQUESTS'),
('Security', 'ACCESS_DASHBOARD'), ('Security', 'VIEW_EMPLOYEES'), ('Security', 'VIEW_USERS'), ('Security', 'VIEW_SOPS'), ('Security', 'VIEW_ANNOUNCEMENTS'), ('Security', 'ACCESS_SECURITY'),
('Farm Hand', 'ACCESS_DASHBOARD'), ('Farm Hand', 'VIEW_EMPLOYEES'), ('Farm Hand', 'VIEW_USERS'), ('Farm Hand', 'VIEW_SOPS'), ('Farm Hand', 'VIEW_ANNOUNCEMENTS'), ('Farm Hand', 'ACCESS_FARMERS'),
('User', 'ACCESS_DASHBOARD'), ('User', 'VIEW_ANNOUNCEMENTS');
