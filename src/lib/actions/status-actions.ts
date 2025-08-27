
'use server';

import { z } from 'zod';
import db from '../db';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';

const updateStatusSchema = z.object({
  personnelId: z.string(),
  status: z.enum(['Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended']),
  loaUntil: z.date().optional().nullable(),
  user: z.string(),
});

export async function updatePersonnelStatus(data: unknown) {
  const validation = updateStatusSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', issues: validation.error.issues };
  }

  const { personnelId, status, loaUntil, user } = validation.data;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [personnelRows] = await connection.query('SELECT name FROM personnel WHERE id = ?', [personnelId]);
    const personnelName = (personnelRows as any)[0]?.name || 'Unknown Personnel';

    await connection.query(
      'UPDATE personnel SET status = ?, loa_until = ? WHERE id = ?',
      [status, loaUntil, personnelId]
    );

    let logDescription = `Set status for ${personnelName} to ${status}.`;
    if (status === 'LOA' && loaUntil) {
      logDescription += ` LOA until ${loaUntil.toLocaleDateString()}.`;
    }

    await logUserAction(user, 'Update Status', logDescription, connection);
    
    await connection.commit();

    revalidatePath('/roster');
    revalidatePath('/logs');
    return { success: true, message: 'Personnel status updated successfully.' };
  } catch (error) {
    await connection.rollback();
    console.error('Updating personnel status failed:', error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}
