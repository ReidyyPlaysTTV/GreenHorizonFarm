
import mysql from 'mysql2/promise';
import { seedDatabase } from './db-seed';
import { seedInitialRanks } from './actions/rank-actions';
import { seedRolePermissions } from './actions/permission-actions';
import type { Pool } from 'mysql2/promise';

/**
 * DATABASE CONNECTION CONFIGURATION
 * 
 * The error "Access denied for user 'zap1311701-2'@'34.38.53.4'" means 
 * your database provider (Zap-Hosting) is blocking the connection.
 * 
 * TO FIX THIS:
 * 1. Log in to your Zap-Hosting dashboard.
 * 2. Go to your MariaDB/MySQL database settings.
 * 3. Look for "Remote Access", "External Access", or "Whitelisted IPs".
 * 4. Add the IP address: 34.38.53.4 to the allowed list.
 * 5. Ensure the password provided below is 100% correct.
 */

const dbConfig = {
    host: 'mysql-mariadb16-lon-101.zap-srv.com',
    user: 'zap1311701-2',
    password: 'J2IAJKgRfnrCphFq',
    database: 'zap1311701-2',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    charset: 'utf8mb4'
};

let pool: Pool;

try {
    pool = mysql.createPool(dbConfig);
} catch (err) {
    console.error("Failed to create MySQL pool:", err);
    throw err;
}

async function createCoreTables(connection: any) {
    try {
        // Create users table first
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                roles JSON,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                avatarUrl VARCHAR(255),
                status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active'
            );
        `);
        
        // Announcements table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                content TEXT NOT NULL,
                is_urgent TINYINT(1) NOT NULL DEFAULT 0,
                user_id VARCHAR(36) NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id)
            );
        `);

        // Gallery table
         await connection.query(`
            CREATE TABLE IF NOT EXISTS gallery_images (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                src VARCHAR(255) NOT NULL,
                alt VARCHAR(255) NOT NULL,
                hint VARCHAR(100),
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Changelogs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS changelogs (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                version VARCHAR(50) NOT NULL,
                added_features TEXT,
                fixes TEXT,
                removed_features TEXT,
                other TEXT,
                author_id VARCHAR(36) NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX (author_id)
            );
        `);
        
    } catch (error) {
        console.error("Failed to create core tables:", error);
        throw error;
    }
}

// Initialization flag to prevent multiple seeding attempts in Dev
let isInitialized = false;

export async function ensureDbInitialized() {
    if (isInitialized) return pool;
    
    try {
        const connection = await pool.getConnection();
        try {
            await createCoreTables(connection);
            await seedDatabase(pool);
            await seedRolePermissions(pool);
            await seedInitialRanks(pool);
            isInitialized = true;
            console.log("Database successfully verified and initialized.");
            return pool;
        } finally {
            connection.release();
        }
    } catch (err: any) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("CRITICAL: Database access denied. Please whitelist IP 34.38.53.4 in Zap-Hosting.");
        } else {
            console.error("CRITICAL: Database initialization failed:", err.message);
        }
        // Return the pool anyway so the app doesn't crash on boot, 
        // subsequent actions will handle their own errors.
        return pool;
    }
}

// Immediate attempt to initialize
ensureDbInitialized().catch(console.error);

export default pool;
