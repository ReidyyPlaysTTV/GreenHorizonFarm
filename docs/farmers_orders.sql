
-- ==========================================================
-- GREEN HORIZON FARM - ORDERS & LOGISTICS SCHEMA
-- ==========================================================

-- 1. Internal Staff Order Logs (Farmers Portal)
-- Tracks active field operations and finalized sales.
CREATE TABLE IF NOT EXISTS detailed_farm_orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,    -- Name of business or "Local Farmer"
    items_sold JSON NOT NULL,               -- List of {product_id, name, quantity, price}
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- Percentage discount applied
    total_price DECIMAL(10, 2) DEFAULT 0,   -- Final price paid by customer
    logistics_used BOOLEAN DEFAULT FALSE,   -- Whether GH trucks were used
    employee_cut_value DECIMAL(10, 2) DEFAULT 0, -- Total commission for staff pool
    employee_cut_percentage INT DEFAULT 60, -- Commission percentage (standard 60%)
    completed_by VARCHAR(255) NOT NULL,     -- The Lead Farmer IC Name
    collaborators JSON,                     -- Array of other staff IC Names involved
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active', -- Stage of operation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. External Business Requisitions
-- Incoming requests from the public "Supply Requisition" form.
CREATE TABLE IF NOT EXISTS business_orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,    -- Prefixed with GH (e.g., GH12345678)
    business_name VARCHAR(255) NOT NULL,
    items JSON NOT NULL,                    -- List of requested items/quantities
    status ENUM('Pending', 'Accepted', 'Completed', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Partner Business Directory
-- Used for selection in order forms and automated billing.
CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    bank_account VARCHAR(50),               -- For invoice processing
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Global Product Catalog
-- Source of truth for item pricing and categories.
CREATE TABLE IF NOT EXISTS farm_products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,         -- Produce, Meat, Logistics, etc.
    price DECIMAL(10, 2) DEFAULT 0
);

-- Indexing for performance
CREATE INDEX idx_order_status ON detailed_farm_orders(status);
CREATE INDEX idx_biz_order_status ON business_orders(status);
CREATE INDEX idx_order_staff ON detailed_farm_orders(completed_by);
