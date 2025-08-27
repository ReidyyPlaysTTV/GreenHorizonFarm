
'use server';

import db from '../db';
import type { AppUser } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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
        throw new Error("Database schema setup failed for users.");
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

const roleSchema = z.string().min(1, "Role cannot be empty.");

export async function assignUserRole(userId: string, role: string) {
    const validatedRole = roleSchema.safeParse(role);

    if (!validatedRole.success) {
        return { success: false, message: 'Invalid role specified.' };
    }

    try {
        await db.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [validatedRole.data, userId]
        );
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Failed to assign user role:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}
