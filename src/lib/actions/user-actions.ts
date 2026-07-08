
'use server';

import db, { ensureDbInitialized } from '../db';
import type { AppUser, AccessRequest } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';

const ACCESS_REQUEST_WEBHOOK = "https://discord.com/api/webhooks/1524267210560897199/dZfn4POVJsuCkscKcfCTlH_CnNUysdLIM-zxI9JebU3NAu3pJyEDBow_P4q1FqtueiNj";

async function sendAccessRequestWebhook(username: string) {
    try {
        const payload = {
            embeds: [{
                title: "🔐 New System Access Request",
                color: 16776960, // Yellow
                description: `A new user has requested access to the management system.`,
                fields: [
                    { name: "Requested Username", value: `**${username}**`, inline: true },
                    { name: "Request Type", value: "New Account", inline: true }
                ],
                footer: { text: "Green Horizon Security Hub" },
                timestamp: new Date().toISOString()
            }]
        };
        await fetch(ACCESS_REQUEST_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) { console.error("Access Request Webhook Failed", e); }
}

export async function testDatabaseConnection() {
    const startTime = Date.now();
    try {
        const pool = await ensureDbInitialized(true);
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT 1 as ping');
            const latency = Date.now() - startTime;
            if (Array.isArray(rows) && (rows[0] as any).ping === 1) {
                return { success: true, message: `Database Connected Successfully. Latency: ${latency}ms` };
            }
            return { success: false, message: 'Ping failed: Database returned unexpected results.' };
        } finally { 
            connection.release(); 
        }
    } catch (error: any) { 
        return { success: false, message: `Connection Error: ${error.message}.` }; 
    }
}

export async function getUsers(): Promise<AppUser[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query(`
                SELECT 
                    u.id, u.username, u.roles, u.createdAt, u.avatarUrl, u.status,
                    p.rank, p.phone_number, p.bank_account, p.discord_username, p.hire_date
                FROM users u
                LEFT JOIN personnel p ON u.id = p.userId OR UPPER(u.username) = UPPER(p.name)
                ORDER BY u.username ASC
            `);
            
            if (!Array.isArray(rows)) return [];

            return rows.map((row: any) => {
                let userRoles = [];
                try { 
                    userRoles = typeof row.roles === 'string' ? JSON.parse(row.roles) : (Array.isArray(row.roles) ? row.roles : []); 
                } catch(e) { userRoles = []; }

                return { 
                    id: row.id,
                    username: row.username,
                    status: row.status,
                    avatarUrl: row.avatarUrl,
                    roles: Array.isArray(userRoles) ? userRoles : [], 
                    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined, 
                    personnel: row.rank ? {
                        rank: row.rank,
                        phoneNumber: row.phone_number,
                        bankAccount: row.bank_account,
                        discordUsername: row.discord_username,
                        hireDate: row.hire_date ? new Date(row.hire_date).toISOString() : null
                    } : null 
                };
            });
        } finally {
            connection.release();
        }
    } catch (error) { 
        console.error("Action Error (getUsers):", error);
        return []; 
    }
}

export async function getUserByUsername(username: string): Promise<AppUser | null> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query(`
                SELECT 
                    u.id, u.username, u.roles, u.createdAt, u.avatarUrl, u.status,
                    p.rank, p.phone_number, p.bank_account, p.discord_username, p.hire_date
                FROM users u
                LEFT JOIN personnel p ON u.id = p.userId OR UPPER(u.username) = UPPER(p.name)
                WHERE u.username = ?
                LIMIT 1
            `, [username]);
            
            if (!Array.isArray(rows) || rows.length === 0) return null;
            const row = rows[0];

            let userRoles = [];
            try { 
                userRoles = typeof row.roles === 'string' ? JSON.parse(row.roles) : (Array.isArray(row.roles) ? row.roles : []); 
                if (typeof userRoles === 'string') userRoles = JSON.parse(userRoles);
            } catch(e) { userRoles = []; }

            return { 
                id: row.id,
                username: row.username,
                status: row.status,
                avatarUrl: row.avatarUrl,
                roles: Array.isArray(userRoles) ? userRoles : [], 
                createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined, 
                personnel: row.rank ? {
                    rank: row.rank,
                    phoneNumber: row.phone_number,
                    bankAccount: row.bank_account,
                    discordUsername: row.discord_username,
                    hireDate: row.hire_date ? new Date(row.hire_date).toISOString() : null
                } : null 
            };
        } finally {
            connection.release();
        }
    } catch (error) { 
        return null; 
    }
}

export async function loginUser(credentials: any) {
    try {
        const { username, password } = credentials;
        await ensureDbInitialized();
        const [rows]: any = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!Array.isArray(rows) || rows.length === 0) return { success: false, message: 'Incorrect credentials.' };
        const user = rows[0];
        if (user.password !== password) return { success: false, message: 'Incorrect credentials.' };
        
        return { success: true, user: { username: user.username } };
    } catch (e: any) { 
        return { success: false, message: "Authentication failure (Database Timeout)." }; 
    }
}

export async function submitAccessRequest(data: any) {
    const { username, password } = data;
    try {
        await ensureDbInitialized();
        await db.query(
            'INSERT INTO access_requests (id, requested_username, password, status) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), username, password, 'Pending']
        );
        await sendAccessRequestWebhook(username);
        return { success: true };
    } catch (e) { return { success: false, message: 'Request failed (Database Error).' }; }
}

export async function approveAccessRequest(data: any) {
    try {
        const { requestId, username, roles: requestedRoles, adminUser, rank, callsign } = data;
        const pool = await ensureDbInitialized();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const [reqRows]: any = await connection.query('SELECT password FROM access_requests WHERE id = ?', [requestId]);
            if (reqRows.length === 0) throw new Error('Request not found.');
            const password = reqRows[0].password;
            
            const userId = crypto.randomUUID();
            let finalRoles = requestedRoles || ['User'];
            if (rank) finalRoles = [...new Set([...finalRoles, rank])];
            
            // Create User Account
            await connection.query(
                'INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)', 
                [userId, username, password, JSON.stringify(finalRoles), 'Active']
            );
            
            // Mark Request as Approved
            await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Approved', requestId]);
            
            // Onboard to Roster
            const [rosterRows]: any = await connection.query('SELECT id FROM personnel WHERE UPPER(name) = UPPER(?)', [username.trim()]);
            if (rosterRows.length > 0) {
                await connection.query('UPDATE personnel SET userId = ?, rank = ?, status = "Active" WHERE id = ?', [userId, rank, rosterRows[0].id]);
            } else {
                await connection.query(
                    'INSERT INTO personnel (id, name, rank, badgeNumber, status, hire_date, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [crypto.randomUUID(), username, rank, callsign, 'Active', new Date(), userId]
                );
            }

            await logUserAction(adminUser, 'Approve Access Request', `Onboarded user: ${username} with rank ${rank}.`, connection);
            await connection.commit();
            
            revalidatePath('/admin');
            revalidatePath('/users');
            revalidatePath('/roster');
            return { success: true, message: 'Approved' };
        } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; }
        finally { connection.release(); }
    } catch (e) { return { success: false, message: 'Database Connection Error.' }; }
}

export async function denyAccessRequest(requestId: string, requestedUsername: string, adminUser: string) {
    try {
        await ensureDbInitialized();
        await db.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Denied', requestId]);
        await logUserAction(adminUser, 'Deny Access Request', `Denied access for: ${requestedUsername}`);
        revalidatePath('/admin');
        return { success: true, message: 'Denied' };
    } catch (e) { return { success: false, message: 'Database failure.' }; }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
    try {
        await ensureDbInitialized();
        const [rows]: any = await db.query("SELECT id, requested_username, status, createdAt FROM access_requests WHERE status = 'Pending' ORDER BY createdAt ASC");
        return Array.isArray(rows) ? rows.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) })) : [];
    } catch (error) { return []; }
}

export async function setUserStatus(data: { userId: string, status: 'Active' | 'Banned', adminUser: string }) {
    try {
        await ensureDbInitialized();
        await db.query('UPDATE users SET status = ? WHERE id = ?', [data.status, data.userId]);
        await logUserAction(data.adminUser, 'Update User Status', `Set user ${data.userId} to ${data.status}`);
        revalidatePath('/admin');
        revalidatePath('/users');
        return { success: true };
    } catch (e) { return { success: false, message: 'Update failed.' }; }
}

export async function deleteUser(userId: string, adminUser: string) {
    try {
        const pool = await ensureDbInitialized();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [userRows]: any = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
            const username = userRows[0]?.username;
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            await connection.query('UPDATE personnel SET userId = NULL WHERE userId = ?', [userId]);
            await logUserAction(adminUser, 'Delete User', `Deleted account: ${username}`, connection);
            await connection.commit();
            revalidatePath('/admin');
            revalidatePath('/users');
            return { success: true, message: 'Deleted' };
        } catch (e) { await connection.rollback(); return { success: false, message: 'Deletion failed.' }; }
        finally { connection.release(); }
    } catch (e) { return { success: false, message: 'Database connection failed.' }; }
}

export async function getReviewedApplicationsCount(userId: string): Promise<number> {
    try {
        await ensureDbInitialized();
        const [rows]: any = await db.query('SELECT COUNT(*) as count FROM applications WHERE reviewer_id = ?', [userId]);
        return rows[0]?.count || 0;
    } catch (e) { return 0; }
}

export async function createUser(data: any) {
  try {
    const { username, password, roles: initialRoles, adminUser } = data;
    const pool = await ensureDbInitialized();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rosterRows]: any = await connection.query('SELECT rank FROM personnel WHERE UPPER(name) = UPPER(?)', [username.trim()]);
        let finalRoles = initialRoles;
        if (rosterRows.length > 0) finalRoles = [...new Set([...finalRoles, rosterRows[0].rank])];
        const userId = crypto.randomUUID();
        await connection.query('INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)', [userId, username, password, JSON.stringify(finalRoles), 'Active']);
        await connection.query('UPDATE personnel SET userId = ? WHERE UPPER(name) = UPPER(?)', [userId, username.trim()]);
        await logUserAction(adminUser, 'Create User', `Manually created user: ${username}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/users');
        return { success: true, message: 'Created' };
    } catch (error) { await connection.rollback(); return { success: false, message: 'Database operation failed.' }; }
    finally { connection.release(); }
  } catch (e) { return { success: false, message: 'Connection failure.' }; }
}

export async function updateUser(data: any) {
    try {
        const { userId, username, roles, adminUser } = data;
        const pool = await ensureDbInitialized();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE users SET username = ?, roles = ? WHERE id = ?', [username, JSON.stringify(roles), userId]);
            await connection.query('UPDATE personnel SET name = ? WHERE userId = ?', [username, userId]);
            await logUserAction(adminUser, 'Update User', `Updated account: ${username}`, connection);
            await connection.commit();
            revalidatePath('/admin');
            revalidatePath('/users');
            return { success: true };
        } catch (e) { await connection.rollback(); return { success: false, message: 'Update failed.' }; }
        finally { connection.release(); }
    } catch (e) { return { success: false, message: 'Database connection failed.' }; }
}

export async function resetUserPassword(data: any) {
    try {
        await ensureDbInitialized();
        await db.query('UPDATE users SET password = ? WHERE id = ?', [data.newPassword, data.userId]);
        await logUserAction(data.adminUser, 'Reset Password', `Reset password for user ${data.userId}`);
        return { success: true, message: "Success" };
    } catch (e) { return { success: false, message: "Password reset failed." }; }
}

export async function changeUserPassword(data: any) {
    try {
        const { userId, currentPassword, newPassword } = data;
        await ensureDbInitialized();
        const [rows]: any = await db.query('SELECT password, username FROM users WHERE id = ?', [userId]);
        if (!Array.isArray(rows) || rows.length === 0 || rows[0].password !== currentPassword) return { success: false, message: 'Incorrect current password.' };
        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await logUserAction(rows[0].username, 'Change Password', 'Changed password via profile settings.');
        return { success: true, message: 'Changed' };
    } catch (e) { return { success: false, message: "Database update failed." }; }
}

export async function updateProfilePicture(data: any) {
    try {
        const { userId, url, user } = data;
        await ensureDbInitialized();
        await db.query('UPDATE users SET avatarUrl = ? WHERE id = ?', [url, userId]);
        await logUserAction(user, 'Update Avatar', 'Updated profile picture.');
        revalidatePath('/users');
        return { success: true, message: 'Updated' };
    } catch (e) { return { success: false, message: "Update failed (Database Error)." }; }
}
