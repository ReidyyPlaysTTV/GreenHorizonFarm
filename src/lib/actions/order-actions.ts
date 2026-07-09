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

const PRODUCT_EMOJIS: Record<string, string> = {
    'milk': '🥛',
    'egg': '🥚',
    'bread': '🍞',
    'carrot': '🥕',
    'tomato': '🍅',
    'lettuce': '🥬',
    'potato': '🥔',
    'wheat': '🌾',
    'meat': '🥩',
    'chicken': '🍗',
    'beef': '🥩',
    'pork': '🥓',
    'seed': '🌱',
    'flower': '🌸',
    'water': '💧',
    'fertilizer': '🧪',
    'logistics': '🚚',
    'delivery': '📦',
    'hay': '🌾',
    'orange': '🍊',
    'lemon': '🍋',
    'honey': '🍯',
};

function getProductEmoji(name: string) {
    const n = name.toLowerCase();
    for (const [key, emoji] of Object.entries(PRODUCT_EMOJIS)) {
        if (n.includes(key)) return emoji;
    }
    return '📦';
}

async function sendOrderWebhook(order: any) {
    if (!DISCORD_WEBHOOK_URL) {
        console.warn("Order Ledger Webhook URL not configured.");
        return;
    }
    try {
        const total = Number(order.total_price);
        const staffCut = Number(order.employee_cut_value);
        const businessProfit = total - staffCut;
        
        const itemsList = order.items_sold.map((i: any) => 
            `${getProductEmoji(i.product_name)} **${i.quantity}x** ${i.product_name}`
        ).join('\n');
        
        const teamList = [order.user, ...order.collaborators].join(', ');
        
        const payload = {
            embeds: [{
                title: "🚜 Farm Operation Finalized",
                description: `A supply requisition has been successfully fulfilled for **${order.business_name}**.`,
                color: 3066993, // Green Horizon Emerald
                fields: [
                    { 
                        name: "💰 Financial Breakdown", 
                        value: `**Order Total:** \`$${total.toLocaleString()}\`\n**Business Profit (40%):** \`$${businessProfit.toLocaleString()}\`\n**Staff Pool (60%):** \`$${staffCut.toLocaleString()}\``,
                        inline: false 
                    },
                    { 
                        name: "📦 Supply Manifest", 
                        value: itemsList || "No items recorded.", 
                        inline: true 
                    },
                    { 
                        name: "👥 Field Team", 
                        value: `**Lead:** ${order.user}\n**Support:** ${order.collaborators.length > 0 ? order.collaborators.join(', ') : 'Solo Operation'}`, 
                        inline: true 
                    },
                    {
                        name: "🕒 Timeline",
                        value: `**Started:** ${new Date(order.created_at).toLocaleTimeString()}\n**Finished:** ${new Date().toLocaleTimeString()}`,
                        inline: false
                    }
                ],
                footer: { text: "Green Horizon Logistics Engine • Ledger Update" },
                timestamp: new Date().toISOString()
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
        const itemsList = order.items.map((i: any) => 
            `${getProductEmoji(i.product_name)} **${i.quantity}x** ${i.product_name}`
        ).join('\n');
        
        const payload = {
            embeds: [{
                title: "📩 New Business Requisition",
                color: 3447003, // Logistics Blue
                description: `A new client has requested supplies via the portal.`,
                fields: [
                    { name: "Client", value: `**${order.business_name}**`, inline: true },
                    { name: "Required Yield", value: itemsList || "No items listed" },
                    { name: "Status", value: "🔴 Awaiting Acceptance", inline: true },
                    { name: "Portal Link", value: "[Process Requisition](https://green-horizon-farm.vercel.app/farmers)" }
                ],
                footer: { text: "Green Horizon Logistics Hub" },
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
            items_sold: typeof order.items_sold === 'string' ? JSON.parse(order.items_sold) : order.items_sold,
            collaborators: typeof order.collaborators === 'string' ? JSON.parse(order.collaborators) : order.collaborators,
            user: order.completed_by
        };
        await sendOrderWebhook(formattedOrder);

        revalidatePath('/farmers');
        revalidatePath('/security');
        revalidatePath('/finances');
        revalidatePath('/ceo');
        revalidatePath('/manager');
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
