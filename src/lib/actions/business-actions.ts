
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import type { Business } from '../types';

export async function getBusinesses(): Promise<Business[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM businesses ORDER BY name ASC');
        return (rows as any[]).map(row => ({
            ...row,
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch businesses:", error);
        return [];
    } finally {
        connection.release();
    }
}

const businessSchema = z.object({
    name: z.string().min(1, "Name is required."),
    bank_account: z.string().optional(),
});

export async function addBusiness(data: unknown, user: string) {
    const validation = businessSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { name, bank_account } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'INSERT INTO businesses (id, name, bank_account) VALUES (?, ?, ?)',
            [crypto.randomUUID(), name, bank_account || null]
        );
        await logUserAction(user, "Add Business", `Registered business: ${name} (Account: ${bank_account || 'N/A'})`, connection);
        await connection.commit();
        revalidatePath('/manager');
        revalidatePath('/ceo');
        revalidatePath('/farmers');
        revalidatePath('/order');
        return { success: true };
    } catch (error: any) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return { success: false, message: "Business name already exists." };
        return { success: false, message: 'Database failure.' };
    } finally {
        connection.release();
    }
}

export async function updateBusiness(id: string, data: unknown, user: string) {
    const validation = businessSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { name, bank_account } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE businesses SET name = ?, bank_account = ? WHERE id = ?',
            [name, bank_account || null, id]
        );
        await logUserAction(user, "Update Business", `Updated business details: ${name}`, connection);
        await connection.commit();
        revalidatePath('/manager');
        revalidatePath('/ceo');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database failure.' };
    } finally {
        connection.release();
    }
}

export async function deleteBusiness(id: string, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM businesses WHERE id = ?', [id]);
        await logUserAction(user, "Delete Business", `Removed business entry with ID: ${id}`, connection);
        await connection.commit();
        revalidatePath('/manager');
        revalidatePath('/ceo');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database failure.' };
    } finally {
        connection.release();
    }
}
