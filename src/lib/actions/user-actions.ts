
'use server';

import db, { ensureDbInitialized } from '../db';
import pool from '../db';
import type { AppUser, AccessRequest, Personnel } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';

/**
 * Tests the connection to the MariaDB database with specific error handling for timeouts.
 */
export async function testDatabaseConnection() {
    const startTime = Date.now();
    try {
        // Attempt to get a connection from the pool
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT 1 as ping');
            const latency = Date.now() - startTime;
            if (Array.isArray(rows) && (rows[0] as any).ping === 1) {
                return { success: true, message: `Database Connected Successfully. Latency: ${latency}ms` };
            }
            return { success: false, message: 'Ping failed but connection established.' };
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Diagnostic Connection Error:", error);
        
        let customMessage = `Connection Error: ${error.message || 'Unknown issue'}.`;
        
        if (error.code === 'ETIMEDOUT') {
            customMessage = "Network Timeout: The ZAP-Hosting server did not respond within 5 seconds. Check if 'Remote Access' is enabled and whitelisted for IP '%' in your ZAP dashboard.";
        } else if (error.code === 'ECONNREFUSED') {
            customMessage = "Connection Refused: The database server is online but rejected the connection on port 3306. Check your ZAP-Hosting firewall settings.";
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            customMessage = "Access Denied: Invalid username or password for this database instance.";
        }

        return { 
            success: false, 
            message: customMessage,
            code: error.code
        };
    }
}

export async function getUsers(): Promise<AppUser[]> {
    try {
        // ensureDbInitialized has a 5s internal timeout
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [users] = await connection.query('SELECT id, username, roles, createdAt, avatarUrl, status FROM users ORDER BY username ASC');
            if (!Array.isArray(users)) return [];

            const [personnel] = await connection.query('SELECT name, rank, department, userId FROM personnel');
            const personnelMap = new Map();
            if (Array.isArray(personnel)) {
                personnel.forEach((p: any) => {
                    personnelMap.set(p.userId || p.name, p);
                });
            }

            return (users as any[]).map((u: any) => {
                const pRecord = personnelMap.get(u.id) || personnelMap.get(u.username);
                let userRoles = [];
                if(typeof u.roles === 'string') {
                    try {
                        userRoles = JSON.parse(u.roles);
                    } catch(e) { 
                        userRoles = [];
                    }
                } else if (Array.isArray(u.roles)) {
                    userRoles = u.roles;
                }

                return {
                    ...u,
                    roles: userRoles,
                    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
                    personnel: pRecord || null
                };
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.warn("Failed to fetch users (DB Offline). Returning empty list.");
        return [];
    }
}

export async function loginUser(credentials: any) {
    try {
        const { username, password } = credentials;
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
            if (!Array.isArray(rows) || rows.length === 0) {
                return { success: false, message: 'Incorrect username or password.' };
            }
            const user = (rows as any[])[0];
            if (user.password !== password) return { success: false, message: 'Incorrect username or password.' };
            
            return { success: true, user: { username: user.username } };
        } finally {
            connection.release();
        }
    } catch (e) {
        return { success: false, message: "System Error: Database Unreachable" };
    }
}

export async function createUser(data: any) {
    const { username, password, roles, adminUser } = data;
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const userId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)',
                [userId, username, password, JSON.stringify(roles), 'Active']
            );
            await logUserAction(adminUser, 'Create User', `Manually created user account: ${username}`, connection);
            await connection.commit();
            revalidatePath('/admin');
            return { success: true, message: `User '${username}' created.` };
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    } catch (error) {
        return { success: false, message: 'Operation failed.' };
    }
}

export async function denyAccessRequest(requestId: string, requestedUsername: string, adminUser: string) {
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Denied', requestId]);
            await logUserAction(adminUser, 'Deny Access Request', `Denied access for user: ${requestedUsername}`, connection);
            await connection.commit();
            revalidatePath('/admin');
            return { success: true, message: 'Access request denied.' };
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    } catch (error) {
        return { success: false, message: 'Operation failed.' };
    }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query("SELECT id, requested_username, status, createdAt FROM access_requests WHERE status = 'Pending' ORDER BY createdAt ASC");
            return (rows as any[]).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}

export async function changeUserPassword(data: any) { return { success: false }; }
export async function updateProfilePicture(data: any) { return { success: false }; }
export async function getReviewedApplicationsCount(userId: string) { return 0; }
export async function updateUser(data: any) { return { success: false }; }
export async function setUserStatus(data: any) { return { success: false }; }
export async function resetUserPassword(data: any) { return { success: false }; }
export async function deleteUser(userId: string, adminUser: string) { return { success: false }; }
export async function submitAccessRequest(data: any) { return { success: false }; }
export async function approveAccessRequest(data: any) { return { success: false }; }
