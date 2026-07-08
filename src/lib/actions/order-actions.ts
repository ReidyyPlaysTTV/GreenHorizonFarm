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

const DISCORD_WEBHOOK_URL = process.env.DISCORD_ORDER_LEDGER_WEBHOOK;
const BUSINESS_ORDER_WEBHOOK = process.env.DISCORD_BUSINESS_ORDER_WEBHOOK;

async function sendOrderWebhook(order: any) {
    if (!DISCORD_WEBHOOK_URL) {
        console.warn("Order Ledger Webhook URL not configured.");
        return;
    }
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

async function sendBusinessOrderWebhook(order: any) {
    if (!BUSINESS_ORDER_WEBHOOK) {
        console.warn("Business Order Webhook URL not configured.");
        return;
    }
    try {
        const itemsList = order.items.map((i: any) => `- ${i.quantity}x ${i.product_name}`).join('\n');
        
        const payload = {
            embeds: [{
                title: "🚜 New Business Requisition Received",
                color: 3447003, // Blue-ish for awareness
                description: `A new supply request has been submitted to the logistics network.`,
                fields: [
                    { name: "Business Name", value: `**${order.business_name}**`, inline: true },
                    { name: "Items Requested", value: itemsList || "No items listed" },
                    { name: "Portal Link", value: "[Farmers Portal](https://green-horizon-farm.web.app/farmers)" }
                ],
                footer: { text: "Green Horizon Logistics Engine" },
                timestamp: new Date().toISOString()
            }]
        };

        await fetch(BUSINESS_ORDER_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error("Failed to send business order webhook:", error);
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
                    employee_cut_value, employee_cut_percentage, completed_by, collaborators, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, business_name, JSON.stringify(items_sold), discount_amount, total_price, logistics_used, employee_cut_value, employee_cut_percentage, user, JSON.stringify(collaborators), 'Active']
            );

            if (businessOrderId) {
                await connection.query("UPDATE business_orders SET status = 'Accepted' WHERE id = ?", [businessOrderId]);
            }

            await logUserAction(user, "Start Operation", `Started supply operation for ${business_name}. Security alert issued.`, connection);
            await connection.commit();

            revalidatePath('/farmers');
            revalidatePath('/security');
            return { success: true, message: 'Operation started. Security has been notified.' };
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

export async function completeDetailedOrder(orderId: string, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [rows]: any = await connection.query("SELECT * FROM detailed_farm_orders WHERE id = ?", [orderId]);
        if (rows.length === 0) throw new Error("Order not found.");
        const order = rows[0];

        await connection.query("UPDATE detailed_farm_orders SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?", [orderId]);
        
        await logUserAction(user, "Complete Operation", `Finalized supply run for ${order.business_name}. Billing recorded.`, connection);
        
        await connection.commit();
        
        // Notify Discord only on completion
        const formattedOrder = {
            ...order,
            items_sold: JSON.parse(order.items_sold),
            collaborators: JSON.parse(order.collaborators),
            user: order.completed_by
        };
        await sendOrderWebhook(formattedOrder);

        revalidatePath('/farmers');
        revalidatePath('/security');
        revalidatePath('/finances');
        return { success: true, message: 'Operation completed and billed.' };
    } catch (e) {
        await connection.rollback();
        return { success: false, message: 'Update failed.' };
    } finally {
        connection.release();
    }
}

export async function cancelDetailedOrder(orderId: string, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE detailed_farm_orders SET status = 'Cancelled' WHERE id = ?", [orderId]);
        await logUserAction(user, "Cancel Operation", `Aborted farm operation ID: ${orderId}`, connection);
        await connection.commit();
        revalidatePath('/farmers');
        revalidatePath('/security');
        return { success: true, message: 'Operation cancelled.' };
    } finally {
        connection.release();
    }
}

export async function getDetailedOrders(): Promise<DetailedFarmOrder[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM detailed_farm_orders WHERE status = "Completed" ORDER BY created_at DESC LIMIT 50');
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(row => ({
                ...row,
                items_sold: typeof row.items_sold === 'string' ? JSON.parse(row.items_sold) : (row.items_sold || []),
                collaborators: typeof row.collaborators === 'string' ? JSON.parse(row.collaborators) : (row.collaborators || []),
                logistics_used: !!row.logistics_used,
                created_at: new Date(row.created_at),
                completed_at: row.completed_at ? new Date(row.completed_at) : null
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}

export async function getActiveOrders(): Promise<DetailedFarmOrder[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM detailed_farm_orders WHERE status = "Active" ORDER BY created_at DESC');
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
    business_name: z.string().min(1, "Company name is required."),
    items: z.array(z.object({
        product_id: z.string().min(1, "Product selection required"),
        product_name: z.string(),
        quantity: z.number().min(1),
        price_at_sale: z.number()
    })).min(1, "At least one item is required.")
});

export async function submitBusinessOrder(data: unknown) {
    const validation = businessOrderSchema.safeParse(data);
    if (!validation.success) {
        console.error("Validation Error (submitBusinessOrder):", validation.error.format());
        return { success: false, message: validation.error.errors[0]?.message || "Invalid order data." };
    }
    
    try {
        const result = await Promise.race([
            (async () => {
                await ensureDbInitialized();
                const connection = await db.getConnection();
                try {
                    const id = crypto.randomUUID();
                    await connection.query(
                        "INSERT INTO business_orders (id, business_name, items, status) VALUES (?, ?, ?, ?)",
                        [id, validation.data.business_name, JSON.stringify(validation.data.items), 'Pending']
                    );
                    
                    await sendBusinessOrderWebhook(validation.data);
                    
                    return { success: true, orderId: id };
                } finally {
                    connection.release();
                }
            })(),
            new Promise<{ success: false, message: string }>((_, reject) => 
                setTimeout(() => reject(new Error('ETIMEDOUT')), 5000)
            )
        ]);

        revalidatePath('/farmers');
        return result;
    } catch (e: any) {
        console.error("Transmission Failure (submitBusinessOrder):", e.message);
        return { 
            success: false, 
            message: e.message === 'ETIMEDOUT' 
                ? "Database link is slow. Please click transmit again." 
                : "Logistics network currently unreachable." 
        };
    }
}

export async function cancelBusinessOrder(orderId: string, user: string) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE business_orders SET status = 'Cancelled' WHERE id = ?", [orderId]);
        await logUserAction(user, "Cancel Business Order", `Rejected business request ID: ${orderId}`, connection);
        await connection.commit();
        revalidatePath('/farmers');
        return { success: true, message: 'Order rejected and removed from queue.' };
    } catch (e) {
        await connection.rollback();
        return { success: false, message: 'Failed to update order status.' };
    } finally {
        connection.release();
    }
}

async function cleanupExpiredOrders(connection: any) {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    await connection.query(
        "UPDATE business_orders SET status = 'Expired' WHERE status = 'Pending' AND created_at < ?",
        [fiveHoursAgo]
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
                "SELECT * FROM detailed_farm_orders WHERE (completed_by = ? OR JSON_CONTAINS(collaborators, JSON_QUOTE(?))) AND status = 'Completed' ORDER BY created_at DESC LIMIT 20",
                [name, name]
            );
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(row => ({
                ...row,
                items_sold: typeof row.items_sold === 'string' ? JSON.parse(row.items_sold) : (row.items_sold || []),
                collaborators: typeof row.collaborators === 'string' ? JSON.parse(row.collaborators) : (row.collaborators || []),
                logistics_used: !!row.logistics_used,
                created_at: new Date(row.created_at),
                completed_at: row.completed_at ? new Date(row.completed_at) : null
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}
