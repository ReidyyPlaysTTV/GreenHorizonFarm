
import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, Department } from "./types";
import db from './db';

const departments: Department[] = ["Commissioners Office", "High Command", "Command", "NCOS", "Corrections", "Training"];

async function getPersonnel(): Promise<Personnel[]> {
    try {
        const [rows] = await db.query('SELECT * FROM personnel');
        return rows as Personnel[];
    } catch (error) {
        console.error("Failed to fetch personnel:", error);
        return [];
    }
}

async function getArchivedPersonnel(): Promise<ArchivedPersonnel[]> {
    try {
        const [rows] = await db.query('SELECT * FROM archived_personnel');
        return rows as ArchivedPersonnel[];
    } catch (error) {
        console.error("Failed to fetch archived personnel:", error);
        return [];
    }
}

async function getBlacklistedPersonnel(): Promise<BlacklistedPersonnel[]> {
     try {
        const [rows] = await db.query('SELECT * FROM blacklisted_personnel');
        return (rows as any[]).map(p => ({...p, dateAdded: new Date(p.dateAdded).toISOString().split('T')[0]}));
    } catch (error) {
        console.error("Failed to fetch blacklisted personnel:", error);
        return [];
    }
}

async function getApplications(): Promise<Application[]> {
    try {
        const [rows] = await db.query('SELECT * FROM applications');
        
        if (!Array.isArray(rows)) {
            return [];
        }

        return (rows as any[]).map(app => {
            let reason = 'No reason provided.';
            if (app.responses && Array.isArray(app.responses)) {
                const reasonField = app.responses.find((r: any) => r.type === 'textarea');
                if (reasonField && reasonField.answer) {
                    reason = reasonField.answer;
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
         if (error instanceof Error && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
            return [];
        }
        return [];
    }
}


export { 
    getPersonnel,
    getArchivedPersonnel,
    getBlacklistedPersonnel,
    getApplications,
    departments 
};
