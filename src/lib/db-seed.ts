
'use server';

import type { Pool } from 'mysql2/promise';

/**
 * Seeds the initial users into the database.
 * Ensures Leon Green (Developer) and Admin accounts exist.
 * Also checks the roster to sync ranks for these users if they exist on the roster.
 */
export async function seedDatabase(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        // 1. Ensure Leon Green
        const [leonRows]: any = await connection.query('SELECT id, roles FROM users WHERE username = ?', ['Leon Green']);
        let leonId: string;

        if (leonRows.length === 0) {
            console.log("Seeding Developer: Leon Green");
            leonId = crypto.randomUUID();
            
            // Check roster for Leon's current rank
            const [leonRoster]: any = await connection.query('SELECT rank FROM personnel WHERE UPPER(name) = "LEON GREEN"');
            const initialRoles = ['Developer'];
            if (leonRoster.length > 0) {
                initialRoles.push(leonRoster[0].rank);
            }

            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    leonId, 
                    'Leon Green', 
                    'Katarina1997', 
                    JSON.stringify([...new Set(initialRoles)]), 
                    'https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png',
                    'Active'
                ]
            );
            
            // Update personnel table with the link
            await connection.query('UPDATE personnel SET userId = ? WHERE UPPER(name) = "LEON GREEN"', [leonId]);
        }

        // 2. Ensure admin
        const [adminRows]: any = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
        if (adminRows.length === 0) {
            console.log("Seeding Administrator: admin");
            const adminId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO users (id, username, password, roles, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    adminId, 
                    'admin', 
                    'adminpassword', 
                    JSON.stringify(['Administrator']), 
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
