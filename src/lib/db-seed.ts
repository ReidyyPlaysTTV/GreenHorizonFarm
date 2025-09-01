
'use server';

import type { Pool } from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

// This function will only run if the users table is empty.
export async function seedDatabase(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // Create users table if it doesn't exist
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
        
        // Check if there are any users
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        
        if (Array.isArray(users) && (users[0] as any).count === 0) {
            console.log("No users found. Seeding default admin user...");

            const username = 'admin';
            const password = 'password'; // Use a simple, known password for the seed
            const role = 'Administrator';
            
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            const id = crypto.randomUUID();

            await connection.query(
                'INSERT INTO users (id, username, password_hash, role, avatarUrl) VALUES (?, ?, ?, ?, ?)',
                [id, username, password_hash, role, null]
            );

            console.log("Default admin user created successfully.");
            console.log("Username: admin");
            console.log("Password: password");
        }
    } catch (error) {
        console.error("Error during database seeding:", error);
    } finally {
        connection.release();
    }
}
