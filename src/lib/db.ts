
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { seedDatabase } from './db-seed';
import { seedRolePermissions } from './actions/permission-actions';
import { seedInitialRanks } from './actions/rank-actions';

const dbConfig = {
    host: 'mysql-mariadb-20-104.zap-srv.com',
    user: 'zap1311701-1',
    password: 'gFtXgwwIs09GtYtx',
    database: 'zap1311701-1',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000, // 20 seconds
    acquireTimeout: 20000,
    charset: 'utf8mb4',
    ssl: {
        rejectUnauthorized: false
    }
};

let pool: Pool;

try {
    pool = mysql.createPool(dbConfig);
} catch (err) {
    console.error("Failed to create MySQL pool:", err);
    throw err;
}

async function createFarmTables(connection: any) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                roles JSON NOT NULL,
                status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active',
                avatarUrl VARCHAR(255),
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS personnel (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                rank VARCHAR(255) NOT NULL,
                badgeNumber VARCHAR(10) NOT NULL UNIQUE,
                discord_username VARCHAR(255),
                phone_number VARCHAR(20),
                bank_account VARCHAR(50),
                hire_date DATE DEFAULT (CURRENT_DATE),
                department VARCHAR(255),
                status ENUM('Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended') NOT NULL DEFAULT 'Active',
                loa_until DATE,
                is_rehired BOOLEAN NOT NULL DEFAULT FALSE,
                userId VARCHAR(36)
            );
        `);

        await connection.query(`
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS security_time_logs (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                user VARCHAR(255) NOT NULL,
                hours DECIMAL(5, 2) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS security_incidents (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                location VARCHAR(255) NOT NULL,
                reported_by VARCHAR(255) NOT NULL,
                pd_called BOOLEAN DEFAULT FALSE,
                injured_details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS farm_events (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                revenue DECIMAL(10, 2) DEFAULT 0,
                event_date DATETIME NOT NULL,
                status ENUM('Scheduled', 'Cancelled', 'Completed') DEFAULT 'Scheduled',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS farm_transactions (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                amount DECIMAL(15, 2) NOT NULL,
                category ENUM('Income', 'Expense', 'Expenditure', 'Employee Cut') NOT NULL,
                description TEXT NOT NULL,
                transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS financial_settings (
                setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
                setting_value TEXT
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS farm_procedures (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(255),
                author_name VARCHAR(255) NOT NULL,
                author_rank VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff_incidents (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                personnel_name VARCHAR(255) NOT NULL,
                reason TEXT NOT NULL,
                issued_by VARCHAR(255) NOT NULL,
                incident_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS farm_products (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS manager_plans (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(255) NOT NULL,
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                feedback TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS promotion_suggestions (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                personnel_name VARCHAR(255) NOT NULL,
                suggested_rank VARCHAR(255) NOT NULL,
                reason TEXT NOT NULL,
                suggested_by VARCHAR(255) NOT NULL,
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                feedback TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ceo_chat (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                author VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                user VARCHAR(255) NOT NULL,
                actionType VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS application_form_fields (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                type ENUM('text', 'textarea', 'select') NOT NULL,
                label VARCHAR(255) NOT NULL,
                field_order INT NOT NULL,
                required BOOLEAN DEFAULT TRUE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS application_field_options (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                field_id VARCHAR(36) NOT NULL,
                value VARCHAR(255) NOT NULL,
                FOREIGN KEY (field_id) REFERENCES application_form_fields(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                responses JSON NOT NULL,
                status ENUM('Pending', 'Approved', 'Rejected', 'Under Review') NOT NULL DEFAULT 'Pending',
                submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                reviewer_comment TEXT,
                reviewer_id VARCHAR(36),
                reviewedAt DATETIME
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS access_requests (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                requested_username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                status ENUM('Pending', 'Approved', 'Denied') NOT NULL DEFAULT 'Pending',
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ranks (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                department VARCHAR(255) NOT NULL,
                sort_order INT NOT NULL,
                insignia_url VARCHAR(255),
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
                setting_value TEXT
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                content TEXT NOT NULL,
                is_urgent BOOLEAN DEFAULT FALSE,
                user_id VARCHAR(36) NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS gallery_images (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                src TEXT NOT NULL,
                alt VARCHAR(255),
                hint VARCHAR(255),
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS changelogs (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                version VARCHAR(20) NOT NULL,
                added_features TEXT,
                fixes TEXT,
                removed_features TEXT,
                other TEXT,
                author_id VARCHAR(36) NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        console.error("Failed to create farm tables:", error);
    }
}

let isInitialized = false;

export async function ensureDbInitialized() {
    if (isInitialized) return pool;
    try {
        const connection = await pool.getConnection();
        try {
            await createFarmTables(connection);
            await seedDatabase(pool);
            await seedRolePermissions(pool);
            await seedInitialRanks(pool);
            isInitialized = true;
            return pool;
        } finally {
            connection.release();
        }
    } catch (err: any) {
        console.error("DB Initialization Error:", err.message);
        throw err;
    }
}

export default pool;
