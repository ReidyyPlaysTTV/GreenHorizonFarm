
'use server';

import { z } from 'zod';
import db from '../db';
import { revalidatePath } from 'next/cache';
import type { FormFieldData, Application } from '../types';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import { DISCORD_ROLES } from '../discord';

const APPLICATION_WEBHOOK = process.env.DISCORD_APPLICATION_WEBHOOK;

async function sendApplicationWebhook(name: string, id: string) {
    if (!APPLICATION_WEBHOOK) {
        console.warn("Application Webhook URL not configured in .env.local");
        return;
    }
    try {
        const payload = {
            content: `<@&${DISCORD_ROLES.MANAGER}> <@&${DISCORD_ROLES.CEO}> <@&${DISCORD_ROLES.CO_CEO}>`,
            embeds: [{
                title: "🚜 New Employment Application Received",
                color: 3447003, // Blue
                description: `A new individual has applied to join Green Horizon Farm.`,
                fields: [
                    { name: "Applicant Name", value: `**${name}**`, inline: true },
                    { name: "Reference ID", value: `\`${id}\``, inline: true },
                    { name: "Portal Link", value: "[Recruitment Center](https://green-horizon-farm.vercel.app/applications)" }
                ],
                footer: { text: "Green Horizon Recruitment Hub" },
                timestamp: new Date().toISOString()
            }]
        };
        await fetch(APPLICATION_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) { console.error("Application Webhook Failed", e); }
}

export async function getApplicationFormFields(): Promise<FormFieldData[]> {
    try {
        const [fields] = await db.query('SELECT * FROM application_form_fields ORDER BY `field_order` ASC');
        if (!Array.isArray(fields) || fields.length === 0) {
            return [
                { id: "seed_name", label: "Full IC Name", type: "text", required: true },
                { id: "seed_state_id", label: "State ID", type: "text", required: true },
                { id: "seed_phone", label: "Phone Number", type: "text", required: true },
                { id: "seed_about", label: "Tell us about yourself.", type: "textarea", required: true },
            ];
        }
        return await Promise.all((fields as any[]).map(async (field) => {
            if (field.type === 'select') {
                const [options] = await db.query('SELECT id, value FROM application_field_options WHERE field_id = ?', [field.id]);
                return { ...field, required: !!field.required, options: Array.isArray(options) ? options : [] };
            }
            return { ...field, required: !!field.required };
        }));
    } catch (error) { return []; }
}

export async function saveApplicationFormFields(fields: FormFieldData[], user: string) {
    const hasPermission = await checkPermissions(user, 'EDIT_APPLICATION_FORM');
    if (!hasPermission) throw new Error('Unauthorized');
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        await connection.query('DELETE FROM application_field_options');
        await connection.query('DELETE FROM application_form_fields');
        for (const [index, field] of fields.entries()) {
            const fieldId = field.id || crypto.randomUUID();
            await connection.query('INSERT INTO application_form_fields (id, type, label, `field_order`, required) VALUES (?, ?, ?, ?, ?)', [fieldId, field.type, field.label, index, field.required]);
            if (field.type === 'select' && field.options) {
                for (const opt of field.options) {
                    await connection.query('INSERT INTO application_field_options (id, field_id, value) VALUES (?, ?, ?)', [crypto.randomUUID(), fieldId, opt.value]);
                }
            }
        }
        await logUserAction(user, 'Update Form', 'Updated application form.', connection);
        await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    revalidatePath('/apply');
}

export async function submitApplication(responses: Record<string, any>) {
    const fields = await getApplicationFormFields();
    const formattedResponses = fields.map((field, index) => ({
        label: field.label,
        answer: responses[field.id || `field_${index}`] || ''
    }));
    const applicantName = formattedResponses.find(r => r.label.toLowerCase().includes('name'))?.answer || "Unknown";
    const id = `GH${Math.floor(10000000 + Math.random() * 90000000)}`;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO applications (id, responses, status) VALUES (?, ?, ?)', [id, JSON.stringify(formattedResponses), 'Pending']);
        await sendApplicationWebhook(applicantName, id);
        await connection.commit();
        revalidatePath('/applications');
        return { success: true, applicationId: id };
    } catch(error) { await connection.rollback(); return { success: false, message: "DB Error" }; }
    finally { connection.release(); }
}

export async function updateApplicationStatus(data: any) {
  const { applicationId, status, comment, user } = data;
  const hasPermission = await checkPermissions(user, 'MANAGE_APPLICATIONS');
  if (!hasPermission) throw new Error('Unauthorized');
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [userRows]: any = await connection.query('SELECT id FROM users WHERE username = ?', [user]);
    const userId = userRows[0]?.id;
    await connection.query('UPDATE applications SET status = ?, reviewer_comment = ?, reviewer_id = ?, reviewedAt = ? WHERE id = ?', [status, comment || null, status === 'Pending' ? null : userId, status === 'Pending' ? null : new Date(), applicationId]);
    await logUserAction(user, 'Update App Status', `${status} application ${applicationId}`, connection);
    await connection.commit();
    revalidatePath('/applications');
    return { success: true };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function getApplicationById(id: string) {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM applications WHERE id = ?', [id]);
        if (!Array.isArray(rows) || rows.length === 0) return { success: false, message: "Not found" };
        const app = (rows as any)[0];
        const resp = JSON.parse(app.responses);
        return { success: true, application: { ...app, submittedAt: new Date(app.submittedAt), responses: resp, name: resp.find((r:any) => r.label.toLowerCase().includes('name'))?.answer || "Unknown" } };
    } finally { connection.release(); }
}

export async function deleteApplication(id: string, user: string) {
    const hasPermission = await checkPermissions(user, 'DELETE_APPLICATIONS');
    if (!hasPermission) return { success: false, message: 'Unauthorized' };
    const connection = await db.getConnection();
    try {
        await connection.query('DELETE FROM applications WHERE id = ?', [id]);
        await logUserAction(user, 'Delete Application', `Deleted application ${id}`, connection);
        revalidatePath('/applications');
        return { success: true };
    } finally { connection.release(); }
}
