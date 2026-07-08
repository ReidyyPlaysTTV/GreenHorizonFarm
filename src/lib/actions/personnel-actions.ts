
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import type { Personnel, Rank } from '../types';
import { logUserAction } from './audit-log-actions';
import { updateApplicationStatus } from './form-actions';
import { checkPermissions } from '../permissions';
import { staffRoles } from '../data';

async function getPersonnelById(id: string, connection?: any): Promise<Personnel | null> {
    const conn = connection || await db.getConnection();
    try {
        const [rows] = await conn.query('SELECT * FROM personnel WHERE id = ?', [id]);
        if (Array.isArray(rows) && rows.length > 0) {
            return (rows as any)[0] as Personnel;
        }
        return null;
    } finally {
        if (!connection) conn.release();
    }
}

async function logEvent(personnelName: string, eventType: 'Hired' | 'Fired' | 'Promoted' | 'Demoted' | 'Rehired', description: string, dbConnection?: any) {
    const connection = dbConnection || await db.getConnection();
    try {
        await connection.query(
            'INSERT INTO personnel_events (id, personnel_name, event_type, description, date) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), personnelName, eventType, description, new Date()]
        );
    } catch (error) {
        console.error(`Failed to log event: ${eventType} for ${personnelName}`, error);
    } finally {
        if (!dbConnection) {
            connection.release();
        }
    }
}

export async function promotePersonnel(personnelId: string, user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_PERSONNEL');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const personnel = await getPersonnelById(personnelId, connection);
    if (!personnel) {
      throw new Error('Personnel not found.');
    }
    
    const rankOrder = staffRoles;
    const currentRankIndex = rankOrder.indexOf(personnel.rank as any);
    
    if (currentRankIndex === -1) {
      throw new Error('Invalid current rank.');
    }
    if (currentRankIndex === 0) {
      return { success: false, message: 'Cannot promote further.' };
    }

    const newRank = rankOrder[currentRankIndex - 1];
    await connection.query('UPDATE personnel SET rank = ? WHERE id = ?', [newRank, personnelId]);
    await logEvent(personnel.name, 'Promoted', `Promoted from ${personnel.rank} to ${newRank}`, connection);
    await logUserAction(user, "Promote Personnel", `Promoted ${personnel.name} from ${personnel.rank} to ${newRank}.`, connection);
    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/logs');
    return { success: true, message: `${personnel.name} promoted to ${newRank}.` };
  } catch (error: any) {
    await connection.rollback();
    console.error('Promotion failed:', error);
    return { success: false, message: error.message || 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

export async function demotePersonnel(personnelId: string, user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_PERSONNEL');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const personnel = await getPersonnelById(personnelId, connection);
    if (!personnel) {
      throw new Error('Personnel not found.');
    }
    
    const rankOrder = staffRoles;
    const currentRankIndex = rankOrder.indexOf(personnel.rank as any);
    
    if (currentRankIndex === -1) {
      throw new Error('Invalid current rank.');
    }
    if (currentRankIndex === rankOrder.length - 1) {
      return { success: false, message: 'Cannot demote further.' };
    }

    const newRank = rankOrder[currentRankIndex + 1];
    await connection.query('UPDATE personnel SET rank = ? WHERE id = ?', [newRank, personnelId]);
    await logEvent(personnel.name, 'Demoted', `Demoted from ${personnel.rank} to ${newRank}`, connection);
    await logUserAction(user, "Demote Personnel", `Demoted ${personnel.name} from ${personnel.rank} to ${newRank}.`, connection);
    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/logs');
    return { success: true, message: `${personnel.name} demoted to ${newRank}.` };
  } catch (error: any) {
    await connection.rollback();
    console.error('Demotion failed:', error);
    return { success: false, message: error.message || 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

export async function firePersonnel(personnelId: string, reason: string, user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_PERSONNEL');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const personnel = await getPersonnelById(personnelId, connection);
    if (!personnel) {
      throw new Error('Personnel not found.');
    }

    await connection.query(
        'INSERT INTO archived_personnel (id, name, rank, discord_username, status, date, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [personnel.id, personnel.name, personnel.rank, personnel.discord_username, 'Fired', new Date(), reason]
    );

    await connection.query('DELETE FROM personnel WHERE id = ?', [personnelId]);
    
    await logEvent(personnel.name, 'Fired', `Fired for: ${reason}`, connection);
    await logUserAction(user, "Fire Personnel", `Fired ${personnel.name}. Reason: ${reason}`, connection);

    await connection.commit();
    revalidatePath('/roster');
    revalidatePath('/archive');
    revalidatePath('/logs');
    return { success: true, message: 'Personnel fired successfully.' };
  } catch (error: any) {
    await connection.rollback();
    console.error('Firing personnel failed:', error);
    return { success: false, message: error.message || 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

const updatePersonnelSchema = z.object({
  name: z.string().min(3).regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Name must be in IC format (e.g., 'Leon Green')."),
  rank: z.string(),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.date().optional(),
  user: z.string(),
});

export async function updatePersonnel(personnelId: string, data: unknown) {
  const validation = updatePersonnelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.errors[0].message };
  }
  const { name, rank, discordUsername, phoneNumber, bankAccount, hireDate, user } = validation.data;
  
  const hasPermission = await checkPermissions(user, 'MANAGE_PERSONNEL');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const originalPersonnel = await getPersonnelById(personnelId, connection);
    if (!originalPersonnel) {
      throw new Error('Personnel not found.');
    }

    await connection.query(
        'UPDATE personnel SET name = ?, rank = ?, discord_username = ?, phone_number = ?, bank_account = ?, hire_date = ? WHERE id = ?', 
        [name, rank, discordUsername, phoneNumber, bankAccount, hireDate || null, personnelId]
    );

    await logUserAction(user, "Update Personnel", `Updated details for ${name}.`, connection);
    
    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/logs');
    return { success: true, message: 'Personnel updated successfully.' };
  } catch (error: any) {
    await connection.rollback();
    console.error('Updating personnel failed:', error);
    return { success: false, message: error.message || 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

const addPersonnelSchema = z.object({
  name: z.string().min(3).regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Name must be in IC format (e.g., 'Leon Green')."),
  rank: z.string({ required_error: "Please select a rank." }),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.date().default(() => new Date()),
  user: z.string(),
  applicationId: z.string().optional(),
});

export async function addPersonnel(data: unknown) {
    const validation = addPersonnelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { name, rank, discordUsername, phoneNumber, bankAccount, hireDate, user, applicationId } = validation.data;
    
    const hasPermission = await checkPermissions(user, 'HIRE_PERSONNEL');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [userRows] = await connection.query('SELECT id FROM users WHERE username = ?', [name]);
        const userId = (userRows as any)[0]?.id || null;

        const personnelId = crypto.randomUUID();
        // Providing a dummy badgeNumber since it is currently required in DB but removed from UI
        const dummyBadge = Math.floor(1000 + Math.random() * 9000).toString();

        await connection.query(
            'INSERT INTO personnel (id, name, rank, badgeNumber, discord_username, phone_number, bank_account, hire_date, status, loa_until, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [personnelId, name, rank, dummyBadge, discordUsername, phoneNumber, bankAccount, hireDate, 'Active', null, userId]
        );
        await logEvent(name, 'Hired', `Hired as ${rank}`, connection);
        
        let logDescription = `Added ${name} to the roster as ${rank}.`;
        if (applicationId) {
            logDescription += ` (Approved from application).`;
        }
        
        await logUserAction(user, "Add Personnel", logDescription, connection);

        await connection.commit();

        revalidatePath('/roster');
        revalidatePath('/logs');
        revalidatePath('/applications');
        return { success: true, message: `${name} has been added to the roster.` };
    } catch (error: any) {
        await connection.rollback();
        console.error('Adding personnel failed:', error);
        return { success: false, message: error.message || 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
