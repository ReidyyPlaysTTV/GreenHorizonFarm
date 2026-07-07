
'use server';

import type { Pool } from 'mysql2/promise';

/**
 * Seeds the initial users into the database.
 * This ensures the Leon Green developer account and a technical admin exist.
 */
export async function seedDatabase(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // Create users table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                roles JSON NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                avatarUrl VARCHAR(255),
                status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active'
            );
        `);
        
        // Check for Leon Green
        const [leonRows] = await connection.query('SELECT id FROM users WHERE username = ?', ['Leon Green']);
        if (Array.isArray(leonRows) && leonRows.length === 0) {
            console.log("Seeding Developer: Leon Green");
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl) VALUES (?, ?, ?, ?, ?)',
                [
                    crypto.randomUUID(), 
                    'Leon Green', 
                    'Katarina1997', 
                    JSON.stringify(['Developer']), 
                    'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png'
                ]
            );
        }

        // Check for technical admin
        const [adminRows] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
        if (Array.isArray(adminRows) && adminRows.length === 0) {
            console.log("Seeding Administrator: admin");
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl) VALUES (?, ?, ?, ?, ?)',
                [
                    crypto.randomUUID(), 
                    'admin', 
                    'adminpassword', 
                    JSON.stringify(['Administrator']), 
                    null
                ]
            );
        }

        console.log("-----------------------------------------");
        console.log("BASE USERS SYNCED");
        console.log("Developer: Leon Green / Katarina1997");
        console.log("Admin: admin / adminpassword");
        console.log("-----------------------------------------");
        
    } catch (error) {
        console.error("Error during database seeding:", error);
    } finally {
        connection.release();
    }
}
