
'use server';

import type { Pool } from 'mysql2/promise';

/**
 * Seeds the initial users into the database.
 * Ensures Leon Green (Developer) and Admin accounts exist.
 */
export async function seedDatabase(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // 1. Ensure Leon Green
        const [leonRows]: any = await connection.query('SELECT id FROM users WHERE username = ?', ['Leon Green']);
        const leonId = leonRows.length > 0 ? leonRows[0].id : crypto.randomUUID();

        if (leonRows.length === 0) {
            console.log("Seeding Developer: Leon Green");
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    leonId, 
                    'Leon Green', 
                    'Katarina97', 
                    JSON.stringify(['Developer', 'CEO']), 
                    'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png',
                    'Active'
                ]
            );
        } else {
            await connection.query('UPDATE users SET password = ? WHERE username = ?', ['Katarina97', 'Leon Green']);
        }

        // 2. Ensure admin
        const [adminRows]: any = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
        if (adminRows.length === 0) {
            console.log("Seeding Administrator: admin");
            const adminId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)',
                [
                    adminId, 
                    'admin', 
                    'adminpassword', 
                    JSON.stringify(['Administrator']), 
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
