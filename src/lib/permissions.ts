
'use server';
import type { Role, Permission } from "./types";
import db from "./db";
import { initialPermissionsMap } from './data';

/**
 * Internal helper to fetch permissions with resilience for timeouts.
 */
async function getInternalPermissionsMap(): Promise<Record<Role, Permission[]>> {
    try {
        const fetchPromise = (async () => {
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
                return map;
            } finally {
                connection.release();
            }
        })();

        const timeoutPromise = new Promise<Record<Role, Permission[]>>((resolve) => 
            setTimeout(() => resolve(initialPermissionsMap), 2000)
        );

        const map = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Safety: Ensure high-level roles always have full permissions
        const allPerms = Object.keys(initialPermissionsMap).flatMap(r => initialPermissionsMap[r as Role]);
        const uniquePerms = [...new Set(allPerms)] as Permission[];
        map.Developer = uniquePerms;
        map.Administrator = uniquePerms;
        map.CEO = uniquePerms;

        return map;
    } catch (e) {
        return initialPermissionsMap;
    }
}

export async function checkPermissions(username: string, permission: Permission): Promise<boolean> {
    if (!username) return false;

    const decodedUsername = decodeURIComponent(username);

    // Bypasses for master accounts to prevent lockout during DB instability
    if (decodedUsername === 'Leon Green' || decodedUsername === 'admin') {
        return true;
    }

    try {
        const checkPromise = (async () => {
            const connection = await db.getConnection();
            try {
                const [rows] = await connection.query('SELECT roles FROM users WHERE username = ?', [decodedUsername]);
                if (!Array.isArray(rows) || rows.length === 0) return false;
                
                const user = (rows as any)[0];
                let userRoles: Role[] = [];
                try {
                    userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
                } catch (e) { return false; }
                
                if (userRoles.includes('Administrator') || userRoles.includes('Developer')) return true;

                const permissionsMap = await getInternalPermissionsMap();
                return userRoles.some(role => permissionsMap[role]?.includes(permission));
            } finally {
                connection.release();
            }
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => 
            setTimeout(() => resolve(false), 2500)
        );

        return await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
        return false;
    }
}
