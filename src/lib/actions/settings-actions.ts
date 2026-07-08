
'use server';

import db, { ensureDbInitialized } from '../db';
import { revalidatePath } from 'next/cache';
import { checkPermissions } from '../permissions';
import { logUserAction } from './audit-log-actions';

const SOP_LINK_KEY = 'sop_link';
const APPLICATIONS_OPEN_KEY = 'applications_open';
const LOGIN_BACKGROUND_IMAGE_KEY = 'login_background_image';
const MAINTENANCE_MODE_KEY = 'maintenance_mode';

// Centralized High-Performance Cache for Production
const settingsCache: Record<string, { value: any, timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds

async function getCachedSetting(key: string, fetcher: () => Promise<any>): Promise<any> {
    const now = Date.now();
    if (settingsCache[key] && (now - settingsCache[key].timestamp < CACHE_TTL)) {
        return settingsCache[key].value;
    }
    const value = await fetcher();
    settingsCache[key] = { value, timestamp: now };
    return value;
}

async function createSettingsTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
            setting_value TEXT
        );
    `);
}

export async function getSopLink(): Promise<string | null> {
    return getCachedSetting(SOP_LINK_KEY, async () => {
        try {
            await ensureDbInitialized();
            const connection = await db.getConnection();
            try {
                await createSettingsTableIfNeeded(connection);
                const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [SOP_LINK_KEY]);
                if (Array.isArray(rows) && rows.length > 0) return (rows[0] as any).setting_value;
                const defaultUrl = "https://docs.google.com/presentation/d/1jjUe1Jx2odazolqiyGnuCiEVEE3NPrHQVMn3_cw9A2s/embed?start=false&loop=false&delayms=3000";
                await connection.query('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value', [SOP_LINK_KEY, defaultUrl]);
                return defaultUrl;
            } finally { connection.release(); }
        } catch (error) { return null; }
    });
}

export async function updateSopLink(newLink: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await createSettingsTableIfNeeded(connection);
            await connection.query(`INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`, [SOP_LINK_KEY, newLink, newLink]);
            await logUserAction(user, 'Update Settings', 'Updated the SOP link.', connection);
            await connection.commit();
            delete settingsCache[SOP_LINK_KEY];
            revalidatePath('/sops');
            return { success: true };
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    } catch (error) { return { success: false, message: 'DB Error' }; }
}

export async function getApplicationStatus(): Promise<boolean> {
    return getCachedSetting(APPLICATIONS_OPEN_KEY, async () => {
        try {
            await ensureDbInitialized();
            const connection = await db.getConnection();
            try {
                const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [APPLICATIONS_OPEN_KEY]);
                if (Array.isArray(rows) && rows.length > 0) return (rows[0] as any).setting_value === 'true';
                return true;
            } finally { connection.release(); }
        } catch (error) { return true; }
    });
}

export async function updateApplicationStatusSetting(isOpen: boolean, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`, [APPLICATIONS_OPEN_KEY, isOpen.toString(), isOpen.toString()]);
            await logUserAction(user, 'Update Settings', `Set apps to ${isOpen ? 'OPEN' : 'CLOSED'}.`, connection);
            await connection.commit();
            delete settingsCache[APPLICATIONS_OPEN_KEY];
            revalidatePath('/apply');
            revalidatePath('/applications');
            return { success: true };
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    } catch (error) { return { success: false, message: 'DB Error' }; }
}

export async function getMaintenanceMode(): Promise<boolean> {
    return getCachedSetting(MAINTENANCE_MODE_KEY, async () => {
        try {
            await ensureDbInitialized();
            const connection = await db.getConnection();
            try {
                const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [MAINTENANCE_MODE_KEY]);
                return Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).setting_value === 'true' : false;
            } finally { connection.release(); }
        } catch (error) { return false; }
    });
}

export async function updateMaintenanceMode(isMaintenance: boolean, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`, [MAINTENANCE_MODE_KEY, isMaintenance.toString(), isMaintenance.toString()]);
            await logUserAction(user, 'Update Settings', `Set maintenance to ${isMaintenance ? 'ON' : 'OFF'}.`, connection);
            await connection.commit();
            delete settingsCache[MAINTENANCE_MODE_KEY];
            revalidatePath('/admin');
            return { success: true };
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    } catch (error) { return { success: false, message: 'DB Error' }; }
}

export async function getLoginBackgroundImage(): Promise<string> {
    const defaultUrl = "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/e1b8daf9b26a971543cc901fc4fcec33ab7af144.png";
    return getCachedSetting(LOGIN_BACKGROUND_IMAGE_KEY, async () => {
        try {
            await ensureDbInitialized();
            const connection = await db.getConnection();
            try {
                const [rows] = await connection.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [LOGIN_BACKGROUND_IMAGE_KEY]);
                return Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).setting_value : defaultUrl;
            } finally { connection.release(); }
        } catch (error) { return defaultUrl; }
    });
}

export async function updateLoginBackgroundImage(newUrl: string, user: string) {
    const hasPermission = await checkPermissions(user, 'MANAGE_APP_SETTINGS');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`, [LOGIN_BACKGROUND_IMAGE_KEY, newUrl, newUrl]);
            await logUserAction(user, 'Update Settings', 'Updated login background.', connection);
            await connection.commit();
            delete settingsCache[LOGIN_BACKGROUND_IMAGE_KEY];
            revalidatePath('/');
            return { success: true };
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    } catch (error) { return { success: false, message: 'DB Error' }; }
}
