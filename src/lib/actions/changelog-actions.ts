
'use server';

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';
import type { Changelog } from '../types';

export async function getChangelogs(): Promise<Changelog[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT 
                c.id, c.version, c.added_features, c.fixes, c.removed_features, c.other, c.createdAt,
                u.id as author_id, u.username as author_username, u.avatarUrl as author_avatarUrl
            FROM changelogs c
            JOIN users u ON c.author_id = u.id
            ORDER BY c.createdAt DESC
        `);
        
        if (!Array.isArray(rows)) {
            return [];
        }
        
        return (rows as any[]).map(row => ({
            id: row.id,
            version: row.version,
            added_features: row.added_features,
            fixes: row.fixes,
            removed_features: row.removed_features,
            other: row.other,
            createdAt: new Date(row.createdAt),
            author: {
                id: row.author_id,
                username: row.author_username,
                avatarUrl: row.author_avatarUrl,
            }
        }));
    } catch (error) {
        console.error("Failed to fetch changelogs:", error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            console.log("Changelogs table does not exist yet. It will be created on app start.");
            return [];
        }
        return [];
    } finally {
        connection.release();
    }
}

const addChangelogSchema = z.object({
    version: z.string().min(1, "Version is required."),
    added_features: z.string().optional(),
    fixes: z.string().optional(),
    removed_features: z.string().optional(),
    other: z.string().optional(),
    authorId: z.string(),
}).refine(data => data.added_features || data.fixes || data.removed_features || data.other, {
    message: "At least one category must have content.",
    path: ["added_features"], // Path to show error under
});


export async function addChangelog(data: unknown) {
    const validation = addChangelogSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { version, added_features, fixes, removed_features, other, authorId } = validation.data;
    
    const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [authorId]);
    const username = (userRows as any)[0]?.username;

    if (!username) {
         return { success: false, message: 'Invalid user.' };
    }

    const hasPermission = await checkPermissions(username, 'MANAGE_CHANGELOGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'INSERT INTO changelogs (id, version, added_features, fixes, removed_features, other, author_id, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [randomUUID(), version, added_features, fixes, removed_features, other, authorId, new Date()]
        );
        
        const logMessage = `Posted new changelog for version ${version}.`;
        await logUserAction(username, 'Create Changelog', logMessage, connection);

        await connection.commit();
        revalidatePath('/changelogs');
        return { success: true, message: 'Changelog posted successfully.' };

    } catch (error) {
        await connection.rollback();
        console.error("Failed to add changelog:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function deleteChangelog(changelogId: string, deletingUser: string) {
    const hasPermission = await checkPermissions(deletingUser, 'MANAGE_CHANGELOGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [changelogRows] = await connection.query('SELECT version FROM changelogs WHERE id = ?', [changelogId]);
        const version = (changelogRows as any)[0]?.version || 'Unknown';
        
        await connection.query('DELETE FROM changelogs WHERE id = ?', [changelogId]);
        await logUserAction(deletingUser, 'Delete Changelog', `Deleted changelog for version ${version} (ID: ${changelogId})`, connection);
        
        await connection.commit();

        revalidatePath('/changelogs');
        return { success: true, message: 'Changelog deleted.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to delete changelog:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
