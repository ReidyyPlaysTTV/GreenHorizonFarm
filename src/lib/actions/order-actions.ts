
'use server';

import { z } from 'zod';
import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import type { DetailedFarmOrder, BusinessOrder } from '../types';
import { logUserAction } from './audit-log-actions';

const orderSchema = z.object({
  business_name: z.string().min(1, "Business name is required."),
  items_sold: z.array(z.object({
    product_id: z.string(),
    product_name: z.string(),
    quantity: z.number().min(1),
    price_at_sale: z.number().min(0),
  })),
  discount_amount: z.coerce.number().min(0),
  total_price: z.coerce.number().min(0),
  logistics_used: z.boolean(),
  employee_cut_value: z.coerce.number().min(0),
  employee_cut_percentage: z.coerce.number().min(0).max(100),
  user: z.string(),
  collaborators: z.array(z.string()).default([]),
  businessOrderId: z.string().optional(),
});

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1523878492029194361/gqg_zA8_TQo10FUQBeX2dsecgcKtHQKC2aWyZyx9_t1bHqFu9jtjoSw2G-L7HLRGfTzo";

async function sendOrderWebhook(order: any) {
    try {
        const itemsList = order.items_sold.map((i: any) => `- ${i.quantity}x ${i.product_name}`).join('\n');
        const staffList = [order.user, ...order.collaborators].join(', ');
        
        const payload = {
            embeds: [{
                title: "🚜 New Farm Order Completed",
                color: 3066993, // Green Horizon Green
                fields: [
                    { name: "Client / Business", value: `**${order.business_name}**`, inline: true },
                    { name: "Total Paid", value: `\`$${order.total_price.toLocaleString()}\``, inline: true },
                    { name: "Staff Involved", value: staffList, inline: true },
                    { name: "Yield Details", value: itemsList || "No items listed" },
                    { name: "Logistics Used", value: order.logistics_used ? "✅ Yes" : "❌ No", inline: true },
                    { name: "Shared Commission", value: `$${order.employee_cut_value.toLocaleString()} (${order.employee_cut_percentage}%)`, inline: true },
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "Green Horizon Management System • Ledger Update" }
            }]
        };

        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error("Failed to send Discord webhook:", error);
    }
}

export async function submitDetailedOrder(data: unknown) {
    const validation = orderSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { 
        business_name, items_sold, discount_amount, total_price, 
        logistics_used, employee_cut_value, employee_cut_percentage, user,
        collaborators, businessOrderId
    } = validation.data;

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const id = crypto.randomUUID();
            await connection.query(
                `INSERT INTO detailed_farm_orders (
                    id, business_name, items_sold, discount_amount, total_price, logistics_used, 
                    employee_cut_value, employee_cut_percentage, completed_by, collaborators
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, business_name, JSON.stringify(items_sold), discount_amount, total_price, logistics_used, employee_cut_value, employee_cut_percentage, user, JSON.stringify(collaborators)]
            );

            if (businessOrderId) {
                await connection.query("UPDATE business_orders SET status = 'Completed' WHERE id = ?", [businessOrderId]);
            }

            await logUserAction(user, "Submit Order", `Submitted order for ${business_name}. Shared by ${collaborators.length + 1} staff.`, connection);
            await connection.commit();
            await sendOrderWebhook(validation.data);

            revalidatePath('/farmers');
            revalidatePath('/finances');
            return { success: true, message: 'Order submitted successfully.' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function getDetailedOrders(): Promise<DetailedFarmOrder[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM detailed_farm_orders ORDER BY created_at DESC LIMIT 50');
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(row => ({
                ...row,
                items_sold: typeof row.items_sold === 'string' ? JSON.parse(row.items_sold) : (row.items_sold || []),
                collaborators: typeof row.collaborators === 'string' ? JSON.parse(row.collaborators) : (row.collaborators || []),
                logistics_used: !!row.logistics_used,
                created_at: new Date(row.created_at)
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}

// Business Order Actions
const businessOrderSchema = z.object({
    business_name: z.string().min(1),
    items: z.array(z.object({
        product_id: z.string(),
        product_name: z.string(),
        quantity: z.number().min(1),
        price_at_sale: z.number()
    }))
});

export async function submitBusinessOrder(data: unknown) {
    const validation = businessOrderSchema.safeParse(data);
    if (!validation.success) return { success: false, message: "Invalid order data" };
    
    const connection = await db.getConnection();
    try {
        const id = crypto.randomUUID();
        await connection.query(
            "INSERT INTO business_orders (id, business_name, items, status) VALUES (?, ?, ?, ?)",
            [id, validation.data.business_name, JSON.stringify(validation.data.items), 'Pending']
        );
        return { success: true, orderId: id };
    } catch (e) {
        return { success: false, message: "Database error" };
    } finally {
        connection.release();
    }
}

/**
 * Checks for and marks business orders as 'Expired' if pending for > 3 hours.
 */
async function cleanupExpiredOrders(connection: any) {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    await connection.query(
        "UPDATE business_orders SET status = 'Expired' WHERE status = 'Pending' AND created_at < ?",
        [threeHoursAgo]
    );
}

export async function getPendingBusinessOrders(): Promise<BusinessOrder[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        await cleanupExpiredOrders(connection);
        const [rows] = await connection.query("SELECT * FROM business_orders WHERE status = 'Pending' ORDER BY created_at DESC");
        return (rows as any[]).map(r => ({
            ...r,
            items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
            created_at: new Date(r.created_at)
        }));
    } finally {
        connection.release();
    }
}

export async function getExpiredBusinessOrders(): Promise<BusinessOrder[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query("SELECT * FROM business_orders WHERE status = 'Expired' ORDER BY created_at DESC LIMIT 50");
        return (rows as any[]).map(r => ({
            ...r,
            items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
            created_at: new Date(r.created_at)
        }));
    } finally {
        connection.release();
    }
}

export async function getOrdersByStaff(name: string): Promise<DetailedFarmOrder[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query(
                "SELECT * FROM detailed_farm_orders WHERE completed_by = ? OR JSON_CONTAINS(collaborators, JSON_QUOTE(?)) ORDER BY created_at DESC LIMIT 20",
                [name, name]
            );
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(row => ({
                ...row,
                items_sold: typeof row.items_sold === 'string' ? JSON.parse(row.items_sold) : (row.items_sold || []),
                collaborators: typeof row.collaborators === 'string' ? JSON.parse(row.collaborators) : (row.collaborators || []),
                logistics_used: !!row.logistics_used,
                created_at: new Date(row.created_at)
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}
