
import mysql from 'mysql2/promise';
import { seedDatabase } from './db-seed';
import { seedRolePermissions } from './actions/permission-actions';
import type { Pool } from 'mysql2/promise';

const DATABASE_URL = "mysql://zap1311701-2:J2IAJKgRfnrCphFq@mysql-mariadb16-lon-101.zap-srv.com/zap1311701-2";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

const pool = mysql.createPool({
    uri: DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createCoreTables(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // Create users table first as other tables depend on it
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'User',
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                avatarUrl VARCHAR(255)
            );
        `);

        // Then create other tables
        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                content TEXT NOT NULL,
                is_urgent TINYINT(1) NOT NULL DEFAULT 0,
                user_id VARCHAR(36) NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        
    } catch (error) {
        console.error("Failed to create core tables:", error);
        throw error; // Throw error to be caught by the main promise chain
    } finally {
        connection.release();
    }
}


// Seed the database on application startup
Promise.all([
    createCoreTables(pool),
    seedDatabase(pool),
    seedRolePermissions(pool)
]).catch(err => {
    console.error("Failed to setup and seed database:", err);
});


export default pool;
