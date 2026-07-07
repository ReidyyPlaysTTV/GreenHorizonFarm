
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import type { FarmEvent } from '../types';

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "A detailed plan is required."),
  revenue: z.coerce.number().min(0, "Revenue cannot be negative."),
  event_date: z.date({ required_error: "Please select a date and time." }),
  status: z.enum(['Scheduled', 'Cancelled', 'Completed']).default('Scheduled'),
  user: z.string(),
});

export async function submitFarmEvent(data: unknown) {
    const validation = eventSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { title, description, revenue, event_date, status, user } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const id = crypto.randomUUID();
        await connection.query(
            'INSERT INTO farm_events (id, title, description, revenue, event_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, title, description, revenue, event_date, status]
        );

        await logUserAction(user, "Create Event", `Planned new event: ${title} on ${event_date.toLocaleDateString()}`, connection);

        await connection.commit();
        revalidatePath('/events');
        return { success: true, message: 'Event scheduled successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to create farm event:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function updateFarmEvent(id: string, data: unknown) {
    const validation = eventSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { title, description, revenue, event_date, status, user } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'UPDATE farm_events SET title = ?, description = ?, revenue = ?, event_date = ?, status = ? WHERE id = ?',
            [title, description, revenue, event_date, status, id]
        );

        await logUserAction(user, "Update Event", `Updated event: ${title}`, connection);

        await connection.commit();
        revalidatePath('/events');
        return { success: true, message: 'Event updated successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to update farm event:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function cancelFarmEvent(id: string, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query("UPDATE farm_events SET status = 'Cancelled' WHERE id = ?", [id]);
        await logUserAction(user, "Cancel Event", `Cancelled event with ID: ${id}`, connection);

        await connection.commit();
        revalidatePath('/events');
        return { success: true, message: 'Event cancelled successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to cancel farm event:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function deleteFarmEvent(id: string, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM farm_events WHERE id = ?", [id]);
        await logUserAction(user, "Delete Event", `Permanently deleted event: ${id}`, connection);
        await connection.commit();
        revalidatePath('/events');
        return { success: true, message: 'Event deleted successfully.' };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function getFarmEvents(): Promise<FarmEvent[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query("SELECT * FROM farm_events ORDER BY event_date ASC");
        if (!Array.isArray(rows)) return [];
        return (rows as any[]).map(row => ({
            ...row,
            event_date: new Date(row.event_date),
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch farm events:", error);
        return [];
    } finally {
        connection.release();
    }
}
