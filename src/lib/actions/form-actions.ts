
'use server';

import { z } from 'zod';
import db from '../db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import type { FormFieldData, BlacklistedPersonnel, Application } from '../types';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';

// Schema for validating fields from the client
const formFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "textarea", "select"]),
  required: z.boolean(),
  options: z.array(z.object({ id: z.string().optional(), value: z.string() })).optional(),
});
const formFieldsSchema = z.array(formFieldSchema);


export async function getApplicationFormFields(): Promise<FormFieldData[]> {
    try {
        const [fields] = await db.query('SELECT * FROM application_form_fields ORDER BY `order` ASC');

        if (!Array.isArray(fields)) {
            return [];
        }

        const fieldsWithOpts = await Promise.all((fields as any[]).map(async (field) => {
            if (field.type === 'select') {
                const [options] = await db.query('SELECT id, value FROM application_field_options WHERE field_id = ?', [field.id]);
                return { ...field, required: !!field.required, options: Array.isArray(options) ? options : [] };
            }
            return { ...field, required: !!field.required };
        }));

        return fieldsWithOpts;
    } catch (error) {
        console.error("Failed to get application form fields:", error);
        // If the table doesn't exist, return an empty array to prevent crashing.
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
            return [];
        }
        throw error;
    }
}


export async function saveApplicationFormFields(fields: FormFieldData[], user: string) {
    const hasPermission = await checkPermissions(user, 'EDIT_APPLICATION_FORM');
    if (!hasPermission) {
        throw new Error('You do not have permission to perform this action.');
    }

    const validatedFields = formFieldsSchema.parse(fields);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Clear existing fields and options
        await connection.query('DELETE FROM application_field_options');
        await connection.query('DELETE FROM application_form_fields');

        for (const [index, field] of validatedFields.entries()) {
            // Use existing ID or generate a new one. `new-` prefix indicates a temp client-side ID.
            const fieldId = field.id && !field.id.startsWith('new-') ? field.id : randomUUID();
            
            await connection.query(
                'INSERT INTO application_form_fields (id, type, label, `order`, required) VALUES (?, ?, ?, ?, ?)',
                [fieldId, field.type, field.label, index, field.required]
            );

            if (field.type === 'select' && field.options) {
                for (const option of field.options) {
                    if (option.value) { // Don't save empty options
                         const optionId = option.id && !option.id.startsWith('new-') ? option.id : randomUUID();
                        await connection.query(
                            'INSERT INTO application_field_options (id, field_id, value) VALUES (?, ?, ?)',
                            [optionId, fieldId, option.value]
                        );
                    }
                }
            }
        }
        
        await logUserAction(user, 'Update Form', 'Updated the application form fields.', connection);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Failed to save form fields:", error);
        throw new Error("Database operation failed.");
    } finally {
        connection.release();
    }

    revalidatePath('/apply');
    revalidatePath('/applications');
    revalidatePath('/logs');
}

export async function submitApplication(responses: Record<string, any>) {
    const fields = await getApplicationFormFields();
    
    const formattedResponses = fields.map(field => ({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answer: responses[field.id!] || ''
    }));

    const discordField = fields.find(f => f.label.toLowerCase().includes('discord'));
    const discordUsername = discordField ? responses[discordField.id!] : null;
    const applicationId = `DOC${Math.floor(10000000 + Math.random() * 90000000)}`;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let status: 'Pending' | 'Rejected' = 'Pending';
        let logDescription = "A new application was submitted.";
        const applicantName = fields.find(f => f.label.toLowerCase().includes('name'))?.label || "Unknown Applicant";
        const applicantNameValue = responses[fields.find(f => f.label.toLowerCase().includes('name'))?.id!] || "Unknown";


        if (discordUsername) {
            const [blacklistRows] = await connection.query('SELECT * FROM blacklisted_personnel WHERE discord_username = ?', [discordUsername]);
            const blacklistedUser = (blacklistRows as BlacklistedPersonnel[])[0];

            if (blacklistedUser) {
                status = 'Rejected';
                logDescription = `Application from '${applicantNameValue}' was auto-denied due to matching blacklisted Discord username. Reason: ${blacklistedUser.reason}`;
                 await logUserAction('System', 'Application Auto-Denied', logDescription, connection);
            }
        }

        await connection.query(
            'INSERT INTO applications (id, responses, status) VALUES (?, ?, ?)',
            [applicationId, JSON.stringify(formattedResponses), status]
        );
        
        await connection.commit();
        revalidatePath('/applications');
        revalidatePath('/logs');
        return { success: true, applicationId };
    } catch(error) {
        await connection.rollback();
        console.error("Failed to submit application:", error);
        return { success: false, message: "Could not save application to the database." };
    } finally {
        connection.release();
    }
}

const applicationStatusSchema = z.enum(['Approved', 'Rejected']);

export async function updateApplicationStatus(applicationId: string, status: 'Approved' | 'Rejected', user: string) {
  const hasPermission = await checkPermissions(user, 'MANAGE_APPLICATIONS');
  if (!hasPermission) {
    throw new Error('You do not have permission to perform this action.');
  }

  const validatedStatus = applicationStatusSchema.parse(status);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [validatedStatus, applicationId]
    );

    const [appRows]: any[] = await connection.query('SELECT responses FROM applications WHERE id = ?', [applicationId]);
    const responses = JSON.parse(appRows[0].responses);
    const applicantName = responses.find((r: any) => r.label.toLowerCase().includes('name'))?.answer || 'Unknown Applicant';
    
    await logUserAction(user, 'Update Application Status', `${validatedStatus} application for ${applicantName}.`, connection);
    
    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error(`Failed to update application status to ${validatedStatus}:`, error);
    throw new Error('Database operation failed.');
  } finally {
    connection.release();
  }

  revalidatePath('/applications');
  revalidatePath('/logs');
}

export async function getApplicationById(id: string) {
    if (!id) {
        return { success: false, message: "Application ID is required." };
    }
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM applications WHERE id = ?', [id]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return { success: false, message: "Application not found." };
        }
        const app = (rows as any)[0];
        const parsedResponses = JSON.parse(app.responses);
        const appName = parsedResponses.find((r: any) => r.label.toLowerCase().includes('name'))?.answer || "Unknown Applicant";

        const result: Application = {
            id: app.id,
            status: app.status,
            submittedAt: new Date(app.submittedAt),
            name: appName,
            responses: parsedResponses,
            discordUsername: parsedResponses.find((r: any) => r.label.toLowerCase().includes('discord'))?.answer,
            reasonForApplying: parsedResponses.find((r: any) => r.type === 'textarea')?.answer || 'No reason provided.',
        };
        return { success: true, application: result };
    } catch (error) {
        console.error("Failed to fetch application by ID:", error);
        return { success: false, message: "Database operation failed." };
    } finally {
        connection.release();
    }
}
