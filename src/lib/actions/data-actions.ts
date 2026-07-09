
'use server';

import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, PersonnelEvent, Rank } from "../types";
import db, { ensureDbInitialized } from '../db';

export async function getPersonnel(): Promise<Personnel[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            // Explicit collation casting to prevent "Illegal mix of collations" errors
            const [rows] = await connection.query(`
                SELECT 
                    p.*,
                    (SELECT COUNT(*) 
                     FROM detailed_farm_orders o 
                     WHERE o.completed_by COLLATE utf8mb4_unicode_ci = p.name COLLATE utf8mb4_unicode_ci
                    ) as ordersCompleted
                FROM personnel p
            `);

            if (!Array.isArray(rows)) return [];

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
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to fetch personnel from database:", error);
        return [];
    }
}

export async function getArchivedPersonnel(): Promise<ArchivedPersonnel[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM archived_personnel ORDER BY date DESC');
            return (rows as any[]).map(p => ({
                ...p,
                discordUsername: p.discord_username,
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}

export async function getBlacklistedPersonnel(): Promise<BlacklistedPersonnel[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM blacklisted_personnel');
            return (rows as any[]).map(p => ({
                ...p, 
                discordUsername: p.discord_username,
                dateAdded: new Date(p.dateAdded).toISOString().split('T')[0]
            }));
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}

export async function getApplications(): Promise<Application[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            // Added collation cast for the JOIN
            const [rows] = await connection.query(`
              SELECT a.*, u.id as reviewerId, u.username as reviewerUsername, u.avatarUrl as reviewerAvatarUrl
              FROM applications a 
              LEFT JOIN users u ON a.reviewer_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci 
              ORDER BY a.submittedAt DESC
            `);
            
            if (!Array.isArray(rows)) return [];

            return (rows as any[]).map(app => {
                let parsedResponses = [];
                try { parsedResponses = typeof app.responses === 'string' ? JSON.parse(app.responses) : (app.responses || []); } catch (e) {}

                return {
                    ...app,
                    name: parsedResponses.find((r: any) => r.label?.toLowerCase().includes('name'))?.answer || "Applicant",
                    submittedAt: new Date(app.submittedAt),
                    reviewer: app.reviewerId ? { id: app.reviewerId, username: app.reviewerUsername, avatarUrl: app.reviewerAvatarUrl } : null,
                    responses: parsedResponses,
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return [];
    }
}

export async function getRecentActivity(): Promise<PersonnelEvent[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM personnel_events ORDER BY date DESC LIMIT 10');
            if (!Array.isArray(rows)) return [];
            return (rows as any[]).map(e => ({...e, date: new Date(e.date)}));
        } finally {
            connection.release();
        }
    } catch(error) {
        console.error("Failed to fetch recent activity:", error);
        return [];
    }
}
