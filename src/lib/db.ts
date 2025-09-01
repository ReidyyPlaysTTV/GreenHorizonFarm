

import mysql from 'mysql2/promise';
import { seedDatabase } from './db-seed';
import { seedRolePermissions } from './actions/permission-actions';
import type { Pool } from 'mysql2/promise';

const DATABASE_URL = "mysql://zap1311701-2:J2IAJKgRfnrCphFq@mysql-mariadb16-lon-101.zap-srv.com/zap1311701-2";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

const pool: Pool = mysql.createPool({
    uri: DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
});

async function createCoreTables(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // Create users table first as other tables may depend on it
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
        
        // This is a migration from a single 'role' to a JSON array 'roles'
        const [roleColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'role'");
         if (Array.isArray(roleColumns) && roleColumns.length > 0) {
            const [oldRoleUsers] = await connection.query('SELECT id, role FROM users WHERE role IS NOT NULL');
            if(Array.isArray(oldRoleUsers) && oldRoleUsers.length > 0) {
                await connection.query("ALTER TABLE users ADD COLUMN roles JSON;");
                for (const user of (oldRoleUsers as any[])) {
                    await connection.query('UPDATE users SET roles = ? WHERE id = ?', [JSON.stringify([user.role]), user.id]);
                }
                await connection.query("ALTER TABLE users DROP COLUMN role;");
                console.log("Successfully migrated 'role' column to 'roles' JSON array.")
            }
        }


        // Then create other tables
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

         await connection.query(`
            CREATE TABLE IF NOT EXISTS gallery_images (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                src VARCHAR(255) NOT NULL,
                alt VARCHAR(255) NOT NULL,
                hint VARCHAR(100),
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

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

// Helper function to retry database operations
export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 50): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.warn(`Database connection issue (${error.code}). Retry attempt ${i + 1}/${retries}...`);
        await new Promise(res => setTimeout(res, delay * (i + 1))); // Incremental backoff
      } else {
        // Don't retry on other errors
        throw error;
      }
    }
  }
  console.error("Database operation failed after all retries.", lastError);
  throw lastError;
}

export default pool;
