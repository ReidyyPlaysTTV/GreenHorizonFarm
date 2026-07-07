
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

const dbConfig = {
    host: 'mysql-mariadb-20-104.zap-srv.com',
    user: 'zap1311701-1',
    password: 'gFtXgwwIs09GtYtx',
    database: 'zap1311701-1',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
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
        // Users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                roles JSON,
                status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Personnel (Extended Roster)
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

        // Detailed Farm Orders
        await connection.query(`
            CREATE TABLE IF NOT EXISTS detailed_farm_orders (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                business_name VARCHAR(255) NOT NULL,
                sugarcane INT DEFAULT 0,
                wheat INT DEFAULT 0,
                fruits INT DEFAULT 0,
                vegs INT DEFAULT 0,
                normal_meat INT DEFAULT 0,
                premium_meat INT DEFAULT 0,
                total_price DECIMAL(10, 2) DEFAULT 0,
                logistics_used BOOLEAN DEFAULT FALSE,
                employee_cut_value DECIMAL(10, 2) DEFAULT 0,
                employee_cut_percentage INT DEFAULT 0,
                completed_by VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Security Time Logs
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

        // Security Incidents
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

        // Events
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

        // Financial Transactions
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

        // Financial Settings
        await connection.query(`
            CREATE TABLE IF NOT EXISTS financial_settings (
                setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
                setting_value TEXT
            );
        `);

        // Farm Procedures (Guidelines)
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

        // Staff Incidents (Disciplinaries)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff_incidents (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                personnel_name VARCHAR(255) NOT NULL,
                reason TEXT NOT NULL,
                issued_by VARCHAR(255) NOT NULL,
                incident_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Farm Products
        await connection.query(`
            CREATE TABLE IF NOT EXISTS farm_products (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0
            );
        `);

        // Manager Plans
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

        // Promotion Suggestions
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

        // CEO Chat
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ceo_chat (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                author VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
            isInitialized = true;
            return pool;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("DB Init failed:", err);
        return pool;
    }
}

ensureDbInitialized().catch(console.error);
export default pool;
