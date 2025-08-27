
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { rankOrder } from '../data';
import type { Personnel } from '../types';

async function getPersonnelById(id: string): Promise<Personnel | null> {
  const [rows] = await db.query('SELECT * FROM personnel WHERE id = ?', [id]);
  if (Array.isArray(rows) && rows.length > 0) {
    return (rows as any)[0] as Personnel;
  }
  return null;
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
    revalidatePath('/roster');
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
    revalidatePath('/roster');
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

    await connection.commit();
    revalidatePath('/roster');
    revalidatePath('/archive');
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
});

export async function updatePersonnel(personnelId: string, data: unknown) {
  const validation = updatePersonnelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', issues: validation.error.issues };
  }

  const { name, badgeNumber, rank } = validation.data;
  
  try {
    await db.query('UPDATE personnel SET name = ?, badgeNumber = ?, rank = ? WHERE id = ?', [name, badgeNumber, rank, personnelId]);
    revalidatePath('/roster');
    return { success: true, message: 'Personnel updated successfully.' };
  } catch (error) {
    console.error('Updating personnel failed:', error);
    return { success: false, message: 'Database operation failed.' };
  }
}
