
'use server';

import { z } from 'zod';
import db from '../db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export interface FormFieldOption {
    id?: string;
    value: string;
}

export interface FormFieldData {
    id?: string;
    type: 'text' | 'textarea' | 'select';
    label: string;
    options?: FormFieldOption[];
}

// Schema for validating fields from the client
const formFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "textarea", "select"]),
  options: z.array(z.object({ id: z.string().optional(), value: z.string() })).optional(),
});
const formFieldsSchema = z.array(formFieldSchema);


export async function getApplicationFormFields(): Promise<FormFieldData[]> {
    const [fields] = await db.query('SELECT * FROM application_form_fields ORDER BY `order` ASC');

    const fieldsWithOpts = await Promise.all((fields as any[]).map(async (field) => {
        if (field.type === 'select') {
            const [options] = await db.query('SELECT id, value FROM application_field_options WHERE field_id = ?', [field.id]);
            return { ...field, options };
        }
        return field;
    }));

    return fieldsWithOpts;
}


export async function saveApplicationFormFields(fields: FormFieldData[]) {
    const validatedFields = formFieldsSchema.parse(fields);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Simple approach: delete all and re-insert. Good for this scale.
        await connection.query('DELETE FROM application_field_options');
        await connection.query('DELETE FROM application_form_fields');

        for (const [index, field] of validatedFields.entries()) {
            const fieldId = field.id || randomUUID();
            await connection.query(
                'INSERT INTO application_form_fields (id, type, label, `order`) VALUES (?, ?, ?, ?)',
                [fieldId, field.type, field.label, index]
            );

            if (field.type === 'select' && field.options) {
                for (const option of field.options) {
                    await connection.query(
                        'INSERT INTO application_field_options (id, field_id, value) VALUES (?, ?, ?)',
                        [option.id || randomUUID(), fieldId, option.value]
                    );
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
    revalidatePath('/applications/edit');
}

export async function submitApplication(responses: Record<string, any>) {
    const fields = await getApplicationFormFields();

    const formattedResponses = fields.map(field => ({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answer: responses[field.id!] || ''
    }));

    try {
        await db.query(
            'INSERT INTO applications (id, responses) VALUES (?, ?)',
            [randomUUID(), JSON.stringify(formattedResponses)]
        );
    } catch(error) {
        console.error("Failed to submit application:", error);
        throw new Error("Could not save application to the database.");
    }

    revalidatePath('/applications');
}
