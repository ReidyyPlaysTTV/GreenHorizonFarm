
'use server';

import type { Pool } from 'mysql2/promise';

/**
 * Seeds the initial users into the database.
 * Ensures Leon Green (Developer) and Admin accounts exist.
 * Also performs standard maintenance like removing obsolete test records.
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

        // 3. Maintenance: Remove stale personnel (Katarina Green & Rick)
        // These names were identified as obsolete test data stuck in the DB.
        const [cleanupRows]: any = await connection.query(
            "SELECT id FROM personnel WHERE name IN ('Katarina Green', 'Rick')"
        );
        
        if (cleanupRows.length > 0) {
            console.log("Database Maintenance: Purging stale records for Katarina Green and Rick.");
            await connection.query("DELETE FROM personnel WHERE name IN ('Katarina Green', 'Rick')");
            await connection.query("DELETE FROM users WHERE username IN ('Katarina Green', 'Rick')");
            
            // Log the cleanup for transparency
            await connection.query(
                'INSERT INTO audit_logs (id, user, actionType, description) VALUES (?, ?, ?, ?)',
                [crypto.randomUUID(), 'System', 'Database Cleanup', 'Automatically purged stale personnel: Katarina Green, Rick']
            );
        }

    } catch (error) {
        console.error("Error during database seeding:", error);
    } finally {
        connection.release();
    }
}
