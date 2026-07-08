
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';
import type { Announcement } from '../types';

export async function getAnnouncements(): Promise<Announcement[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT 
                a.id, a.content, a.priority, a.createdAt,
                u.id as author_id, u.username as author_username, u.avatarUrl as author_avatarUrl
            FROM announcements a
            JOIN users u ON a.user_id = u.id
            ORDER BY 
                CASE a.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END ASC,
                a.createdAt DESC
            LIMIT 10
        `);
        
        if (!Array.isArray(rows)) {
            return [];
        }
        
        return (rows as any[]).map(row => ({
            id: row.id,
            content: row.content,
            priority: row.priority,
            createdAt: new Date(row.createdAt),
            author: {
                id: row.author_id,
                username: row.author_username,
                avatarUrl: row.author_avatarUrl,
            }
        }));
    } catch (error) {
        console.error("Failed to fetch announcements:", error);
        return [];
    } finally {
        connection.release();
    }
}

const addAnnouncementSchema = z.object({
    content: z.string().min(1, 'Announcement cannot be empty.'),
    priority: z.enum(['high', 'medium', 'low']),
    userId: z.string(),
});

export async function addAnnouncement(data: unknown) {
    const validation = addAnnouncementSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { content, priority, userId } = validation.data;
    
    const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = (userRows as any)[0]?.username;

    if (!username) {
         return { success: false, message: 'Invalid user.' };
    }

    const hasPermission = await checkPermissions(username, 'MANAGE_ANNOUNCEMENTS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'INSERT INTO announcements (id, content, priority, user_id) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), content, priority, userId]
        );
        
        await logUserAction(username, 'Create Announcement', `Created a ${priority} priority announcement.`, connection);

        await connection.commit();
        revalidatePath('/dashboard');
        revalidatePath('/');
        return { success: true, message: 'Announcement posted successfully.' };

    } catch (error) {
        await connection.rollback();
        console.error("Failed to add announcement:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function deleteAnnouncement(announcementId: string, deletingUser: string) {
     const hasPermission = await checkPermissions(deletingUser, 'MANAGE_ANNOUNCEMENTS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM announcements WHERE id = ?', [announcementId]);
        await logUserAction(deletingUser, 'Delete Announcement', `Deleted announcement with ID ${announcementId}`, connection);
        await connection.commit();

        revalidatePath('/dashboard');
        revalidatePath('/');
        return { success: true, message: 'Announcement deleted.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to delete announcement:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
