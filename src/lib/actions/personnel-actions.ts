'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import type { Personnel, Rank } from '../types';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import { staffRoles } from '../data';

const HIRE_WEBHOOK_URL = process.env.DISCORD_HIRE_WEBHOOK;
const FIRE_WEBHOOK_URL = process.env.DISCORD_FIRE_WEBHOOK;

async function sendHireWebhook(data: any, isRehire: boolean = false) {
    if (!HIRE_WEBHOOK_URL) return;
    try {
        const payload = {
            embeds: [{
                title: isRehire ? "♻️ Personnel Rehired" : "🆕 New Personnel Onboarded",
                color: 3066993, // Green
                fields: [
                    { name: "Name", value: `**${data.name}**`, inline: true },
                    { name: "Rank", value: data.rank, inline: true },
                    { name: "Discord", value: data.discordUsername || "N/A", inline: true },
                    { name: "Phone", value: data.phoneNumber || "N/A", inline: true },
                    { name: "Hire Date", value: new Date().toLocaleDateString(), inline: true }
                ],
                footer: { text: "Green Horizon Personnel Management" },
                timestamp: new Date().toISOString()
            }]
        };
        await fetch(HIRE_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) { console.error("Discord Hire Webhook Failed", e); }
}

async function sendFireWebhook(data: any) {
    if (!FIRE_WEBHOOK_URL) return;
    try {
        const payload = {
            embeds: [{
                title: "🚫 Personnel Contract Terminated",
                color: 15158332, // Red
                fields: [
                    { name: "Name", value: `**${data.name}**`, inline: true },
                    { name: "Former Rank", value: data.rank, inline: true },
                    { name: "Reason for Termination", value: data.reason },
                    { name: "Date", value: new Date().toLocaleDateString(), inline: true }
                ],
                footer: { text: "Green Horizon Archive Entry" },
                timestamp: new Date().toISOString()
            }]
        };
        await fetch(FIRE_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) { console.error("Discord Fire Webhook Failed", e); }
}

async function syncUserRoles(connection: any, name: string, rank: string) {
    const [userRows]: any = await connection.query(
        'SELECT id, roles FROM users WHERE UPPER(username) = UPPER(?)', 
        [name.trim()]
    );

    if (userRows.length > 0) {
        const user = userRows[0];
        let currentRoles: string[] = [];
        try {
            const rolesRaw = user.roles;
            currentRoles = typeof rolesRaw === 'string' ? JSON.parse(rolesRaw) : (Array.isArray(rolesRaw) ? rolesRaw : []);
        } catch(e) { currentRoles = []; }
        
        const filteredRoles = currentRoles.filter(r => !staffRoles.includes(r as any));
        const newRoles = [...new Set([...filteredRoles, rank])];
        await connection.query('UPDATE users SET roles = ? WHERE id = ?', [JSON.stringify(newRoles), user.id]);
        await connection.query('UPDATE personnel SET userId = ? WHERE name = ?', [user.id, name]);
        return user.id;
    }
    return null;
}

async function getPersonnelById(id: string, connection?: any): Promise<Personnel | null> {
    const conn = connection || await db.getConnection();
    try {
        const [rows] = await conn.query('SELECT * FROM personnel WHERE id = ?', [id]);
        if (Array.isArray(rows) && rows.length > 0) return (rows as any)[0] as Personnel;
        return null;
    } finally { if (!connection) conn.release(); }
}

async function logEvent(personnelName: string, eventType: 'Hired' | 'Fired' | 'Promoted' | 'Demoted' | 'Rehired', description: string, dbConnection?: any) {
    const connection = dbConnection || await db.getConnection();
    try {
        await connection.query(
            'INSERT INTO personnel_events (id, personnel_name, event_type, description, date) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), personnelName, eventType, description, new Date()]
        );
    } catch (error) { console.error(`Failed to log event: ${eventType}`, error); }
    finally { if (!dbConnection) connection.release(); }
}

export async function promotePersonnel(personnelId: string, user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_EMPLOYEES');
  if (!hasPermission) return { success: false, message: 'Unauthorized' };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const personnel = await getPersonnelById(personnelId, connection);
    if (!personnel) throw new Error('Personnel not found.');
    
    const rankOrder = staffRoles;
    const currentRankIndex = rankOrder.indexOf(personnel.rank as any);
    if (currentRankIndex === -1) throw new Error('Invalid rank');
    if (currentRankIndex === 0) return { success: false, message: 'Max rank' };

    const newRank = rankOrder[currentRankIndex - 1];
    await connection.query('UPDATE personnel SET rank = ? WHERE id = ?', [newRank, personnelId]);
    await syncUserRoles(connection, personnel.name, newRank);
    await logEvent(personnel.name, 'Promoted', `Promoted from ${personnel.rank} to ${newRank}`, connection);
    await logUserAction(user, "Promote Personnel", `Promoted ${personnel.name} to ${newRank}.`, connection);
    await connection.commit();
    revalidatePath('/roster');
    return { success: true, message: 'Promoted' };
  } catch (error: any) { await connection.rollback(); return { success: false, message: error.message }; }
  finally { connection.release(); }
}

export async function demotePersonnel(personnelId: string, user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_EMPLOYEES');
  if (!hasPermission) return { success: false, message: 'Unauthorized' };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const personnel = await getPersonnelById(personnelId, connection);
    if (!personnel) throw new Error('Personnel not found.');
    
    const rankOrder = staffRoles;
    const currentRankIndex = rankOrder.indexOf(personnel.rank as any);
    if (currentRankIndex === -1 || currentRankIndex === rankOrder.length - 1) throw new Error('Cannot demote further');

    const newRank = rankOrder[currentRankIndex + 1];
    await connection.query('UPDATE personnel SET rank = ? WHERE id = ?', [newRank, personnelId]);
    await syncUserRoles(connection, personnel.name, newRank);
    await logEvent(personnel.name, 'Demoted', `Demoted from ${personnel.rank} to ${newRank}`, connection);
    await logUserAction(user, "Demote Personnel", `Demoted ${personnel.name} to ${newRank}.`, connection);
    await connection.commit();
    revalidatePath('/roster');
    return { success: true, message: 'Demoted' };
  } catch (error: any) { await connection.rollback(); return { success: false, message: error.message }; }
  finally { connection.release(); }
}

export async function firePersonnel(personnelId: string, reason: string, user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_EMPLOYEES');
  if (!hasPermission) return { success: false, message: 'Unauthorized' };
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const personnel = await getPersonnelById(personnelId, connection);
    if (!personnel) throw new Error('Personnel not found.');

    await connection.query(
        'INSERT INTO archived_personnel (id, name, rank, discord_username, status, date, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [personnel.id, personnel.name, personnel.rank, personnel.discord_username || null, 'Fired', new Date(), reason]
    );

    await connection.query('DELETE FROM personnel WHERE id = ?', [personnelId]);
    
    const [userRows]: any = await connection.query('SELECT id FROM users WHERE username = ?', [personnel.name]);
    if (userRows.length > 0) {
        await connection.query('UPDATE users SET roles = ? WHERE id = ?', [JSON.stringify(['User']), userRows[0].id]);
    }

    await logEvent(personnel.name, 'Fired', `Fired for: ${reason}`, connection);
    await logUserAction(user, "Fire Personnel", `Fired ${personnel.name}. Reason: ${reason}`, connection);
    await sendFireWebhook({ name: personnel.name, rank: personnel.rank, reason });

    await connection.commit();
    revalidatePath('/roster');
    revalidatePath('/archive');
    return { success: true, message: 'Fired' };
  } catch (error: any) { await connection.rollback(); return { success: false, message: error.message }; }
  finally { connection.release(); }
}

const updatePersonnelSchema = z.object({
  name: z.string().min(3),
  rank: z.string(),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.date().optional(),
  user: z.string(),
});

export async function updatePersonnel(personnelId: string, data: unknown) {
  const validation = updatePersonnelSchema.safeParse(data);
  if (!validation.success) return { success: false, message: validation.error.errors[0].message };
  const { name, rank, discordUsername, phoneNumber, bankAccount, hireDate, user } = validation.data;
  
  const hasPermission = await checkPermissions(user, 'MANAGE_EMPLOYEES');
  if (!hasPermission) return { success: false, message: 'Unauthorized' };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
        'UPDATE personnel SET name = ?, rank = ?, discord_username = ?, phone_number = ?, bank_account = ?, hire_date = ? WHERE id = ?', 
        [name, rank, discordUsername || null, phoneNumber || null, bankAccount || null, hireDate || null, personnelId]
    );
    await syncUserRoles(connection, name, rank);
    await logUserAction(user, "Update Personnel", `Updated ${name}.`, connection);
    await connection.commit();
    revalidatePath('/roster');
    return { success: true, message: 'Updated' };
  } catch (error: any) { await connection.rollback(); return { success: false, message: 'Update failed' }; }
  finally { connection.release(); }
}

const addPersonnelSchema = z.object({
  name: z.string().min(3).regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Name must be IC format"),
  rank: z.string({ required_error: "Rank required" }),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.date().default(() => new Date()),
  user: z.string(),
});

export async function addPersonnel(data: unknown) {
    const validation = addPersonnelSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { name, rank, discordUsername, phoneNumber, bankAccount, hireDate, user } = validation.data;
    
    const hasPermission = await checkPermissions(user, 'HIRE_EMPLOYEES');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const personnelId = crypto.randomUUID();
        const matchedUserId = await syncUserRoles(connection, name, rank);
        await connection.query(
            'INSERT INTO personnel (id, name, rank, department, discord_username, phone_number, bank_account, hire_date, status, loa_until, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [personnelId, name, rank, 'General', discordUsername || null, phoneNumber || null, bankAccount || null, hireDate, 'Active', null, matchedUserId]
        );
        await logEvent(name, 'Hired', `Hired as ${rank}`, connection);
        await logUserAction(user, "Add Personnel", `Added ${name} to the roster.`, connection);
        await sendHireWebhook(validation.data);
        await connection.commit();
        revalidatePath('/roster');
        return { success: true, message: `${name} added.` };
    } catch (error: any) { await connection.rollback(); return { success: false, message: 'Database failed' }; }
    finally { connection.release(); }
}

export async function rehirePersonnel(data: any) {
    const { archivedId, name, rank, discordUsername, user } = data;
    const hasPermission = await checkPermissions(user, 'HIRE_EMPLOYEES');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM archived_personnel WHERE id = ?', [archivedId]);
        const matchedUserId = await syncUserRoles(connection, name, rank);
        const personnelId = crypto.randomUUID();
        await connection.query(
            'INSERT INTO personnel (id, name, rank, department, discord_username, hire_date, status, is_rehired, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [personnelId, name, rank, 'General', discordUsername || null, new Date(), 'Active', true, matchedUserId]
        );
        await logEvent(name, 'Rehired', `Rehired as ${rank}`, connection);
        await logUserAction(user, "Rehire Personnel", `Rehired ${name}.`, connection);
        await sendHireWebhook({ name, rank, discordUsername }, true);
        await connection.commit();
        revalidatePath('/roster');
        return { success: true, message: `${name} rehired.` };
    } catch (error: any) { await connection.rollback(); return { success: false, message: 'Rehire failed' }; }
    finally { connection.release(); }
}

const updateSelfSchema = z.object({
    discordUsername: z.string().optional(),
    phoneNumber: z.string().optional(),
    bankAccount: z.string().optional(),
    username: z.string(),
});

export async function updateSelfPersonnelInfo(data: unknown) {
    const validation = updateSelfSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { discordUsername, phoneNumber, bankAccount, username } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE personnel SET discord_username = ?, phone_number = ?, bank_account = ? WHERE UPPER(name) = UPPER(?)',
            [discordUsername || null, phoneNumber || null, bankAccount || null, username.trim()]
        );
        await logUserAction(username, 'Update Profile', 'Updated personal contact and bank information.', connection);
        await connection.commit();
        revalidatePath(`/users/${encodeURIComponent(username)}`);
        revalidatePath('/roster');
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
