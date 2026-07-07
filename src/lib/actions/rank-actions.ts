
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';
import type { Division, Rank } from '../types';
import { divisions } from '../data';
import type { Pool } from 'mysql2/promise';

async function createRanksTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS ranks (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            department VARCHAR(255) NOT NULL,
            sort_order INT NOT NULL,
            insignia_url VARCHAR(255),
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function getRanks(): Promise<Rank[]> {
    const connection = await db.getConnection();
    try {
        await createRanksTableIfNeeded(connection);
        const [rows] = await connection.query('SELECT * FROM ranks ORDER BY sort_order ASC');
        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as Rank[]).map(r => ({ ...r, sort_order: Number(r.sort_order) }));
    } catch (error) {
        console.error("Failed to fetch ranks:", error);
        return [];
    } finally {
        connection.release();
    }
}

const rankSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Position name must be at least 3 characters."),
  department: z.string(), // Division literal strings
  sort_order: z.coerce.number().int().min(1),
  insignia_url: z.string().url().optional().or(z.literal('')),
});

export async function addRank(data: unknown, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_RANKS');
    if (!hasPermission) {
        return { success: false, message: "You don't have permission to do that." };
    }
    const validation = rankSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { name, department, sort_order, insignia_url } = validation.data;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const id = crypto.randomUUID();
        await connection.query(
            'INSERT INTO ranks (id, name, department, sort_order, insignia_url) VALUES (?, ?, ?, ?, ?)',
            [id, name, department, sort_order, insignia_url]
        );
        await logUserAction(user, "Create Position", `Created new position: ${name}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/roster');
        return { success: true };
    } catch(e) {
        await connection.rollback();
        console.error(e);
        if (e instanceof Error && 'code' in e && (e as any).code === 'ER_DUP_ENTRY') {
            return { success: false, message: "A position with this name already exists." };
        }
        return { success: false, message: "Failed to create position." };
    } finally {
        connection.release();
    }
}

export async function updateRank(data: unknown, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_RANKS');
    if (!hasPermission) {
        return { success: false, message: "You don't have permission to do that." };
    }
    const validation = rankSchema.safeParse(data);
    if (!validation.success || !validation.data.id) {
        return { success: false, message: "Invalid data provided for update." };
    }
    const { id, name, department, sort_order, insignia_url } = validation.data;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE ranks SET name = ?, department = ?, sort_order = ?, insignia_url = ? WHERE id = ?',
            [name, department, sort_order, insignia_url, id]
        );
        await logUserAction(user, "Update Position", `Updated position: ${name}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/roster');
        return { success: true };
    } catch(e) {
        await connection.rollback();
        console.error(e);
        if (e instanceof Error && 'code' in e && (e as any).code === 'ER_DUP_ENTRY') {
            return { success: false, message: "A position with this name already exists." };
        }
        return { success: false, message: "Failed to update position." };
    } finally {
        connection.release();
    }
}

export async function deleteRank(id: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_RANKS');
    if (!hasPermission) {
        return { success: false, message: "You don't have permission to do that." };
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // Check if rank is in use
        const [personnel] = await connection.query('SELECT COUNT(*) as count FROM personnel WHERE rank = (SELECT name FROM ranks WHERE id = ?)', [id]);
        if (Array.isArray(personnel) && (personnel[0] as any).count > 0) {
            throw new Error("Cannot delete position. It is currently assigned to personnel.");
        }
        const [rank] = await connection.query('SELECT name FROM ranks WHERE id = ?', [id]);
        
        await connection.query('DELETE FROM ranks WHERE id = ?', [id]);
        
        const rankName = (rank as any)[0]?.name || `ID ${id}`;
        await logUserAction(user, "Delete Position", `Deleted position: ${rankName}`, connection);
        await connection.commit();
        
        revalidatePath('/admin');
        revalidatePath('/roster');
        return { success: true };
    } catch(e: any) {
        await connection.rollback();
        console.error(e);
        return { success: false, message: e.message || "Failed to delete position." };
    } finally {
        connection.release();
    }
}


export async function seedInitialRanks(pool: Pool) {
    const connection = await pool.getConnection();
    try {
        await createRanksTableIfNeeded(connection);

        const [existingRows] = await connection.query('SELECT COUNT(*) as count FROM ranks');
        if (Array.isArray(existingRows) && (existingRows[0] as any).count === 0) {
            console.log("No positions found. Seeding default positions...");
            
            const initialRanks = [
                { name: "CEO", department: "Management", sort_order: 1, insignia_url: "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/gota.png" },
                { name: "Manager", department: "Management", sort_order: 2, insignia_url: "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/general.png" },
                { name: "Division Lead", department: "Harvesting", sort_order: 3, insignia_url: "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/major.png" },
                { name: "Senior Farm Hand", department: "Harvesting", sort_order: 4, insignia_url: "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/staff-sergeant.png" },
                { name: "Farm Hand", department: "Harvesting", sort_order: 5, insignia_url: "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Green_Horizon_Logo.png" }
            ];

            for (const rank of initialRanks) {
                await connection.query(
                    'INSERT INTO ranks (id, name, department, sort_order, insignia_url) VALUES (?, ?, ?, ?, ?)',
                    [crypto.randomUUID(), rank.name, rank.department, rank.sort_order, rank.insignia_url]
                );
            }
            console.log("Default positions seeded successfully.");
        }
    } catch (error) {
        console.error("Error during position seeding:", error);
    } finally {
        connection.release();
    }
}
