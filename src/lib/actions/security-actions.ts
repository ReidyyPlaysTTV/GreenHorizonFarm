
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import type { SecurityIncident, SecurityTimeLog } from '../types';

const timeLogSchema = z.object({
  hours: z.coerce.number().min(0.5, "Must log at least 30 minutes."),
  description: z.string().min(5, "Please provide a brief description of activities."),
  date: z.string(),
  user: z.string(),
});

export async function submitSecurityTimeLog(data: unknown) {
    const validation = timeLogSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { hours, description, date, user } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'INSERT INTO security_time_logs (id, user, hours, description, date) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), user, hours, description, date]
        );

        await logUserAction(user, "Log Security Hours", `Logged ${hours} hours for ${date}.`, connection);

        await connection.commit();
        revalidatePath('/security');
        return { success: true, message: 'Hours logged successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to log security hours:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

const incidentSchema = z.object({
  title: z.string().min(5, "Title must be descriptive."),
  description: z.string().min(10, "Provide detailed description."),
  location: z.string().min(3, "Specify a location."),
  user: z.string(),
});

export async function submitSecurityIncident(data: unknown) {
    const validation = incidentSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { title, description, location, user } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'INSERT INTO security_incidents (id, title, description, location, reported_by) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), title, description, location, user]
        );

        await logUserAction(user, "Report Security Incident", `Reported incident: ${title} at ${location}`, connection);

        await connection.commit();
        revalidatePath('/security');
        return { success: true, message: 'Incident reported successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to report incident:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function getSecurityTimeLogs(): Promise<SecurityTimeLog[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM security_time_logs ORDER BY date DESC, created_at DESC LIMIT 50');
        if (!Array.isArray(rows)) return [];
        return (rows as any[]).map(row => ({
            ...row,
            date: new Date(row.date),
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch time logs:", error);
        return [];
    } finally {
        connection.release();
    }
}

export async function getSecurityIncidents(): Promise<SecurityIncident[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 50');
        if (!Array.isArray(rows)) return [];
        return (rows as any[]).map(row => ({
            ...row,
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch incidents:", error);
        return [];
    } finally {
        connection.release();
    }
}
