
-- Green Horizon Farm Management System
-- Production Schema v2.5
-- Focus: Logistics, Orders, and Individual Payouts

-- 1. Product Catalog (Dual Pricing)
CREATE TABLE IF NOT EXISTS farm_products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,       -- Business/Standard Price
    local_price DECIMAL(10, 2) DEFAULT 0   -- Public/Local Farmer Price
);

-- 2. Partner Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    bank_account VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Detailed Farm Operations (Field Logs)
CREATE TABLE IF NOT EXISTS detailed_farm_orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    items_sold JSON NOT NULL,              -- Array of OrderItem
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) DEFAULT 0,
    logistics_used BOOLEAN DEFAULT FALSE,
    employee_cut_value DECIMAL(10, 2) DEFAULT 0,
    employee_cut_percentage INT DEFAULT 0,
    completed_by VARCHAR(255) NOT NULL,    -- Lead Farmer Name
    collaborators JSON,                    -- Array of Support Staff Names
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    INDEX (status),
    INDEX (completed_by)
);

-- 4. Individual Staff Payouts (Debt Ledger)
CREATE TABLE IF NOT EXISTS order_payouts (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    personnel_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
    paid_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES detailed_farm_orders(id) ON DELETE CASCADE,
    INDEX (personnel_name),
    INDEX (status)
);

-- 5. Incoming Business Requests (From Public Requisition Form)
CREATE TABLE IF NOT EXISTS business_orders (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    items JSON NOT NULL,                    -- Array of requested products
    status ENUM('Pending', 'Accepted', 'Completed', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (status)
);

-- 6. Global Financial Ledger
CREATE TABLE IF NOT EXISTS farm_transactions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL,
    category ENUM('Income', 'Expense', 'Expenditure', 'Employee Cut') NOT NULL,
    description TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Seed Data: Initial Products
INSERT IGNORE INTO farm_products (id, name, category, price, local_price) VALUES
(UUID(), 'Organic Carrots', 'Produce', 50.00, 42.50),
(UUID(), 'Fresh Milk', 'Produce', 80.00, 68.00),
(UUID(), 'Premium Beef', 'Meat', 200.00, 170.00),
(UUID(), 'Bread Loaf', 'Produce', 30.00, 25.50);
