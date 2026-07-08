'use server';
import type { Role, Permission } from "./types";
import db from "./db";
import { initialPermissionsMap } from './data';

/**
 * Internal helper to fetch permissions without importing from actions (avoids circular dependency)
 */
async function getInternalPermissionsMap(): Promise<Record<Role, Permission[]>> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT role, permission FROM role_permissions');
        
        const map: Record<Role, Permission[]> = (Object.keys(initialPermissionsMap) as Role[]).reduce((acc, role) => {
            acc[role] = [];
            return acc;
        }, {} as Record<Role, Permission[]>);

        if (Array.isArray(rows)) {
            for (const row of (rows as any[])) {
                if (map[row.role as Role]) {
                    map[row.role as Role].push(row.permission as Permission);
                }
            }
        }
        
        // Ensure Developer and Administrator always have all permissions
        const allPermissionIds = Object.keys(initialPermissionsMap).flatMap(role => initialPermissionsMap[role as Role]);
        const uniquePermissions = [...new Set(allPermissionIds)] as Permission[];

        map.Developer = uniquePermissions;
        map.Administrator = uniquePermissions;

        return map;
    } catch (error) {
        return initialPermissionsMap;
    } finally {
        connection.release();
    }
}

// Server-side permission check with enhanced safety for offline DB
export async function checkPermissions(username: string, permission: Permission): Promise<boolean> {
    if (!username) return false;

    const decodedUsername = decodeURIComponent(username);

    // Hardcoded bypass for the primary developer account
    if (decodedUsername === 'Leon Green' || decodedUsername === 'admin') {
        return true;
    }

    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT roles FROM users WHERE username = ?', [decodedUsername]);
            if (!Array.isArray(rows) || rows.length === 0) {
                return false;
            }
            
            const user = (rows as any)[0];
            if (!user || !user.roles) return false;

            let userRoles: Role[] = [];
            if (typeof user.roles === 'string') {
                try {
                    userRoles = JSON.parse(user.roles);
                } catch (e) {
                    userRoles = [];
                }
            } else if (Array.isArray(user.roles)) {
                userRoles = user.roles;
            }
            
            if (userRoles.includes('Administrator') || userRoles.includes('Developer')) {
                return true;
            }

            const permissionsMap = await getInternalPermissionsMap();
            for (const role of userRoles) {
                const rolePermissions = permissionsMap[role];
                if (rolePermissions?.includes(permission)) {
                    return true;
                }
            }

            return false;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.warn("Permission check failed (DB offline): Defaulting to restricted access.");
        return false;
    }
}
