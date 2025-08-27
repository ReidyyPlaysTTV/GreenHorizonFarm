
'use server';

import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, PersonnelEvent } from "../types";
import db from '../db';
import { rankToDepartmentMap, rankInsignias, rankOrder } from "../data";

export async function getPersonnel(): Promise<Personnel[]> {
    try {
        const [rows] = await db.query('SELECT * FROM personnel');
        if (!Array.isArray(rows)) {
            return [];
        }

        const personnel = (rows as any[]).map(p => ({
            ...p,
            department: rankToDepartmentMap[p.rank] || p.department, // Override department based on rank
            avatarUrl: rankInsignias[p.rank] || p.avatarUrl || "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png",
        }));
        
        // Sort personnel by rank order, then by callsign
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
    }
}

export async function getArchivedPersonnel(): Promise<ArchivedPersonnel[]> {
    try {
        const [rows] = await db.query('SELECT * FROM archived_personnel ORDER BY date DESC');
        return rows as ArchivedPersonnel[];
    } catch (error) {
        console.error("Failed to fetch archived personnel:", error);
        return [];
    }
}

export async function getBlacklistedPersonnel(): Promise<BlacklistedPersonnel[]> {
     try {
        const [rows] = await db.query('SELECT * FROM blacklisted_personnel');
        return (rows as any[]).map(p => ({...p, dateAdded: new Date(p.dateAdded).toISOString().split('T')[0]}));
    } catch (error) {
        console.error("Failed to fetch blacklisted personnel:", error);
        return [];
    }
}

export async function getApplications(): Promise<Application[]> {
    try {
        const [rows] = await db.query('SELECT * FROM applications ORDER BY submittedAt DESC');
        
        if (!Array.isArray(rows)) {
            return [];
        }

        return (rows as any[]).map(app => {
            let reason = 'No reason provided.';
            // Ensure responses is an array before trying to find something in it.
            if (app.responses && Array.isArray(app.responses)) {
                // Find a field that is a textarea to use as the main reason.
                const reasonField = app.responses.find((r: any) => r.type === 'textarea');
                if (reasonField && reasonField.answer) {
                    reason = reasonField.answer;
                } else {
                    // Fallback to the first answer if no textarea is available
                    const firstAnswer = app.responses[0]?.answer;
                    if(firstAnswer) reason = firstAnswer;
                }
            }
            
            return {
                ...app,
                name: app.name || "Unknown Applicant",
                age: app.age || 0,
                reasonForApplying: reason,
                submittedAt: new Date(app.submittedAt),
            }
        });
    } catch (error) {
        console.error("Failed to fetch applications:", error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            return [];
        }
        // Return empty array on other errors as well to prevent crashes
        return [];
    }
}

export async function getRecentActivity(): Promise<PersonnelEvent[]> {
    try {
        const [rows] = await db.query('SELECT * FROM personnel_events ORDER BY date DESC LIMIT 10');
        if (!Array.isArray(rows)) {
            return [];
        }
        return (rows as any[]).map(e => ({...e, date: new Date(e.date)}));
    } catch(error) {
         console.error("Failed to fetch recent activity:", error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            await db.query(`
                CREATE TABLE IF NOT EXISTS personnel_events (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    personnel_name VARCHAR(255) NOT NULL,
                    event_type ENUM('Hired', 'Fired', 'Promoted', 'Demoted') NOT NULL,
                    description VARCHAR(255) NOT NULL,
                    date DATETIME NOT NULL
                )
            `);
            return [];
        }
        return [];
    }
}
