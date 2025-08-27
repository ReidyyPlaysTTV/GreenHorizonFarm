
'use server';

import db from '../db';
import { revalidatePath } from 'next/cache';
import type { Permission, Role } from '../types';
import { initialPermissionsMap } from '../data';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';
import type { Pool } from 'mysql2/promise';

async function createRolePermissionsTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
            role VARCHAR(50) NOT NULL,
            permission VARCHAR(50) NOT NULL,
            PRIMARY KEY (role, permission)
        );
    `);
}

export async function getPermissionsMap(): Promise<Record<Role, Permission[]>> {
    const connection = await db.getConnection();
    try {
        await createRolePermissionsTableIfNeeded(connection);
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

    } catch (error) {
        console.error("Failed to fetch permissions map:", error);
        // Fallback to initial map in case of error
        return initialPermissionsMap;
    } finally {
        connection.release();
    }
}

export async function updateRolePermissions(newPermissions: Record<Role, Permission[]>, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_ROLES_PERMISSIONS');
    if (!hasPermission) {
        throw new Error('You do not have permission to perform this action.');
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Clear existing permissions
        await connection.query('DELETE FROM role_permissions');

        // Insert new permissions
        for (const role in newPermissions) {
            const permissions = newPermissions[role as Role];
            for (const permission of permissions) {
                await connection.query(
                    'INSERT INTO role_permissions (role, permission) VALUES (?, ?)',
                    [role, permission]
                );
            }
        }
        
        await logUserAction(user, 'Update Permissions', 'Updated application role permissions.', connection);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Failed to update role permissions:", error);
        throw new Error("Database operation failed.");
    } finally {
        connection.release();
    }

    revalidatePath('/admin', 'layout');
}


export async function seedRolePermissions(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        await createRolePermissionsTableIfNeeded(connection);

        const [existingRows] = await connection.query('SELECT COUNT(*) as count FROM role_permissions');
        
        if (Array.isArray(existingRows) && (existingRows[0] as any).count === 0) {
            console.log("No role permissions found. Seeding default permissions...");

            for (const role in initialPermissionsMap) {
                const permissions = initialPermissionsMap[role as Role];
                for (const permission of permissions) {
                    await connection.query(
                        'INSERT INTO role_permissions (role, permission) VALUES (?, ?)',
                        [role, permission]
                    );
                }
            }
            console.log("Default role permissions seeded successfully.");
        }
    } catch (error) {
        console.error("Error during role permission seeding:", error);
    } finally {
        connection.release();
    }
}
