
'use server';

import db from '../db';
import { revalidatePath } from 'next/cache';
import type { CallsignLog } from '../types';

async function createCallsignLogTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS callsign_logs (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            callsign VARCHAR(10) NOT NULL,
            personnel_name VARCHAR(255) NOT NULL,
            action ENUM('Assigned', 'Unassigned') NOT NULL,
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function logCallsignChange(
    callsign: string, 
    personnelName: string, 
    action: 'Assigned' | 'Unassigned',
    dbConnection?: any // Allow passing an existing connection for transactions
) {
    const connection = dbConnection || await db.getConnection();
    try {
        await createCallsignLogTableIfNeeded(connection);
        await connection.query(
            'INSERT INTO callsign_logs (id, callsign, personnel_name, action) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), callsign, personnelName, action]
        );
    } catch (error) {
        console.error("Failed to log callsign change:", error);
        // Don't re-throw, as this might be part of a larger transaction
        // that shouldn't fail just because logging did.
    } finally {
        if (!dbConnection) {
            connection.release();
        }
    }
}


export async function getCallsignLogs(): Promise<CallsignLog[]> {
    const connection = await db.getConnection();
    try {
        await createCallsignLogTableIfNeeded(connection);
        const [rows] = await connection.query('SELECT * FROM callsign_logs ORDER BY timestamp DESC LIMIT 50');
        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as any[]).map(log => ({ ...log, timestamp: new Date(log.timestamp) }));
    } catch (error) {
        console.error("Failed to fetch callsign logs:", error);
        return [];
    } finally {
        connection.release();
    }
}
