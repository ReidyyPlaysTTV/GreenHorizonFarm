
'use server';

import db, { ensureDbInitialized } from '../db';
import type { AppUser, AccessRequest, Personnel } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';

export async function getUsers(): Promise<AppUser[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [users] = await connection.query('SELECT id, username, roles, createdAt, avatarUrl, status FROM users ORDER BY username ASC');
            if (!Array.isArray(users)) {
                return [];
            }

            const [personnel] = await connection.query('SELECT name, rank, department, userId, phone_number as phoneNumber, hire_date as hireDate FROM personnel');
            const personnelMap = new Map<string, Partial<Personnel>>();
            if (Array.isArray(personnel)) {
                personnel.forEach((p: any) => {
                    if (p.userId) {
                        personnelMap.set(p.userId, p);
                    } else {
                        personnelMap.set(p.name, p);
                    }
                });
            }

            return (users as any[]).map((u: any) => {
                const pRecord = personnelMap.get(u.id) || personnelMap.get(u.username);
                let userRoles = [];
                if(typeof u.roles === 'string') {
                    try {
                        userRoles = JSON.parse(u.roles);
                    } catch(e) { console.error('Failed to parse roles for user', u.username)}
                } else if (Array.isArray(u.roles)) {
                    userRoles = u.roles;
                }

                return {
                    ...u,
                    roles: userRoles,
                    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
                    personnel: pRecord || null
                };
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function loginUser(credentials: unknown) {
    const validation = loginSchema.safeParse(credentials);
    if (!validation.success) {
        return { success: false, message: 'Invalid credentials format.' };
    }
    const { username, password } = validation.data;

    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
            
            if (!Array.isArray(rows) || rows.length === 0) {
                return { success: false, message: 'Incorrect username or password.' };
            }
            
            const user = (rows as any[])[0];
            if (user.status === 'Banned') {
                return { success: false, message: 'This account has been banned.' };
            }

            const passwordMatch = user.password === password;

            if (!passwordMatch) {
                return { success: false, message: 'Incorrect username or password.' };
            }
            
            await logUserAction(username, "Login", `User '${username}' signed in.`, connection);

            let userRoles = [];
            if(typeof user.roles === 'string') {
                try {
                    userRoles = JSON.parse(user.roles);
                } catch(e) { console.error('Failed to parse roles for user', user.username)}
            } else if (Array.isArray(user.roles)) {
                userRoles = user.roles;
            }

            return { success: true, user: { id: user.id, username: user.username, roles: userRoles } };

        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Login server error:", error);
        if (error.code === 'ETIMEDOUT') {
            return { success: false, message: 'Database Connection Timeout. Please check Zap-Hosting external access settings.' };
        }
        return { success: false, message: `System Error: ${error.message || 'Unknown error'}` };
    }
}

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  roles: z.array(z.string()),
  adminUser: z.string(),
});

export async function createUser(data: unknown) {
  const validation = createUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.' };
  }
  const { username, password, roles, adminUser } = validation.data;

  const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if user already exists
    const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
    if (Array.isArray(existing) && existing.length > 0) {
       return { success: false, message: 'A user with that username already exists.' };
    }

    const userId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)',
      [userId, username, password, JSON.stringify(roles), 'Active']
    );

    await logUserAction(adminUser, 'Create User', `Manually created new user account: ${username}`, connection);

    await connection.commit();
    revalidatePath('/admin');
    return { success: true, message: `User '${username}' created successfully.` };
  } catch (error: any) {
    await connection.rollback();
    console.error('Failed to create user:', error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

export async function submitAccessRequest(data: unknown) {
  const validation = z.object({
    username: z.string().min(3),
    password: z.string().min(8),
  }).safeParse(data);
  
  if (!validation.success) return { success: false, message: 'Invalid data.' };
  
  const { username, password } = validation.data;
  await ensureDbInitialized();
  const connection = await db.getConnection();
  try {
    await connection.query(
      'INSERT INTO access_requests (id, requested_username, password) VALUES (?, ?, ?)',
      [crypto.randomUUID(), username, password]
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Request failed.' };
  } finally {
    connection.release();
  }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query("SELECT id, requested_username, status, createdAt FROM access_requests WHERE status = 'Pending' ORDER BY createdAt ASC");
        return (rows as any[]).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
    } finally {
        connection.release();
    }
}

export async function approveAccessRequest(data: any) {
    const { requestId, username, roles, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [requestRows]: any = await connection.query('SELECT * FROM access_requests WHERE id = ?', [requestId]);
        if (!Array.isArray(requestRows) || requestRows.length === 0) throw new Error("Request not found");
        const request = requestRows[0];
        await connection.query(
            'INSERT INTO users (id, username, password, roles) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), username, request.password, JSON.stringify(roles)]
        );
        await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Approved', requestId]);
        await logUserAction(adminUser, 'Approve Access Request', `Approved access for user: ${username}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        return { success: true };
    } finally {
        connection.release();
    }
}

export async function denyAccessRequest(requestId: string, requestedUsername: string, adminUser: string) {
    const hasPermission = await checkPermissions(adminUser, 'MANAGE_ACCESS_REQUESTS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Denied', requestId]);
        await logUserAction(adminUser, 'Deny Access Request', `Denied access request for user: ${requestedUsername}`, connection);
        await connection.commit();
        revalidatePath('/admin');
        return { success: true, message: 'Access request denied.' };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to deny access request:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function changeUserPassword(data: any) {
    const { userId, currentPassword, newPassword } = data;
    const connection = await db.getConnection();
    try {
        const [rows]: any = await connection.query('SELECT password, username FROM users WHERE id = ?', [userId]);
        if (rows[0].password !== currentPassword) return { success: false, message: "Incorrect password" };
        await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        return { success: true, message: "Password updated" };
    } finally {
        connection.release();
    }
}

export async function updateProfilePicture(data: any) {
    const { userId, url, user } = data;
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET avatarUrl = ? WHERE id = ?', [url, userId]);
        revalidatePath(`/users/${encodeURIComponent(user)}`);
        return { success: true, message: "Picture updated" };
    } finally {
        connection.release();
    }
}

export async function getReviewedApplicationsCount(userId: string): Promise<number> {
    const connection = await db.getConnection();
    try {
        const [rows]: any = await connection.query("SELECT COUNT(*) as count FROM applications WHERE reviewer_id = ? AND status IN ('Approved', 'Rejected')", [userId]);
        return rows[0].count;
    } finally {
        connection.release();
    }
}

export async function updateUser(data: any) {
    const { userId, username, roles, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET username = ?, roles = ? WHERE id = ?', [username, JSON.stringify(roles), userId]);
        revalidatePath('/admin');
        return { success: true, message: "User updated" };
    } finally {
        connection.release();
    }
}

export async function setUserStatus(data: any) {
    const { userId, status, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        revalidatePath('/admin');
        return { success: true, message: "Status set" };
    } finally {
        connection.release();
    }
}

export async function resetUserPassword(data: any) {
    const { userId, newPassword, adminUser } = data;
    const connection = await db.getConnection();
    try {
        await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        return { success: true, message: "Password reset" };
    } finally {
        connection.release();
    }
}

export async function deleteUser(userId: string, adminUser: string) {
    const connection = await db.getConnection();
    try {
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        revalidatePath('/admin');
        return { success: true, message: "User deleted" };
    } finally {
        connection.release();
    }
}
