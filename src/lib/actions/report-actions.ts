
'use server';

import { z } from 'zod';
import db from '../db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import type { BugReport, Suggestion, ReportStatus } from '../types';


// Schema for validating report submission from the client
const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
});

async function createTablesIfNeeded() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS bug_reports (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
                submittedAt DATETIME NOT NULL
            );
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS suggestions (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
                submittedAt DATETIME NOT NULL
            );
        `);
    } catch (error) {
        console.error("Failed to create report tables:", error);
        throw new Error("Database schema setup failed.");
    }
}


export async function submitBugReport(data: unknown) {
    const validation = reportSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data.', issues: validation.error.issues };
    }
    const { title, description } = validation.data;
    
    try {
        await createTablesIfNeeded();
        await db.query(
            'INSERT INTO bug_reports (id, title, description, submittedAt) VALUES (?, ?, ?, ?)',
            [randomUUID(), title, description, new Date()]
        );
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Submitting bug report failed:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function submitSuggestion(data: unknown) {
    const validation = reportSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data.', issues: validation.error.issues };
    }
    const { title, description } = validation.data;
    
    try {
        await createTablesIfNeeded();
        await db.query(
            'INSERT INTO suggestions (id, title, description, submittedAt) VALUES (?, ?, ?, ?)',
            [randomUUID(), title, description, new Date()]
        );
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Submitting suggestion failed:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function getBugReports(): Promise<BugReport[]> {
    try {
        await createTablesIfNeeded();
        const [rows] = await db.query('SELECT * FROM bug_reports ORDER BY submittedAt DESC');
        return rows as BugReport[];
    } catch (error) {
        console.error("Failed to fetch bug reports:", error);
        return [];
    }
}

export async function getSuggestions(): Promise<Suggestion[]> {
    try {
        await createTablesIfNeeded();
        const [rows] = await db.query('SELECT * FROM suggestions ORDER BY submittedAt DESC');
        return rows as Suggestion[];
    } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        return [];
    }
}


const statusSchema = z.enum(["Pending", "In Progress", "Completed", "Rejected"]);

export async function updateBugReportStatus(id: string, status: ReportStatus) {
    const validatedStatus = statusSchema.parse(status);
    try {
        await db.query('UPDATE bug_reports SET status = ? WHERE id = ?', [validatedStatus, id]);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Updating bug report status failed:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function deleteBugReport(id: string) {
    try {
        await db.query('DELETE FROM bug_reports WHERE id = ?', [id]);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Deleting bug report failed:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function updateSuggestionStatus(id: string, status: ReportStatus) {
    const validatedStatus = statusSchema.parse(status);
    try {
        await db.query('UPDATE suggestions SET status = ? WHERE id = ?', [validatedStatus, id]);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Updating suggestion status failed:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}

export async function deleteSuggestion(id: string) {
    try {
        await db.query('DELETE FROM suggestions WHERE id = ?', [id]);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Deleting suggestion failed:', error);
        return { success: false, message: 'Database operation failed.' };
    }
}
