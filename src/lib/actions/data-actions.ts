
'use server';

import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, PersonnelEvent, Rank } from "../types";
import db, { ensureDbInitialized } from '../db';

export async function getPersonnel(): Promise<Personnel[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM detailed_farm_orders o WHERE o.completed_by = p.name) as ordersCompleted
            FROM personnel p
        `);

        if (!Array.isArray(rows)) {
            return [];
        }

        return (rows as any[]).map(p => ({
            ...p,
            discordUsername: p.discord_username,
            phoneNumber: p.phone_number,
            bankAccount: p.bank_account,
            hireDate: p.hire_date ? new Date(p.hire_date).toISOString() : null,
            status: p.status || 'Active',
            loa_until: p.loa_until ? new Date(p.loa_until).toISOString() : null,
            is_rehired: !!p.is_rehired,
            ordersCompleted: Number(p.ordersCompleted || 0)
        }));

    } catch (error) {
        console.error("Failed to fetch personnel:", error);
        return [];
    } finally {
        connection.release();
    }
}

export async function getArchivedPersonnel(): Promise<ArchivedPersonnel[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM archived_personnel ORDER BY date DESC');
        return (rows as any[]).map(p => ({
            ...p,
            discordUsername: p.discord_username,
        }));
    } catch (error: any) {
        console.error("Failed to fetch archived personnel:", error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS archived_personnel (
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
        return [];
    } finally {
        connection.release();
    }
}

export async function getBlacklistedPersonnel(): Promise<BlacklistedPersonnel[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM blacklisted_personnel');
        return (rows as any[]).map(p => ({
            ...p, 
            discordUsername: p.discord_username,
            dateAdded: new Date(p.dateAdded).toISOString().split('T')[0]
        }));
    } catch (error: any) {
        console.error("Failed to fetch blacklisted personnel:", error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS blacklisted_personnel (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    discord_username VARCHAR(255),
                    reason TEXT,
                    dateAdded DATETIME NOT NULL
                )
            `);
            return [];
        }
        return [];
    } finally {
        connection.release();
    }
}

const findResponse = (responses: any[], label: string) => {
  return responses.find(r => r.label && r.label.toLowerCase().includes(label.toLowerCase()))?.answer || undefined;
}

export async function getApplications(): Promise<Application[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        // Ensure reviewer columns exist
        const [reviewerIdCol] = await connection.query("SHOW COLUMNS FROM applications LIKE 'reviewer_id'");
        if (Array.isArray(reviewerIdCol) && reviewerIdCol.length === 0) {
            await connection.query("ALTER TABLE applications ADD COLUMN reviewer_id VARCHAR(36) NULL, ADD COLUMN reviewedAt DATETIME NULL, ADD COLUMN reviewer_comment TEXT NULL");
        }

        const [rows] = await connection.query(`
          SELECT
            a.*,
            u.id as reviewerId,
            u.username as reviewerUsername,
            u.avatarUrl as reviewerAvatarUrl
          FROM applications a
          LEFT JOIN users u ON a.reviewer_id = u.id
          ORDER BY a.submittedAt DESC
        `);
        
        if (!Array.isArray(rows)) {
            return [];
        }

        return (rows as any[]).map(app => {
            let parsedResponses = [];
            try {
                parsedResponses = typeof app.responses === 'string' ? JSON.parse(app.responses) : (app.responses || []);
            } catch (e) {
                console.error(`Failed to parse responses for application ${app.id}`);
            }

            return {
                ...app,
                name: findResponse(parsedResponses, 'name') || "Unknown Applicant",
                discordUsername: findResponse(parsedResponses, 'discord'),
                reasonForApplying: parsedResponses.find((r: any) => r.type === 'textarea')?.answer || 'No reason provided.',
                submittedAt: new Date(app.submittedAt),
                reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : null,
                reviewer: app.reviewerId ? {
                    id: app.reviewerId,
                    username: app.reviewerUsername,
                    avatarUrl: app.reviewerAvatarUrl,
                } : null,
                responses: parsedResponses,
            }
        });
    } catch (error: any) {
        console.error("Failed to fetch applications:", error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
             await connection.query(`
                CREATE TABLE IF NOT EXISTS applications (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    responses JSON NOT NULL,
                    status ENUM('Pending', 'Approved', 'Rejected', 'Under Review') NOT NULL DEFAULT 'Pending',
                    submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    reviewer_comment TEXT,
                    reviewer_id VARCHAR(36),
                    reviewedAt DATETIME
                );
            `);
        }
        return [];
    } finally {
        connection.release();
    }
}

export async function getRecentActivity(): Promise<PersonnelEvent[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM personnel_events ORDER BY date DESC LIMIT 10');
        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as any[]).map(e => ({...e, date: new Date(e.date)}));
    } catch(error: any) {
        console.error("Failed to fetch recent activity:", error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS personnel_events (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    personnel_name VARCHAR(255) NOT NULL,
                    event_type ENUM('Hired', 'Fired', 'Promoted', 'Demoted', 'Rehired') NOT NULL,
                    description VARCHAR(255) NOT NULL,
                    date DATETIME NOT NULL
                )
            `);
        }
        return [];
    } finally {
        connection.release();
    }
}
