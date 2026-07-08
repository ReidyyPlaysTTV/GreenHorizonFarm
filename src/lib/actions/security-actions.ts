
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

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const id = crypto.randomUUID();
            await connection.query(
                'INSERT INTO security_time_logs (id, user, hours, description, date) VALUES (?, ?, ?, ?, ?)',
                [id, user || 'Unknown Staff', hours, description, date]
            );

            await logUserAction(user, "Log Security Hours", `Logged ${hours} hours for ${date}.`, connection);

            await connection.commit();
            revalidatePath('/security');
            return { success: true, message: 'Hours logged successfully.' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to log security hours:", error);
        return { success: false, message: 'Database link failure. Please try again.' };
    }
}

const incidentSchema = z.object({
  title: z.string().min(5, "Title must be descriptive."),
  description: z.string().min(10, "Provide detailed description."),
  location: z.string().min(3, "Specify a location."),
  pd_called: z.boolean().default(false),
  injured_details: z.string().optional(),
  user: z.string(),
});

export async function submitSecurityIncident(data: unknown) {
    const validation = incidentSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { title, description, location, pd_called, injured_details, user } = validation.data;

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const id = crypto.randomUUID();
            await connection.query(
                'INSERT INTO security_incidents (id, title, description, location, pd_called, injured_details, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, title, description, location, pd_called, injured_details || null, user]
            );

            await logUserAction(user, "Report Security Incident", `Reported incident: ${title} at ${location}`, connection);

            await connection.commit();
            revalidatePath('/security');
            return { success: true, message: 'Incident reported successfully.' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to report incident:", error);
        return { success: false, message: 'Database link failure.' };
    }
}

export async function getSecurityTimeLogs(): Promise<SecurityTimeLog[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM security_time_logs ORDER BY date DESC, created_at DESC LIMIT 50');
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(row => ({
                ...row,
                date: new Date(row.date),
                created_at: new Date(row.created_at)
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to fetch time logs:", error);
        return [];
    }
}

export async function getSecurityIncidents(): Promise<SecurityIncident[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 50');
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(row => ({
                ...row,
                pd_called: !!row.pd_called,
                created_at: new Date(row.created_at)
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to fetch incidents:", error);
        return [];
    }
}
