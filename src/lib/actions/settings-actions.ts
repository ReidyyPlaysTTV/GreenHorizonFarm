
'use server';

import db from '../db';
import { revalidatePath } from 'next/cache';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';

const SOP_LINK_KEY = 'sop_link';

async function createSettingsTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
            setting_value TEXT
        );
    `);
}

export async function getSopLink(): Promise<string | null> {
    const connection = await db.getConnection();
    try {
        await createSettingsTableIfNeeded(connection);
        const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [SOP_LINK_KEY]);

        if (Array.isArray(rows) && rows.length > 0) {
            return (rows[0] as any).setting_value;
        }
        
        // If not found, insert the default and return it
        const defaultUrl = "https://docs.google.com/presentation/d/1jjUe1Jx2odazolqiyGnuCiEVEE3NPrHQVMn3_cw9A2s/embed?start=false&loop=false&delayms=3000";
        await connection.query(
            'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
            [SOP_LINK_KEY, defaultUrl]
        );
        return defaultUrl;

    } catch (error) {
        console.error("Failed to get SOP link:", error);
        return null;
    } finally {
        connection.release();
    }
}

export async function updateSopLink(newLink: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await createSettingsTableIfNeeded(connection);

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both cases
        await connection.query(
            `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = ?`,
            [SOP_LINK_KEY, newLink, newLink]
        );
        
        await logUserAction(user, 'Update Settings', 'Updated the SOP link.', connection);

        await connection.commit();
        
        revalidatePath('/sops');
        revalidatePath('/admin');
        revalidatePath('/logs');

        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to update SOP link:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
