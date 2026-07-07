
'use server';

import { z } from 'zod';
import db from '../db';
import { revalidatePath } from 'next/cache';
import type { DetailedFarmOrder } from '../types';
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
});

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1523878492029194361/gqg_zA8_TQo10FUQBeX2dsecgcKtHQKC2aWyZyx9_t1bHqFu9jtjoSw2G-L7HLRGfTzo";

async function sendOrderWebhook(order: any) {
    try {
        const itemsList = order.items_sold.map((i: any) => `- ${i.quantity}x ${i.product_name}`).join('\n');
        
        const payload = {
            embeds: [{
                title: "🚜 New Farm Order Completed",
                color: 3066993, // Green Horizon Green
                fields: [
                    { name: "Client / Business", value: `**${order.business_name}**`, inline: true },
                    { name: "Total Paid", value: `\`$${order.total_price.toLocaleString()}\``, inline: true },
                    { name: "Completed By", value: order.user, inline: true },
                    { name: "Yield Details", value: itemsList || "No items listed" },
                    { name: "Logistics Used", value: order.logistics_used ? "✅ Yes" : "❌ No", inline: true },
                    { name: "Employee Commission", value: `$${order.employee_cut_value.toLocaleString()} (${order.employee_cut_percentage}%)`, inline: true },
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
        logistics_used, employee_cut_value, employee_cut_percentage, user 
    } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const id = crypto.randomUUID();
        await connection.query(
            `INSERT INTO detailed_farm_orders (
                id, business_name, items_sold, discount_amount, total_price, logistics_used, 
                employee_cut_value, employee_cut_percentage, completed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, business_name, JSON.stringify(items_sold), discount_amount, total_price, logistics_used, 
                employee_cut_value, employee_cut_percentage, user
            ]
        );

        await logUserAction(user, "Submit Order", `Submitted a completed order for ${business_name} totalling $${total_price}.`, connection);

        await connection.commit();
        
        // Trigger Discord Notification
        await sendOrderWebhook(validation.data);

        revalidatePath('/farmers');
        revalidatePath('/manager');
        revalidatePath('/ceo');
        revalidatePath('/finances');
        return { success: true, message: 'Order submitted successfully.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to submit detailed order:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function getDetailedOrders(): Promise<DetailedFarmOrder[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM detailed_farm_orders ORDER BY created_at DESC LIMIT 50');
        if (!Array.isArray(rows)) return [];
        return (rows as any[]).map(row => ({
            ...row,
            items_sold: typeof row.items_sold === 'string' ? JSON.parse(row.items_sold) : (row.items_sold || []),
            logistics_used: !!row.logistics_used,
            created_at: new Date(row.created_at)
        }));
    } catch (error) {
        console.error("Failed to fetch detailed orders:", error);
        return [];
    } finally {
        connection.release();
    }
}
