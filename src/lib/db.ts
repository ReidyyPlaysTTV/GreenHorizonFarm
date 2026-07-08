
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { seedDatabase } from './db-seed';
import { seedRolePermissions } from './actions/permission-actions';
import { seedInitialRanks } from './actions/rank-actions';

// Connection URI for ZAP-Hosting MariaDB
const dbUri = 'mysql://zap1311701-1:gFtXgwwIs09GtYtx@mysql-mariadb-20-104.zap-srv.com:3306/zap1311701-1';

let pool: Pool;
let isInitialized = false;
let dbOfflineUntil = 0;
const OFFLINE_COOLDOWN = 30000; // 30 seconds circuit breaker

try {
    pool = mysql.createPool({
        uri: dbUri,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        // Aggressive timeout to keep the app fast
        connectTimeout: 5000,
        acquireTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });
} catch (err) {
    console.error("Critical: Failed to create MySQL pool instance:", err);
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
                badgeNumber VARCHAR(10),
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
            CREATE TABLE IF NOT EXISTS app_settings (
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
            CREATE TABLE IF NOT EXISTS farm_products (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0
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
            CREATE TABLE IF NOT EXISTS announcements (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                content TEXT NOT NULL,
                priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
                user_id VARCHAR(36) NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

    } catch (error) {
        console.error("Failed to create farm tables:", error);
    }
}

export async function ensureDbInitialized(force: boolean = false) {
    if (isInitialized && !force) return pool;
    
    // Circuit Breaker: Don't try if we recently failed
    if (!force && Date.now() < dbOfflineUntil) {
        throw new Error("DATABASE_OFFLINE_COOLDOWN");
    }

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
        dbOfflineUntil = Date.now() + OFFLINE_COOLDOWN;
        console.warn("DB Connection Failed (Circuit Breaker Engaged):", err.message);
        throw err;
    }
}

export default pool;
