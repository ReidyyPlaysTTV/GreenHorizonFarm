
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '../db';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';
import type { Division, Rank } from '../types';
import { divisions, staffRoles } from '../data';
import type { Pool } from 'mysql2/promise';

/**
 * Ranks are now synchronized with Permission Group Roles.
 * This returns the system roles as Rank objects for UI compatibility.
 */
export async function getRanks(): Promise<Rank[]> {
    return staffRoles.map((role, index) => ({
        id: `role-${role}`,
        name: role,
        department: "Management", // Department is handled per-personnel now
        sort_order: index + 1,
    }));
}

const rankSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Position name must be at least 3 characters."),
  department: z.string(), 
  sort_order: z.coerce.number().int().min(1),
  insignia_url: z.string().url().optional().or(z.literal('')),
});

export async function addRank(data: unknown, user: string) {
    return { success: false, message: "Manual rank management is disabled. Ranks use system roles." };
}

export async function updateRank(data: unknown, user: string) {
    return { success: false, message: "Manual rank management is disabled." };
}

export async function deleteRank(id: string, user: string) {
    return { success: false, message: "Manual rank management is disabled." };
}

export async function seedInitialRanks(pool: Pool) {
    // No-op: Ranks now use static roles
}
