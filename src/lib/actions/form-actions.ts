
'use server';

import { z } from 'zod';
import db from '../db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import type { FormFieldData } from '../types';

// Schema for validating fields from the client
const formFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "textarea", "select"]),
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
                return { ...field, options: Array.isArray(options) ? options : [] };
            }
            return field;
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


export async function saveApplicationFormFields(fields: FormFieldData[]) {
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
                'INSERT INTO application_form_fields (id, type, label, `order`) VALUES (?, ?, ?, ?)',
                [fieldId, field.type, field.label, index]
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
}

export async function submitApplication(responses: Record<string, any>) {
    const fields = await getApplicationFormFields();

    const nameField = fields.find(f => f.label.toLowerCase().includes('name'));
    const ageField = fields.find(f => f.label.toLowerCase().includes('age'));
    
    const nameFromResponses = nameField ? responses[nameField.id!] : 'Unknown Applicant';
    const ageFromResponses = ageField ? responses[ageField.id!] : 0;


    const formattedResponses = fields.map(field => ({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answer: responses[field.id!] || ''
    }));

    try {
        await db.query(
            'INSERT INTO applications (id, name, age, responses) VALUES (?, ?, ?, ?)',
            [randomUUID(), nameFromResponses, parseInt(ageFromResponses, 10) || 0, JSON.stringify(formattedResponses)]
        );
    } catch(error) {
        console.error("Failed to submit application:", error);
        throw new Error("Could not save application to the database.");
    }

    revalidatePath('/applications');
}

const applicationStatusSchema = z.enum(['Approved', 'Rejected']);

export async function updateApplicationStatus(applicationId: string, status: 'Approved' | 'Rejected') {
  const validatedStatus = applicationStatusSchema.parse(status);

  try {
    await db.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [validatedStatus, applicationId]
    );
  } catch (error) {
    console.error(`Failed to update application status to ${validatedStatus}:`, error);
    throw new Error('Database operation failed.');
  }

  revalidatePath('/applications');
}
