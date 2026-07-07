'use server';

import type { Pool } from 'mysql2/promise';

/**
 * Seeds the initial users into the database if the users table is empty.
 * This ensures the Leon Green developer account and a technical admin exist on first run.
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
                roles JSON,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                avatarUrl VARCHAR(255),
                status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active'
            );
        `);
        
        // Check if there are any users already
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        
        if (Array.isArray(users) && (users[0] as any).count === 0) {
            console.log("No users found. Seeding default base users...");

            // Developer User: Leon Green
            const leonId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl) VALUES (?, ?, ?, ?, ?)',
                [
                    leonId, 
                    'Leon Green', 
                    'password123', 
                    JSON.stringify(['Developer']), 
                    'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png'
                ]
            );

            // Technical Admin
            const adminId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl) VALUES (?, ?, ?, ?, ?)',
                [
                    adminId, 
                    'admin', 
                    'adminpassword', 
                    JSON.stringify(['Administrator']), 
                    null
                ]
            );

            console.log("-----------------------------------------");
            console.log("BASE USERS CREATED SUCCESSFULLY");
            console.log("Developer: Leon Green / password123");
            console.log("Admin: admin / adminpassword");
            console.log("-----------------------------------------");
        }
    } catch (error) {
        console.error("Error during database seeding:", error);
    } finally {
        connection.release();
    }
}
