

'use server';
import type { AppUser, Role, Permission } from "./types";
import db from "./db";
import { getPermissionsMap } from './actions/permission-actions';

// Server-side permission check
export async function checkPermissions(username: string, permission: Permission): Promise<boolean> {
    if (!username) return false;

    // Special case: 'admin' user always has all permissions.
    if (username.toLowerCase() === 'admin') {
        return true;
    }

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT roles FROM users WHERE username = ?', [username]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return false;
        }
        
        let userRoles: Role[] = [];
        const user = (rows as any)[0];
        if (typeof user.roles === 'string') {
            userRoles = JSON.parse(user.roles);
        } else if (Array.isArray(user.roles)) {
            userRoles = user.roles;
        }
        
        if (!userRoles || userRoles.length === 0) return false;

        // Admins and Developers have all permissions implicitly
        if (userRoles.includes('Administrator') || userRoles.includes('Developer')) {
            return true;
        }

        const permissionsMap = await getPermissionsMap();
        
        for (const role of userRoles) {
            const rolePermissions = permissionsMap[role];
            if (rolePermissions?.includes(permission)) {
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error("Permission check failed:", error);
        return false;
    } finally {
        connection.release();
    }
}
