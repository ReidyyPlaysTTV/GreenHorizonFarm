
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { rankOrder } from '../data';
import type { Personnel } from '../types';
import { randomUUID } from 'crypto';
import { logCallsignChange } from './callsign-log-actions';

async function getPersonnelById(id: string): Promise<Personnel | null> {
  const [rows] = await db.query('SELECT * FROM personnel WHERE id = ?', [id]);
  if (Array.isArray(rows) && rows.length > 0) {
    return (rows as any)[0] as Personnel;
  }
  return null;
}

async function logEvent(personnelName: string, eventType: 'Hired' | 'Fired' | 'Promoted' | 'Demoted', description: string) {
    try {
        await db.query(
            'INSERT INTO personnel_events (id, personnel_name, event_type, description, date) VALUES (?, ?, ?, ?, ?)',
            [randomUUID(), personnelName, eventType, description, new Date()]
        );
    } catch (error) {
        // Log the error but don't block the main action if event logging fails
        console.error(`Failed to log event: ${eventType} for ${personnelName}`, error);
    }
}

export async function promotePersonnel(personnelId: string) {
  const personnel = await getPersonnelById(personnelId);
  if (!personnel) {
    return { success: false, message: 'Personnel not found.' };
  }

  const currentRankIndex = rankOrder.indexOf(personnel.rank);
  if (currentRankIndex === -1) {
    return { success: false, message: 'Invalid current rank.' };
  }
  if (currentRankIndex === 0) {
    return { success: false, message: 'Cannot promote further.' };
  }

  const newRank = rankOrder[currentRankIndex - 1];
  try {
    await db.query('UPDATE personnel SET rank = ? WHERE id = ?', [newRank, personnelId]);
    await logEvent(personnel.name, 'Promoted', `Promoted from ${personnel.rank} to ${newRank}`);
    revalidatePath('/roster');
    revalidatePath('/');
    return { success: true, message: `${personnel.name} promoted to ${newRank}.` };
  } catch (error) {
    console.error('Promotion failed:', error);
    return { success: false, message: 'Database operation failed.' };
  }
}

export async function demotePersonnel(personnelId: string) {
  const personnel = await getPersonnelById(personnelId);
  if (!personnel) {
    return { success: false, message: 'Personnel not found.' };
  }

  const currentRankIndex = rankOrder.indexOf(personnel.rank);
  if (currentRankIndex === -1) {
    return { success: false, message: 'Invalid current rank.' };
  }
  if (currentRankIndex === rankOrder.length - 1) {
    return { success: false, message: 'Cannot demote further.' };
  }

  const newRank = rankOrder[currentRankIndex + 1];
  try {
    await db.query('UPDATE personnel SET rank = ? WHERE id = ?', [newRank, personnelId]);
    await logEvent(personnel.name, 'Demoted', `Demoted from ${personnel.rank} to ${newRank}`);
    revalidatePath('/roster');
    revalidatePath('/');
    return { success: true, message: `${personnel.name} demoted to ${newRank}.` };
  } catch (error) {
    console.error('Demotion failed:', error);
    return { success: false, message: 'Database operation failed.' };
  }
}

export async function firePersonnel(personnelId: string, reason: string) {
  const personnel = await getPersonnelById(personnelId);
  if (!personnel) {
    return { success: false, message: 'Personnel not found.' };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Add to archive
    await connection.query(
        'INSERT INTO archived_personnel (id, name, rank, status, date, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [personnel.id, personnel.name, personnel.rank, 'Fired', new Date(), reason]
    );

    // Remove from active roster
    await connection.query('DELETE FROM personnel WHERE id = ?', [personnelId]);
    
    await logEvent(personnel.name, 'Fired', `Fired for: ${reason}`);
    await logCallsignChange(personnel.badgeNumber, personnel.name, 'Unassigned', connection);

    await connection.commit();
    revalidatePath('/roster');
    revalidatePath('/archive');
    revalidatePath('/');
    revalidatePath('/callsigns');
    return { success: true, message: 'Personnel fired successfully.' };
  } catch (error) {
    await connection.rollback();
    console.error('Firing personnel failed:', error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

const updatePersonnelSchema = z.object({
  name: z.string().min(3),
  badgeNumber: z.string(),
  rank: z.string(),
  discordUsername: z.string().optional(),
});

export async function updatePersonnel(personnelId: string, data: unknown) {
  const validation = updatePersonnelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', issues: validation.error.issues };
  }
  const { name, badgeNumber, rank, discordUsername } = validation.data;
  
  const originalPersonnel = await getPersonnelById(personnelId);
  if (!originalPersonnel) {
    return { success: false, message: 'Personnel not found.' };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE personnel SET name = ?, badgeNumber = ?, rank = ?, discord_username = ? WHERE id = ?', [name, badgeNumber, rank, discordUsername, personnelId]);

    if (originalPersonnel.badgeNumber !== badgeNumber) {
      await logCallsignChange(originalPersonnel.badgeNumber, originalPersonnel.name, 'Unassigned', connection);
      await logCallsignChange(badgeNumber, name, 'Assigned', connection);
    }
    
    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/callsigns');
    return { success: true, message: 'Personnel updated successfully.' };
  } catch (error) {
    await connection.rollback();
    console.error('Updating personnel failed:', error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

const addPersonnelSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  rank: z.string({ required_error: "Please select a rank." }),
  callsign: z.coerce
    .number({ invalid_type_error: "Callsign must be a number." })
    .min(1000, "Callsign must be between 1000 and 9999.")
    .max(9999, "Callsign must be between 1000 and 9999."),
  discordUsername: z.string().optional(),
});

export async function addPersonnel(data: unknown) {
    const validation = addPersonnelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data.', issues: validation.error.issues };
    }
    const { name, rank, callsign, discordUsername } = validation.data;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const id = randomUUID();
        await connection.query(
            'INSERT INTO personnel (id, name, rank, badgeNumber, discord_username) VALUES (?, ?, ?, ?, ?)',
            [id, name, rank, callsign.toString(), discordUsername]
        );
        await logEvent(name, 'Hired', `Hired as ${rank}`);
        await logCallsignChange(callsign.toString(), name, 'Assigned', connection);

        await connection.commit();

        revalidatePath('/roster');
        revalidatePath('/');
        revalidatePath('/callsigns');
        return { success: true, message: `${name} has been added to the roster.` };
    } catch (error) {
        await connection.rollback();
        console.error('Adding personnel failed:', error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
             return { success: false, message: 'That callsign is already in use.' };
        }
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
