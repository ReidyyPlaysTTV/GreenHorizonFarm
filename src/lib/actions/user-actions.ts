
'use server';

import db, { ensureDbInitialized } from '../db';
import type { AppUser, AccessRequest } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import { staffRoles } from '../data';

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
        await ensureDbInitialized(true);
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT 1 as ping');
            const latency = Date.now() - startTime;
            if (Array.isArray(rows) && (rows[0] as any).ping === 1) {
                return { success: true, message: `Database Connected Successfully. Latency: ${latency}ms` };
            }
            return { success: false, message: 'Ping failed.' };
        } finally { connection.release(); }
    } catch (error: any) { return { success: false, message: `Connection Error: ${error.message}` }; }
}

export async function getUsers(): Promise<AppUser[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [users] = await connection.query('SELECT id, username, roles, createdAt, avatarUrl, status FROM users ORDER BY username ASC');
            if (!Array.isArray(users)) return [];
            const [personnel] = await connection.query('SELECT name, rank, userId FROM personnel');
            const personnelMap = new Map();
            if (Array.isArray(personnel)) { personnel.forEach((p: any) => personnelMap.set(p.userId || p.name, p)); }

            return (users as any[]).map((u: any) => {
                const pRecord = personnelMap.get(u.id) || personnelMap.get(u.username);
                let userRoles = [];
                try { userRoles = typeof u.roles === 'string' ? JSON.parse(u.roles) : (Array.isArray(u.roles) ? u.roles : []); } catch(e) {}
                return { ...u, roles: userRoles, createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined, personnel: pRecord || null };
            });
        } finally { connection.release(); }
    } catch (error) { return []; }
}

export async function getUserByUsername(username: string): Promise<AppUser | null> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [users] = await connection.query('SELECT id, username, roles, createdAt, avatarUrl, status FROM users WHERE username = ?', [username]);
            if (!Array.isArray(users) || users.length === 0) return null;
            const u = (users as any)[0];
            const [personnel] = await connection.query('SELECT name, rank, userId, phone_number, bank_account, discord_username, hire_date FROM personnel WHERE userId = ? OR name = ?', [u.id, u.username]);
            let pRecord = null;
            if (Array.isArray(personnel) && personnel.length > 0) {
                const p = (personnel as any)[0];
                pRecord = { ...p, phoneNumber: p.phone_number, bankAccount: p.bank_account, discordUsername: p.discord_username, hireDate: p.hire_date ? new Date(p.hire_date).toISOString() : null };
            }
            let userRoles = [];
            try { userRoles = typeof u.roles === 'string' ? JSON.parse(u.roles) : (Array.isArray(u.roles) ? u.roles : []); } catch(e) {}
            return { ...u, roles: userRoles, createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined, personnel: pRecord };
        } finally { connection.release(); }
    } catch (error) { return null; }
}

export async function loginUser(credentials: any) {
    try {
        const { username, password } = credentials;
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
            if (!Array.isArray(rows) || rows.length === 0) return { success: false, message: 'Incorrect credentials.' };
            const user = (rows as any[])[0];
            if (user.password !== password) return { success: false, message: 'Incorrect credentials.' };
            return { success: true, user: { username: user.username } };
        } finally { connection.release(); }
    } catch (e) { return { success: false, message: "DB Error" }; }
}

export async function submitAccessRequest(data: any) {
    const { username, password } = data;
    const connection = await db.getConnection();
    try {
        await connection.query(
            'INSERT INTO access_requests (id, requested_username, password, status) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), username, password, 'Pending']
        );
        await sendAccessRequestWebhook(username);
        return { success: true };
    } catch (e) { return { success: false, message: 'Failed' }; }
    finally { connection.release(); }
}

export async function approveAccessRequest(data: any) {
    const { requestId, username, roles: requestedRoles, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [reqRows]: any = await connection.query('SELECT password FROM access_requests WHERE id = ?', [requestId]);
        if (reqRows.length === 0) throw new Error('Not found.');
        const password = reqRows[0].password;
        const [rosterRows]: any = await connection.query('SELECT rank FROM personnel WHERE UPPER(name) = UPPER(?)', [username.trim()]);
        let finalRoles = requestedRoles || ['User'];
        if (rosterRows.length > 0) finalRoles = [...new Set([...finalRoles, rosterRows[0].rank])];
        const userId = crypto.randomUUID();
        await connection.query('INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)', [userId, username, password, JSON.stringify(finalRoles), 'Active']);
        await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Approved', requestId]);
        await connection.query('UPDATE personnel SET userId = ? WHERE UPPER(name) = UPPER(?)', [userId, username.trim()]);
        await logUserAction(adminUser, 'Approve Access Request', `Created account for: ${username}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        return { success: true, message: 'Approved' };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; }
    finally { connection.release(); }
}

export async function denyAccessRequest(requestId: string, requestedUsername: string, adminUser: string) {
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Denied', requestId]);
        await logUserAction(adminUser, 'Deny Access Request', `Denied access for: ${requestedUsername}`, connection);
        revalidatePath('/admin');
        return { success: true, message: 'Denied' };
    } catch (e) { return { success: false, message: 'Failed' }; }
    finally { connection.release(); }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query("SELECT id, requested_username, status, createdAt FROM access_requests WHERE status = 'Pending' ORDER BY createdAt ASC");
            return (rows as any[]).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
        } finally { connection.release(); }
    } catch (error) { return []; }
}

export async function setUserStatus(data: { userId: string, status: 'Active' | 'Banned', adminUser: string }) {
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET status = ? WHERE id = ?', [data.status, data.userId]);
        await logUserAction(data.adminUser, 'Update User Status', `Set user ${data.userId} to ${data.status}`, connection);
        revalidatePath('/admin');
        return { success: true };
    } finally { connection.release(); }
}

export async function deleteUser(userId: string, adminUser: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [userRows]: any = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        const username = userRows[0]?.username;
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        await connection.query('UPDATE personnel SET userId = NULL WHERE userId = ?', [userId]);
        await logUserAction(adminUser, 'Delete User', `Deleted account: ${username}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        return { success: true, message: 'Deleted' };
    } catch (e) { await connection.rollback(); return { success: false, message: 'Failed' }; }
    finally { connection.release(); }
}

export async function getReviewedApplicationsCount(userId: string): Promise<number> {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM applications WHERE reviewer_id = ?', [userId]);
        return (rows as any)[0]?.count || 0;
    } catch (e) { return 0; }
}

export async function createUser(data: any) {
  const { username, password, roles: initialRoles, adminUser } = data;
  const connection = await db.getConnection();
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
    return { success: true, message: 'Created' };
  } catch (error) { await connection.rollback(); return { success: false, message: 'Failed' }; }
  finally { connection.release(); }
}

export async function updateUser(data: any) {
    const { userId, username, roles, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE users SET username = ?, roles = ? WHERE id = ?', [username, JSON.stringify(roles), userId]);
        await connection.query('UPDATE personnel SET name = ? WHERE userId = ?', [username, userId]);
        await logUserAction(adminUser, 'Update User', `Updated account: ${username}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        return { success: true };
    } catch (e) { await connection.rollback(); return { success: false, message: 'Failed' }; }
    finally { connection.release(); }
}

export async function resetUserPassword(data: any) {
    const { userId, newPassword, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await logUserAction(adminUser, 'Reset Password', `Reset password for user ${userId}`, connection);
        return { success: true, message: "Success" };
    } finally { connection.release(); }
}

export async function changeUserPassword(data: any) {
    const { userId, currentPassword, newPassword } = data;
    const connection = await db.getConnection();
    try {
        const [rows]: any = await connection.query('SELECT password, username FROM users WHERE id = ?', [userId]);
        if (rows.length === 0 || rows[0].password !== currentPassword) return { success: false, message: 'Incorrect password.' };
        await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await logUserAction(rows[0].username, 'Change Password', 'Changed password.');
        return { success: true, message: 'Changed' };
    } finally { connection.release(); }
}

export async function updateProfilePicture(data: any) {
    const { userId, url, user } = data;
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET avatarUrl = ? WHERE id = ?', [url, userId]);
        await logUserAction(user, 'Update Avatar', 'Updated profile picture.');
        revalidatePath('/users');
        return { success: true, message: 'Updated' };
    } finally { connection.release(); }
}
