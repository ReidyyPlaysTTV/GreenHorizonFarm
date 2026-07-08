
'use server';
import type { Role, Permission } from "./types";
import db from "./db";
import { initialPermissionsMap } from './data';

/**
 * Internal helper to fetch permissions with resilience for lookups.
 */
async function getInternalPermissionsMap(): Promise<Record<Role, Permission[]>> {
    try {
        const fetchPromise = (async () => {
            const [rows] = await db.query('SELECT role, permission FROM role_permissions');
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
        })();

        const timeoutPromise = new Promise<Record<Role, Permission[]>>((resolve) => 
            setTimeout(() => resolve(initialPermissionsMap), 2500)
        );

        const map = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Safety: Ensure high-level roles always have full permissions
        const allPerms = Object.keys(initialPermissionsMap).flatMap(r => initialPermissionsMap[r as Role]);
        const uniquePerms = [...new Set(allPerms)] as Permission[];
        
        // Use a generic casting to fix TS mapping issues during timeout resolution
        const finalMap = map as Record<Role, Permission[]>;
        finalMap.Developer = uniquePerms;
        finalMap.Administrator = uniquePerms;
        finalMap.CEO = uniquePerms;

        return finalMap;
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
            const [rows] = await db.query('SELECT roles FROM users WHERE username = ?', [decodedUsername]);
            if (!Array.isArray(rows) || rows.length === 0) return false;
            
            const user = (rows as any)[0];
            let userRoles: Role[] = [];
            try {
                userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
            } catch (e) { return false; }
            
            if (userRoles.includes('Administrator') || userRoles.includes('Developer')) return true;

            const permissionsMap = await getInternalPermissionsMap();
            return userRoles.some(role => permissionsMap[role]?.includes(permission));
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => 
            setTimeout(() => resolve(false), 2500)
        );

        return await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
        return false;
    }
}
