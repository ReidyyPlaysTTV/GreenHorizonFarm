
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import type { FarmProcedure } from '../types';

const procedureSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  content: z.string().min(10, "Content must be detailed."),
  image_url: z.string().url("Invalid image URL.").optional().or(z.literal('')),
  author_name: z.string(),
  author_rank: z.string(),
  user: z.string(), // Logged in username for audit log
});

export async function addFarmProcedure(data: unknown) {
    const validation = procedureSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { title, content, image_url, author_name, author_rank, user } = validation.data;

    const hasPermission = await checkPermissions(user, 'MANAGE_PROCEDURES');
    if (!hasPermission) {
        return { success: false, message: 'Unauthorized.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const id = crypto.randomUUID();
        await connection.query(
            'INSERT INTO farm_procedures (id, title, content, image_url, author_name, author_rank) VALUES (?, ?, ?, ?, ?, ?)',
            [id, title, content, image_url || null, author_name, author_rank]
        );

        await logUserAction(user, "Create Procedure", `Published new farm guideline: ${title}`, connection);

        await connection.commit();
        revalidatePath('/sops');
        return { success: true, message: 'Procedure added successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to add farm procedure:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function deleteFarmProcedure(id: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_PROCEDURES');
    if (!hasPermission) {
        return { success: false, message: 'Unauthorized.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM farm_procedures WHERE id = ?", [id]);
        await logUserAction(user, "Delete Procedure", `Removed procedure with ID: ${id}`, connection);
        await connection.commit();
        revalidatePath('/sops');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function getFarmProcedures(): Promise<FarmProcedure[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query("SELECT * FROM farm_procedures ORDER BY created_at DESC");
        if (!Array.isArray(rows)) return [];
        return (rows as any[]).map(row => ({
            ...row,
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch procedures:", error);
        return [];
    } finally {
        connection.release();
    }
}
