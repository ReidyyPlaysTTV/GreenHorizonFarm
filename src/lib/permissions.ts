
'use server';
import type { AppUser, Role, Permission } from "./types";
import db from "./db";
import { permissions, permissionsMap } from './data';

// Server-side permission check
export async function checkPermissions(username: string, permission: Permission): Promise<boolean> {
    if (!username) return false;

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT role FROM users WHERE username = ?', [username]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return false;
        }
        const user = (rows as AppUser[])[0];
        const userRole = user.role as Role;

        if (!userRole) return false;

        // Admins and Developers have all permissions implicitly
        if (userRole === 'Administrator' || userRole === 'Developer') {
            return true;
        }

        const userPermissions = permissionsMap[userRole];
        return userPermissions?.includes(permission) ?? false;

    } catch (error) {
        console.error("Permission check failed:", error);
        return false;
    } finally {
        connection.release();
    }
}
