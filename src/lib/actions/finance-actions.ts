
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import type { FarmTransaction } from '../types';

const BASE_BALANCE_KEY = 'base_bank_balance';

export async function getBaseBalance(): Promise<number> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT setting_value FROM financial_settings WHERE setting_key = ?', [BASE_BALANCE_KEY]);
        if (Array.isArray(rows) && rows.length > 0) {
            return Number((rows[0] as any).setting_value);
        }
        return 0;
    } catch (error) {
        console.error("Failed to get base balance:", error);
        return 0;
    } finally {
        connection.release();
    }
}

export async function updateBaseBalance(amount: number, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'INSERT INTO financial_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [BASE_BALANCE_KEY, amount.toString(), amount.toString()]
        );
        await logUserAction(user, "Update Finances", `Adjusted base bank balance to $${amount.toLocaleString()}.`, connection);
        await connection.commit();
        revalidatePath('/finances');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

const transactionSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be positive."),
    category: z.enum(['Income', 'Expense', 'Expenditure', 'Employee Cut']),
    description: z.string().min(3, "Please provide a description."),
    user: z.string(),
});

export async function addFarmTransaction(data: unknown) {
    const validation = transactionSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { amount, category, description, user } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const id = crypto.randomUUID();
        await connection.query(
            'INSERT INTO farm_transactions (id, amount, category, description) VALUES (?, ?, ?, ?)',
            [id, amount, category, description]
        );
        await logUserAction(user, "Add Transaction", `Recorded ${category}: ${description} ($${amount.toLocaleString()})`, connection);
        await connection.commit();
        revalidatePath('/finances');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function getFarmTransactions(): Promise<FarmTransaction[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM farm_transactions ORDER BY transaction_date DESC');
        if (!Array.isArray(rows)) return [];
        return (rows as any[]).map(row => ({
            ...row,
            transaction_date: new Date(row.transaction_date),
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return [];
    } finally {
        connection.release();
    }
}

/**
 * Calculates staff earnings by cross-referencing payout statuses.
 */
export async function getPayrollSummary() {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [personnel]: any = await connection.query('SELECT name, phone_number, bank_account, rank FROM personnel');
        
        // Sum total earned across all payouts (Pending + Paid)
        const [payouts]: any = await connection.query('SELECT personnel_name, amount, status FROM order_payouts');
        
        const summary: Record<string, { earned: number, phone: string, bank: string, rank: string }> = {};
        
        personnel.forEach((p: any) => {
            summary[p.name] = { 
                earned: 0, 
                phone: p.phone_number || 'NOT LISTED', 
                bank: p.bank_account || 'NO ACCOUNT',
                rank: p.rank
            };
        });

        payouts.forEach((p: any) => {
            if (summary[p.personnel_name]) {
                // For payroll registry, we usually show total lifetime earned or total currently owed
                // Let's show total amount that HAS NOT been marked paid yet (Owed)
                if (p.status === 'Pending') {
                    summary[p.personnel_name].earned += Number(p.amount);
                }
            }
        });

        return Object.entries(summary).map(([name, data]) => ({
            name,
            ...data
        })).sort((a, b) => b.earned - a.earned);
    } catch (error) {
        console.error("Payroll calculation failed:", error);
        return [];
    } finally {
        connection.release();
    }
}
