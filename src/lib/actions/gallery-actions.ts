
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import type { GalleryImage } from '../types';

export async function getGalleryImages(): Promise<GalleryImage[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(`SELECT * FROM gallery_images ORDER BY createdAt DESC`);
        
        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as any[]).map(row => ({
            id: row.id,
            src: row.src,
            alt: row.alt,
            hint: row.hint,
            createdAt: new Date(row.createdAt),
        }));

    } catch (error) {
        console.error("Failed to fetch gallery images:", error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            return [];
        }
        return [];
    } finally {
        connection.release();
    }
}

const addImageSchema = z.object({
  src: z.string().url().refine(
    (url) => /^https:\/\/i\.imgur\.com\//.test(url) || /^https:\/\/r2\.fivemanage\.com\//.test(url),
    "URL must be from i.imgur.com or r2.fivemanage.com"
  ),
  alt: z.string().min(1, "Alt text is required"),
  hint: z.string().optional(),
});


export async function addGalleryImage(data: unknown) {
    // Note: In a real app, you'd add a permission check here.
    // const hasPermission = await checkPermissions(user, 'MANAGE_GALLERY');
    // if (!hasPermission) {
    //     return { success: false, message: 'You do not have permission to perform this action.' };
    // }

    const validation = addImageSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { src, alt, hint } = validation.data;
    
    const connection = await db.getConnection();
    try {
        await connection.query(
            'INSERT INTO gallery_images (id, src, alt, hint) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), src, alt, hint || null]
        );
        
        revalidatePath('/dashboard');
        return { success: true, message: 'Image added successfully.' };

    } catch (error) {
        console.error("Failed to add gallery image:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}


export async function deleteGalleryImage(id: string) {
    // Note: Add permission check here as well for a production app.
    const connection = await db.getConnection();
    try {
        await connection.query('DELETE FROM gallery_images WHERE id = ?', [id]);
        revalidatePath('/dashboard');
        return { success: true, message: 'Image deleted.' };
    } catch (error) {
        console.error("Failed to delete gallery image:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
