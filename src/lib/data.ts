

import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, Department } from "./types";
import db from './db';

const departments: Department[] = ["Commissioners Office", "High Command", "Command", "NCOS", "Corrections", "Training"];

const rankInsignias: Record<string, string> = {
    "Commissioner": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/gota.png",
    "Deputy Comissioner": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/gota.png",
    "Warden": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/general.png",
    "Deputy Warden": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/lt-general.png",
    "Major": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/major.png",
    "Captain": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/captain.png",
    "Lieutenant": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/first-lieutenant.png",
    "Corrections Sergeant": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/staff-sergeant.png",
    "Senior Corrections Officer": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/corporal.png",
    "Correctional Officer": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png",
    "Probationary Correctional Officer": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png",
};

const rankToDepartmentMap: Record<string, Department> = {
    "Commissioner": "Commissioners Office",
    "Deputy Comissioner": "Commissioners Office",
    "Warden": "High Command",
    "Deputy Warden": "High Command",
    "Major": "High Command",
    "Captain": "Command",
    "Lieutenant": "Command",
    "Corrections Sergeant": "NCOS",
    "Senior Corrections Officer": "Corrections",
    "Correctional Officer": "Corrections",
    "Probationary Correctional Officer": "Training",
};

const rankOrder = [
    "Commissioner",
    "Deputy Comissioner",
    "Warden",
    "Deputy Warden",
    "Major",
    "Captain",
    "Lieutenant",
    "Corrections Sergeant",
    "Senior Corrections Officer",
    "Correctional Officer",
    "Probationary Correctional Officer",
];

async function getPersonnel(): Promise<Personnel[]> {
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


export { 
    getPersonnel,
    getArchivedPersonnel,
    getBlacklistedPersonnel,
    getApplications,
    departments,
    rankOrder
};
