
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

        // Employees
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                position VARCHAR(255) NOT NULL,
                employee_id VARCHAR(10) NOT NULL UNIQUE,
                division VARCHAR(255) NOT NULL,
                status ENUM('Active', 'On Leave', 'Inactive', 'Probation') DEFAULT 'Active',
                joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Announcements
        await connection.query(`
            CREATE TABLE IF NOT EXISTS farm_announcements (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                content TEXT NOT NULL,
                is_urgent TINYINT(1) DEFAULT 0,
                user_id VARCHAR(36) NOT NULL,
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
