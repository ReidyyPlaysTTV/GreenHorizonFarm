
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import type { StaffIncident, FarmProduct, ManagerPlan, PromotionSuggestion, CeoChatMessage } from '../types';

const incidentSchema = z.object({
    personnel_name: z.string().min(1, "Personnel name is required."),
    reason: z.string().min(5, "Detailed reason is required."),
    issued_by: z.string(),
});

export async function addStaffIncident(data: unknown) {
    const validation = incidentSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { personnel_name, reason, issued_by } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const id = crypto.randomUUID();
        await connection.query(
            'INSERT INTO staff_incidents (id, personnel_name, reason, issued_by) VALUES (?, ?, ?, ?)',
            [id, personnel_name, reason, issued_by]
        );
        await logUserAction(issued_by, "Staff Disciplinary", `Issued disciplinary action to ${personnel_name}.`, connection);
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

const productSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    price: z.coerce.number().min(0),
});

export async function addFarmProduct(data: unknown, user: string) {
    const validation = productSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { name, category, price } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'INSERT INTO farm_products (id, name, category, price) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), name, category, price]
        );
        await logUserAction(user, "Manage Products", `Added product: ${name}`, connection);
        await connection.commit();
        revalidatePath('/manager');
        revalidatePath('/ceo');
        revalidatePath('/farmers');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database failure.' };
    } finally {
        connection.release();
    }
}

const planSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    author: z.string(),
});

export async function addManagerPlan(data: unknown) {
    const validation = planSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { title, content, author } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'INSERT INTO manager_plans (id, title, content, author, status) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), title, content, author, 'Pending']
        );
        await logUserAction(author, "Management Strategy", `Created plan: ${title}`, connection);
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

const promotionSchema = z.object({
    personnel_name: z.string().min(1),
    suggested_rank: z.string().min(1),
    reason: z.string().min(1),
    suggested_by: z.string(),
});

export async function addPromotionSuggestion(data: unknown) {
    const validation = promotionSchema.safeParse(data);
    if (!validation.success) return { success: false, message: validation.error.errors[0].message };
    const { personnel_name, suggested_rank, reason, suggested_by } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'INSERT INTO promotion_suggestions (id, personnel_name, suggested_rank, reason, suggested_by, status) VALUES (?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), personnel_name, suggested_rank, reason, suggested_by, 'Pending']
        );
        await logUserAction(suggested_by, "Staff Promotion Suggestion", `Suggested ${personnel_name} for ${suggested_rank}.`, connection);
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

export async function getManagerData() {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [incidents] = await connection.query('SELECT * FROM staff_incidents ORDER BY incident_date DESC');
        const [products] = await connection.query('SELECT * FROM farm_products ORDER BY category, name');
        const [plans] = await connection.query('SELECT * FROM manager_plans ORDER BY created_at DESC');
        const [promotions] = await connection.query('SELECT * FROM promotion_suggestions ORDER BY created_at DESC');

        return {
            staffIncidents: (incidents as any[]).map(i => ({ ...i, incident_date: new Date(i.incident_date) })),
            farmProducts: products as FarmProduct[],
            managerPlans: (plans as any[]).map(p => ({ ...p, created_at: new Date(p.created_at) })),
            promotionSuggestions: (promotions as any[]).map(p => ({ ...p, created_at: new Date(p.created_at) })),
        };
    } finally {
        connection.release();
    }
}

// CEO Specific Actions
export async function reviewPromotionSuggestion(id: string, status: 'Approved' | 'Rejected', feedback: string, ceo: string) {
    const hasPerm = await checkPermissions(ceo, 'ACCESS_CEO_PORTAL');
    if (!hasPerm) return { success: false, message: "CEO Access Required" };

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE promotion_suggestions SET status = ?, feedback = ? WHERE id = ?',
            [status, feedback, id]
        );
        await logUserAction(ceo, "Executive Decision", `${status} promotion suggestion ${id} with feedback: ${feedback}`, connection);
        await connection.commit();
        revalidatePath('/ceo');
        revalidatePath('/manager');
        return { success: true };
    } catch (e) {
        await connection.rollback();
        return { success: false, message: "Update failed" };
    } finally {
        connection.release();
    }
}

export async function reviewManagerPlan(id: string, status: 'Approved' | 'Rejected', feedback: string, ceo: string) {
    const hasPerm = await checkPermissions(ceo, 'ACCESS_CEO_PORTAL');
    if (!hasPerm) return { success: false, message: "CEO Access Required" };

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE manager_plans SET status = ?, feedback = ? WHERE id = ?',
            [status, feedback, id]
        );
        await logUserAction(ceo, "Executive Decision", `${status} manager plan ${id} with feedback: ${feedback}`, connection);
        await connection.commit();
        revalidatePath('/ceo');
        revalidatePath('/manager');
        return { success: true };
    } catch (e) {
        await connection.rollback();
        return { success: false, message: "Update failed" };
    } finally {
        connection.release();
    }
}

export async function sendCeoChatMessage(message: string, author: string) {
    const connection = await db.getConnection();
    try {
        await connection.query(
            'INSERT INTO ceo_chat (id, author, message) VALUES (?, ?, ?)',
            [crypto.randomUUID(), author, message]
        );
        revalidatePath('/ceo');
        return { success: true };
    } finally {
        connection.release();
    }
}

export async function getCeoChatMessages(): Promise<CeoChatMessage[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM ceo_chat ORDER BY created_at DESC LIMIT 50');
        return (rows as any[]).map(r => ({ ...r, created_at: new Date(r.created_at) }));
    } catch (e) {
        return [];
    } finally {
        connection.release();
    }
}
