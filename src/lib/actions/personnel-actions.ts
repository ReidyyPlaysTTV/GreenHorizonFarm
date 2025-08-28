

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { rankOrder } from '../data';
import type { Personnel } from '../types';
import { randomUUID } from 'crypto';
import { logCallsignChange } from './callsign-log-actions';
import { logUserAction } from './audit-log-actions';
import { updateApplicationStatus } from './form-actions';
import { checkPermissions } from '../permissions';

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
            [randomUUID(), personnelName, eventType, description, new Date()]
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

    const currentRankIndex = rankOrder.indexOf(personnel.rank);
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
    revalidatePath('/');
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

    const currentRankIndex = rankOrder.indexOf(personnel.rank);
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
    revalidatePath('/');
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
        [personnel.id, personnel.name, personnel.rank, personnel.discordUsername, 'Fired', new Date(), reason]
    );

    await connection.query('DELETE FROM personnel WHERE id = ?', [personnelId]);
    
    await logEvent(personnel.name, 'Fired', `Fired for: ${reason}`, connection);
    await logCallsignChange(personnel.badgeNumber, personnel.name, 'Unassigned', connection);
    await logUserAction(user, "Fire Personnel", `Fired ${personnel.name}. Reason: ${reason}`, connection);

    await connection.commit();
    revalidatePath('/roster');
    revalidatePath('/archive');
    revalidatePath('/');
    revalidatePath('/callsigns');
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
  name: z.string().min(3),
  badgeNumber: z.string().min(3, "Callsign must be 3-4 digits.").max(4, "Callsign must be 3-4 digits."),
  rank: z.string(),
  discordUsername: z.string().optional(),
  user: z.string(),
});

export async function updatePersonnel(personnelId: string, data: unknown) {
  const validation = updatePersonnelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', issues: validation.error.issues };
  }
  const { name, badgeNumber, rank, discordUsername, user } = validation.data;
  
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

    await connection.query('UPDATE personnel SET name = ?, badgeNumber = ?, rank = ?, discord_username = ? WHERE id = ?', [name, badgeNumber, rank, discordUsername, personnelId]);
    await logUserAction(user, "Update Personnel", `Updated details for ${name} (formerly ${originalPersonnel.name}).`, connection);


    if (originalPersonnel.badgeNumber !== badgeNumber) {
      await logCallsignChange(originalPersonnel.badgeNumber, originalPersonnel.name, 'Unassigned', connection);
      await logCallsignChange(badgeNumber, name, 'Assigned', connection);
    }
    
    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/callsigns');
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
  name: z.string().min(3, "Name must be at least 3 characters."),
  rank: z.string({ required_error: "Please select a rank." }),
  callsign: z.coerce
    .number({ invalid_type_error: "Callsign must be a number." })
    .min(100, "Callsign must be between 100 and 9999.")
    .max(9999, "Callsign must be between 100 and 9999."),
  discordUsername: z.string().optional(),
  user: z.string(),
  applicationId: z.string().optional(),
});

export async function addPersonnel(data: unknown) {
    const validation = addPersonnelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data.', issues: validation.error.issues };
    }
    const { name, rank, callsign, discordUsername, user, applicationId } = validation.data;
    
    const hasPermission = await checkPermissions(user, 'HIRE_PERSONNEL');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const personnelId = randomUUID();
        await connection.query(
            'INSERT INTO personnel (id, name, rank, badgeNumber, discord_username, status, loa_until) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [personnelId, name, rank, callsign.toString(), discordUsername, 'Active', null]
        );
        await logEvent(name, 'Hired', `Hired as ${rank}`, connection);
        await logCallsignChange(callsign.toString(), name, 'Assigned', connection);
        
        let logDescription = `Added ${name} to the roster as ${rank} with callsign ${callsign}.`;
        if (applicationId) {
            logDescription += ` (Approved from application).`
            await updateApplicationStatus(applicationId, 'Approved', user);
        }
        
        await logUserAction(user, "Add Personnel", logDescription, connection);

        await connection.commit();

        revalidatePath('/roster');
        revalidatePath('/');
        revalidatePath('/callsigns');
        revalidatePath('/logs');
        revalidatePath('/applications');
        return { success: true, message: `${name} has been added to the roster.` };
    } catch (error: any) {
        await connection.rollback();
        console.error('Adding personnel failed:', error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
             return { success: false, message: 'That callsign is already in use.' };
        }
        return { success: false, message: error.message || 'Database operation failed.' };
    } finally {
        connection.release();
    }
}


const rehirePersonnelSchema = z.object({
  archivedId: z.string(),
  name: z.string(),
  rank: z.string(),
  discordUsername: z.string().optional(),
  callsign: z.coerce.number().min(100).max(9999),
  user: z.string(),
});

export async function rehirePersonnel(data: unknown) {
  const validation = rehirePersonnelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  const { archivedId, name, rank, discordUsername, callsign, user } = validation.data;
  
  const hasPermission = await checkPermissions(user, 'HIRE_PERSONNEL');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const newId = randomUUID();
    await connection.query(
      'INSERT INTO personnel (id, name, rank, badgeNumber, discord_username, is_rehired) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, rank, callsign.toString(), discordUsername, true]
    );

    await connection.query('DELETE FROM archived_personnel WHERE id = ?', [archivedId]);

    await logEvent(name, 'Rehired', `Rehired as ${rank} with callsign ${callsign}`, connection);
    await logCallsignChange(callsign.toString(), name, 'Assigned', connection);
    await logUserAction(user, 'Rehire Personnel', `Rehired ${name} as ${rank} with callsign ${callsign}`, connection);

    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/archive');
    revalidatePath('/callsigns');
    revalidatePath('/logs');
    revalidatePath('/');

    return { success: true, message: `${name} has been rehired.` };
  } catch (error: any) {
    await connection.rollback();
    console.error("Failed to rehire personnel:", error);
     if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
       return { success: false, message: 'That callsign is already in use.' };
    }
    return { success: false, message: error.message || 'Database operation failed.' };
  } finally {
    connection.release();
  }
}
