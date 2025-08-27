
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
        return (rows as any[]).map(app => {
            const nameField = app.responses?.find((r: any) => r.label.toLowerCase().includes('name'));
            const ageField = app.responses?.find((r: any) => r.label.toLowerCase().includes('age'));
            
            return {
                ...app,
                name: nameField ? nameField.answer : "Unknown Applicant",
                age: ageField ? parseInt(ageField.answer, 10) : 0,
                // A bit of a hack to find the "reason"
                reasonForApplying: app.responses?.find((r: any) => r.type === 'textarea')?.answer || 'No reason provided.',
                submittedAt: new Date(app.submittedAt),
            }
        });
    } catch (error) {
        console.error("Failed to fetch applications:", error);
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

