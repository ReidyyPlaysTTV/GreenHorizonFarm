

'use server';

import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, PersonnelEvent } from "../types";
import db from '../db';
import { rankToDepartmentMap, rankOrder } from "../data";

async function createPersonnelTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS personnel (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            rank VARCHAR(255) NOT NULL,
            badgeNumber VARCHAR(10) NOT NULL UNIQUE,
            discord_username VARCHAR(255),
            department VARCHAR(255),
            status ENUM('Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended') NOT NULL DEFAULT 'Active',
            loa_until DATE,
            is_rehired BOOLEAN NOT NULL DEFAULT FALSE,
            userId VARCHAR(36)
        )
    `);
    const [columns] = await connection.query("SHOW COLUMNS FROM personnel LIKE 'userId'");
    if (Array.isArray(columns) && columns.length === 0) {
        await connection.query("ALTER TABLE personnel ADD COLUMN userId VARCHAR(36) NULL, ADD INDEX (userId)");
    }
}


export async function getPersonnel(): Promise<Personnel[]> {
    const connection = await db.getConnection();
    try {
        await createPersonnelTableIfNeeded(connection);
        const [rows] = await connection.query('SELECT * FROM personnel');
        if (!Array.isArray(rows)) {
            return [];
        }

        const personnel = (rows as any[]).map(p => ({
            ...p,
            department: rankToDepartmentMap[p.rank] || p.department,
            status: p.status || 'Active',
            loa_until: p.loa_until ? new Date(p.loa_until).toISOString() : null,
            is_rehired: !!p.is_rehired,
        }));
        
        personnel.sort((a, b) => {
            const rankIndexA = rankOrder.indexOf(a.rank);
            const rankIndexB = rankOrder.indexOf(b.rank);
            if (rankIndexA !== rankIndexB) {
                return rankIndexA - rankIndexB;
            }
            return parseInt(a.badgeNumber) - parseInt(b.badgeNumber);
        });

        return personnel;

    } catch (error) {
        console.error("Failed to fetch personnel:", error);
        return [];
    } finally {
        connection.release();
    }
}

export async function getArchivedPersonnel(): Promise<ArchivedPersonnel[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM archived_personnel ORDER BY date DESC');
        return (rows as any[]).map(p => ({
            ...p,
            discordUsername: p.discord_username,
        }));
    } catch (error) {
        console.error("Failed to fetch archived personnel:", error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            await connection.query(`
                CREATE TABLE archived_personnel (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    rank VARCHAR(255) NOT NULL,
                    discord_username VARCHAR(255),
                    status ENUM('Fired', 'Resigned') NOT NULL,
                    date DATETIME NOT NULL,
                    reason TEXT
                )
            `);
            return [];
         }
          if (error instanceof Error && 'code' in error && (error as any).code.includes('ER_UNKNOWN_COLUMN')) {
             if ((error as any).sqlMessage.includes('discord_username')) {
                await connection.query("ALTER TABLE archived_personnel ADD COLUMN discord_username VARCHAR(255)");
             }
             return getArchivedPersonnel();
         }
        return [];
    } finally {
        connection.release();
    }
}

export async function getBlacklistedPersonnel(): Promise<BlacklistedPersonnel[]> {
    const connection = await db.getConnection();
     try {
        const [rows] = await connection.query('SELECT * FROM blacklisted_personnel');
        return (rows as any[]).map(p => ({
            ...p, 
            discordUsername: p.discord_username,
            dateAdded: new Date(p.dateAdded).toISOString().split('T')[0]
        }));
    } catch (error) {
        console.error("Failed to fetch blacklisted personnel:", error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            await connection.query(`
                CREATE TABLE blacklisted_personnel (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    discord_username VARCHAR(255),
                    reason TEXT,
                    dateAdded DATETIME NOT NULL
                )
            `);
            return [];
        }
         if (error instanceof Error && 'code' in error && (error as any).code.includes('ER_UNKNOWN_COLUMN')) {
             if ((error as any).sqlMessage.includes('discord_username')) {
                await connection.query("ALTER TABLE blacklisted_personnel ADD COLUMN discord_username VARCHAR(255)");
             }
             return getBlacklistedPersonnel();
         }
        return [];
    } finally {
        connection.release();
    }
}

// Helper to find a response by its label, case-insensitively
const findResponse = (responses: any[], label: string) => {
  return responses.find(r => r.label && r.label.toLowerCase().includes(label))?.answer || undefined;
}

export async function getApplications(): Promise<Application[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM applications ORDER BY submittedAt DESC');
        
        if (!Array.isArray(rows)) {
            return [];
        }

        return (rows as any[]).map(app => {
            let parsedResponses = [];
            if (typeof app.responses === 'string') {
                try {
                    parsedResponses = JSON.parse(app.responses);
                } catch (e) {
                    console.error(`Failed to parse responses for application ${app.id}:`, e);
                }
            } else if (Array.isArray(app.responses)) {
                parsedResponses = app.responses;
            }

            // Extract key information
            const appName = findResponse(parsedResponses, 'name') || "Unknown Applicant";
            const appDiscord = findResponse(parsedResponses, 'discord');
            const reason = parsedResponses.find(r => r.type === 'textarea')?.answer || 'No reason provided.';

            return {
                ...app,
                name: appName,
                discordUsername: appDiscord,
                reasonForApplying: reason,
                submittedAt: new Date(app.submittedAt),
                responses: parsedResponses,
            }
        });
    } catch (error) {
        console.error("Failed to fetch applications:", error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
             await connection.query(`
                CREATE TABLE applications (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    responses JSON NOT NULL,
                    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
                    submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            `);
            return [];
        }
        return [];
    } finally {
        connection.release();
    }
}

export async function getRecentActivity(): Promise<PersonnelEvent[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM personnel_events ORDER BY date DESC LIMIT 10');
        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as any[]).map(e => ({...e, date: new Date(e.date)}));
    } catch(error) {
         console.error("Failed to fetch recent activity:", error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS personnel_events (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    personnel_name VARCHAR(255) NOT NULL,
                    event_type ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL,
                    description VARCHAR(255) NOT NULL,
                    date DATETIME NOT NULL
                )
            `);
            return [];
        }
        // Handle migration for new event_type
        if (error instanceof Error && 'code' in error && (error as any).code.includes('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD')) {
             await connection.query("ALTER TABLE personnel_events MODIFY COLUMN event_type ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL");
             return getRecentActivity(); // Retry
        }
        return [];
    } finally {
        connection.release();
    }
}
