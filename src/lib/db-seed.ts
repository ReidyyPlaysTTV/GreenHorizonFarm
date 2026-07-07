
'use server';

import type { Pool } from 'mysql2/promise';

/**
 * Seeds the initial users into the database.
 * Ensures Leon Green (Developer) and Admin accounts exist.
 */
export async function seedDatabase(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // Check for Leon Green
        const [leonRows] = await connection.query('SELECT id FROM users WHERE username = ?', ['Leon Green']);
        if (Array.isArray(leonRows) && leonRows.length === 0) {
            console.log("Seeding Developer: Leon Green");
            // Important: Roles must be stringified JSON array to satisfy constraints
            const devRoles = JSON.stringify(['Developer']);
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    crypto.randomUUID(), 
                    'Leon Green', 
                    'Katarina1997', 
                    devRoles, 
                    'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png',
                    'Active'
                ]
            );
        }

        // Check for technical admin
        const [adminRows] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
        if (Array.isArray(adminRows) && adminRows.length === 0) {
            console.log("Seeding Administrator: admin");
            const adminRoles = JSON.stringify(['Administrator']);
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    crypto.randomUUID(), 
                    'admin', 
                    'adminpassword', 
                    adminRoles, 
                    null,
                    'Active'
                ]
            );
        }
    } catch (error) {
        console.error("Error during database seeding:", error);
    } finally {
        connection.release();
    }
}
