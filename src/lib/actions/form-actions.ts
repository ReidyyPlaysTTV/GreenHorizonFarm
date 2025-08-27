
'use server';

import { z } from 'zod';
import db from '../db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import type { FormFieldData } from '../types';
import { logUserAction } from './audit-log-actions';

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

    // Find the first two 'text' fields to use for name and age.
    // This is more robust than relying on labels.
    const textFields = fields.filter(f => f.type === 'text');
    const nameField = textFields[0];
    const ageField = textFields[1];
    
    const nameFromResponses = nameField ? (responses[nameField.id!] || "Unknown Applicant") : "Unknown Applicant";
    const ageFromResponses = ageField ? (responses[ageField.id!] || 0) : 0;


    const formattedResponses = fields.map(field => ({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answer: responses[field.id!] || ''
    }));

    try {
        await db.query(
            'INSERT INTO applications (id, name, age, responses) VALUES (?, ?, ?, ?)',
            [randomUUID(), nameFromResponses, parseInt(String(ageFromResponses), 10) || 0, JSON.stringify(formattedResponses)]
        );
    } catch(error) {
        console.error("Failed to submit application:", error);
        throw new Error("Could not save application to the database.");
    }

    revalidatePath('/applications');
}

const applicationStatusSchema = z.enum(['Approved', 'Rejected']);

export async function updateApplicationStatus(applicationId: string, status: 'Approved' | 'Rejected', user: string) {
  const validatedStatus = applicationStatusSchema.parse(status);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [validatedStatus, applicationId]
    );

    const [appRows] = await connection.query('SELECT name FROM applications WHERE id = ?', [applicationId]);
    const appName = (appRows as any)[0]?.name || 'Unknown Applicant';

    await logUserAction(user, 'Update Application Status', `${validatedStatus} application for ${appName}.`, connection);
    
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
