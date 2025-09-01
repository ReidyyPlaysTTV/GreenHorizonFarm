
'use server';

import db from '../db';
import { revalidatePath } from 'next/cache';
import type { AuditLog, BlacklistedPersonnel } from '../types';
import { z } from 'zod';
import { checkPermissions } from '../permissions';

async function createAuditLogTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            user VARCHAR(255) NOT NULL,
            actionType VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function logUserAction(
    user: string, 
    actionType: string,
    description: string,
    dbConnection?: any // Allow passing an existing connection for transactions
) {
    if (!user) {
        console.warn("Audit log attempted without a user. Action:", actionType);
        // In a real app, you might want to throw an error or handle this more strictly
        user = "System"; 
    }

    const connection = dbConnection || await db.getConnection();
    try {
        await createAuditLogTableIfNeeded(connection);
        await connection.query(
            'INSERT INTO audit_logs (id, user, actionType, description) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), user, actionType, description]
        );
    } catch (error) {
        console.error("Failed to log user action:", error);
    } finally {
        if (!dbConnection) {
            connection.release();
        }
    }
}


export async function getAuditLogs(options: { username?: string } = {}): Promise<AuditLog[]> {
    const { username } = options;
    const connection = await db.getConnection();
    try {
        await createAuditLogTableIfNeeded(connection);
        
        let query = 'SELECT * FROM audit_logs';
        const queryParams = [];

        if (username) {
            query += ' WHERE user = ?';
            queryParams.push(username);
        }

        query += ' ORDER BY timestamp DESC LIMIT 200';
        
        const [rows] = await connection.query(query, queryParams);

        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as any[]).map(log => ({ ...log, timestamp: new Date(log.timestamp) }));
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return [];
    } finally {
        connection.release();
    }
}

const blacklistSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  discordUsername: z.string().optional(),
  reason: z.string().min(5, "Reason must be at least 5 characters."),
  user: z.string(),
});

export async function addBlacklistedPersonnel(data: unknown) {
  const validation = blacklistSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  const { name, discordUsername, reason, user } = validation.data;
  
  const hasPermission = await checkPermissions(user, 'MANAGE_BLACKLIST');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO blacklisted_personnel (id, name, discord_username, reason, dateAdded) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), name, discordUsername, reason, new Date()]
    );

    await logUserAction(
      user,
      'Add to Blacklist',
      `Added '${name}' to the blacklist. Reason: ${reason}`,
      connection
    );

    await connection.commit();
    revalidatePath('/command');
    revalidatePath('/logs');
    return { success: true, message: `${name} has been added to the blacklist.` };
  } catch (error) {
    await connection.rollback();
    console.error("Failed to add to blacklist:", error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

const removeBlacklistSchema = z.object({
  personnelId: z.string(),
  user: z.string(),
  name: z.string(),
});

export async function removeBlacklistedPersonnel(data: unknown) {
  const validation = removeBlacklistSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  const { personnelId, user, name } = validation.data;
  
  const hasPermission = await checkPermissions(user, 'MANAGE_BLACKLIST');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM blacklisted_personnel WHERE id = ?', [personnelId]);
    await logUserAction(user, 'Remove from Blacklist', `Removed '${name}' from the blacklist.`, connection);
    await connection.commit();
    
    revalidatePath('/command');
    revalidatePath('/logs');
    return { success: true, message: `${name} has been removed from the blacklist.` };
  } catch (error) {
    await connection.rollback();
    console.error("Failed to remove from blacklist:", error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}
