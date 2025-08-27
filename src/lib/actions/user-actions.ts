

'use server';

import db from '../db';
import type { AppUser } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';

async function createUsersTableIfNeeded() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'User',
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        console.error("Failed to create users table:", error);
        throw new Error("Database schema setup for users failed.");
    }
}

export async function getUsers(): Promise<AppUser[]> {
    try {
        await createUsersTableIfNeeded();
        // For security, we don't select the password_hash
        const [rows] = await db.query('SELECT id, username, role FROM users ORDER BY username ASC');
        if (!Array.isArray(rows)) {
            return [];
        }
        return rows as AppUser[];
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

const roleSchema = z.object({
    role: z.string().min(1, "Role cannot be empty."),
    user: z.string(),
});

export async function assignUserRole(userId: string, data: { role: string, user: string }) {
    const validation = roleSchema.safeParse(data);

    if (!validation.success) {
        return { success: false, message: 'Invalid role specified.' };
    }
    const { role, user } = validation.data;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        const targetUsername = (userRows as any)[0]?.username || 'Unknown User';

        await connection.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, userId]
        );

        await logUserAction(user, 'Assign Role', `Assigned role '${role}' to user '${targetUsername}'.`, connection);

        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/logs');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Failed to assign user role:', error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
