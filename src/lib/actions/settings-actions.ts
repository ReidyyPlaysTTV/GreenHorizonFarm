
'use server';

import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';

const SOP_LINK_KEY = 'sop_link';
const APPLICATIONS_OPEN_KEY = 'applications_open';
const LOGIN_BACKGROUND_IMAGE_KEY = 'login_background_image';
const MAINTENANCE_MODE_KEY = 'maintenance_mode';

// Memory cache for maintenance mode to prevent blocking navigation
let maintenanceCache: { value: boolean, timestamp: number } | null = null;
const MAINTENANCE_CACHE_TTL = 30000; // 30 seconds

async function createSettingsTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
            setting_value TEXT
        );
    `);
}

export async function getSopLink(): Promise<string | null> {
    try {
        await ensureDbInitialized();
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
                'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value',
                [SOP_LINK_KEY, defaultUrl]
            );
            return defaultUrl;

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to get SOP link:", error);
        return null;
    }
}

export async function updateSopLink(newLink: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await createSettingsTableIfNeeded(connection);

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
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to update SOP link:", error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function getApplicationStatus(): Promise<boolean> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await createSettingsTableIfNeeded(connection);
            const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [APPLICATIONS_OPEN_KEY]);

            if (Array.isArray(rows) && rows.length > 0) {
                return (rows[0] as any).setting_value === 'true';
            }
            
            await connection.query(
                'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value',
                [APPLICATIONS_OPEN_KEY, 'true']
            );
            return true;

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to get application status:", error);
        return true; 
    }
}

export async function updateApplicationStatusSetting(isOpen: boolean, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await createSettingsTableIfNeeded(connection);

            await connection.query(
                `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [APPLICATIONS_OPEN_KEY, isOpen.toString(), isOpen.toString()]
            );
            
            const logMessage = `Set applications to ${isOpen ? 'OPEN' : 'CLOSED'}.`;
            await logUserAction(user, 'Update Settings', logMessage, connection);
            await connection.commit();
            
            revalidatePath('/apply');
            revalidatePath('/applications');
            revalidatePath('/admin');
            revalidatePath('/logs');

            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to update application status setting:", error);
        return { success: false, message: 'Database operation failed.' };
    }
}


export async function getLoginBackgroundImage(): Promise<string> {
    const defaultUrl = "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/e1b8daf9b26a971543cc901fc4fcec33ab7af144.png";
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await createSettingsTableIfNeeded(connection);
            const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [LOGIN_BACKGROUND_IMAGE_KEY]);

            if (Array.isArray(rows) && rows.length > 0 && (rows[0] as any).setting_value) {
                return (rows[0] as any).setting_value;
            }
            
            await connection.query(
                'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value',
                [LOGIN_BACKGROUND_IMAGE_KEY, defaultUrl]
            );
            return defaultUrl;

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to get login background image:", error);
        return defaultUrl;
    }
}


export async function updateLoginBackgroundImage(newUrl: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await createSettingsTableIfNeeded(connection);

            await connection.query(
                `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [LOGIN_BACKGROUND_IMAGE_KEY, newUrl, newUrl]
            );
            
            await logUserAction(user, 'Update Settings', 'Updated the login page background image.', connection);
            await connection.commit();
            
            revalidatePath('/');
            revalidatePath('/admin');

            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to update login background image:", error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function getMaintenanceMode(): Promise<boolean> {
    const now = Date.now();
    if (maintenanceCache && (now - maintenanceCache.timestamp < MAINTENANCE_CACHE_TTL)) {
        return maintenanceCache.value;
    }

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await createSettingsTableIfNeeded(connection);
            const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [MAINTENANCE_MODE_KEY]);
            const isMaintenance = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).setting_value === 'true' : false;
            
            maintenanceCache = { value: isMaintenance, timestamp: now };
            return isMaintenance;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to get maintenance mode status:", error);
        return false;
    }
}

export async function updateMaintenanceMode(isMaintenance: boolean, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await createSettingsTableIfNeeded(connection);
            await connection.query(
                `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [MAINTENANCE_MODE_KEY, isMaintenance.toString(), isMaintenance.toString()]
            );
            
            const logMessage = `Set maintenance mode to ${isMaintenance ? 'ON' : 'OFF'}.`;
            await logUserAction(user, 'Update Settings', logMessage, connection);
            await connection.commit();
            
            maintenanceCache = { value: isMaintenance, timestamp: Date.now() };
            revalidatePath('/admin');
            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to update maintenance mode:", error);
        return { success: false, message: 'Database operation failed.' };
    }
}
