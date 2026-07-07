
'use server';

import db, { ensureDbInitialized } from '../db';
import pool from '../db';
import type { AppUser, AccessRequest, Personnel } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';

/**
 * Tests the connection to the MariaDB database.
 */
export async function testDatabaseConnection() {
    const startTime = Date.now();
    try {
        await ensureDbInitialized();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT 1 as ping');
            const latency = Date.now() - startTime;
            if (Array.isArray(rows) && (rows[0] as any).ping === 1) {
                return { success: true, message: `Database Connected Successfully. Latency: ${latency}ms` };
            }
            return { success: false, message: 'Ping failed but connection established.' };
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Test Connection Error:", error);
        return { 
            success: false, 
            message: `Connection Error: ${error.message || 'Unknown issue'}. ZAP-Hosting may be blocking the connection. Code: ${error.code || 'N/A'}` 
        };
    }
}

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
        console.error("Action Error (getUsers):", error);
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
        return { success: false, message: `System Error: ${error.message || 'Database connection unreachable'}` };
    }
}

export async function createUser(data: any) {
    const { username, password, roles, adminUser } = data;

    try {
        const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
        if (!hasPermission) {
            return { success: false, message: 'You do not have permission to perform this action.' };
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
            if (Array.isArray(existing) && existing.length > 0) {
                return { success: false, message: 'A user with that username already exists.' };
            }

            const userId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO users (id, username, password, roles, status) VALUES (?, ?, ?, ?, ?)',
                [userId, username, password, JSON.stringify(roles), 'Active']
            );

            await logUserAction(adminUser, 'Create User', `Manually created user account: ${username}`, connection);
            await connection.commit();
            revalidatePath('/admin');
            return { success: true, message: `User '${username}' created.` };
        } catch (error: any) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (createUser):", error);
        return { success: false, message: 'Operation failed.' };
    }
}

export async function submitAccessRequest(data: any) {
  const { username, password } = data;
  try {
    await ensureDbInitialized();
    const connection = await db.getConnection();
    try {
        await connection.query(
        'INSERT INTO access_requests (id, requested_username, password) VALUES (?, ?, ?)',
        [crypto.randomUUID(), username, password]
        );
        return { success: true };
    } finally {
        connection.release();
    }
  } catch (error) {
    console.error("Action Error (submitAccessRequest):", error);
    return { success: false, message: 'Request failed.' };
  }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
    try {
        await ensureDbInitialized();
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query("SELECT id, requested_username, status, createdAt FROM access_requests WHERE status = 'Pending' ORDER BY createdAt ASC");
            return (rows as any[]).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (getAccessRequests):", error);
        return [];
    }
}

export async function approveAccessRequest(data: any) {
    const { requestId, username, roles, adminUser } = data;
    try {
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
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (approveAccessRequest):", error);
        return { success: false, message: 'Approval failed.' };
    }
}

export async function denyAccessRequest(requestId: string, requestedUsername: string, adminUser: string) {
    try {
        const hasPermission = await checkPermissions(adminUser, 'MANAGE_ACCESS_REQUESTS');
        if (!hasPermission) {
            return { success: false, message: 'You do not have permission.' };
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Denied', requestId]);
            await logUserAction(adminUser, 'Deny Access Request', `Denied access for user: ${requestedUsername}`, connection);
            await connection.commit();
            revalidatePath('/admin');
            return { success: true, message: 'Access request denied.' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (denyAccessRequest):", error);
        return { success: false, message: 'Operation failed.' };
    }
}

export async function changeUserPassword(data: any) {
    const { userId, currentPassword, newPassword } = data;
    try {
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query('SELECT password, username FROM users WHERE id = ?', [userId]);
            if (rows[0].password !== currentPassword) return { success: false, message: "Incorrect password" };
            await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
            return { success: true, message: "Password updated" };
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (changeUserPassword):", error);
        return { success: false, message: 'Password update failed.' };
    }
}

export async function updateProfilePicture(data: any) {
    const { userId, url, user } = data;
    try {
        const connection = await db.getConnection();
        try {
            await connection.query('UPDATE users SET avatarUrl = ? WHERE id = ?', [url, userId]);
            revalidatePath(`/users/${encodeURIComponent(user)}`);
            return { success: true, message: "Picture updated" };
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (updateProfilePicture):", error);
        return { success: false, message: 'Update failed.' };
    }
}

export async function getReviewedApplicationsCount(userId: string): Promise<number> {
    try {
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query("SELECT COUNT(*) as count FROM applications WHERE reviewer_id = ? AND status IN ('Approved', 'Rejected')", [userId]);
            return rows[0].count;
        } finally {
            connection.release();
        }
    } catch (error) {
        return 0;
    }
}

export async function updateUser(data: any) {
    const { userId, username, roles, adminUser } = data;
    try {
        const connection = await db.getConnection();
        try {
            await connection.query('UPDATE users SET username = ?, roles = ? WHERE id = ?', [username, JSON.stringify(roles), userId]);
            revalidatePath('/admin');
            return { success: true, message: "User updated" };
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (updateUser):", error);
        return { success: false, message: 'Update failed.' };
    }
}

export async function setUserStatus(data: any) {
    const { userId, status, adminUser } = data;
    try {
        const connection = await db.getConnection();
        try {
            await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
            revalidatePath('/admin');
            return { success: true, message: "Status set" };
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (setUserStatus):", error);
        return { success: false, message: 'Status update failed.' };
    }
}

export async function resetUserPassword(data: any) {
    const { userId, newPassword, adminUser } = data;
    try {
        const connection = await db.getConnection();
        try {
            await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
            return { success: true, message: "Password reset" };
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (resetUserPassword):", error);
        return { success: false, message: 'Reset failed.' };
    }
}

export async function deleteUser(userId: string, adminUser: string) {
    try {
        const connection = await db.getConnection();
        try {
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            revalidatePath('/admin');
            return { success: true, message: "User deleted" };
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Action Error (deleteUser):", error);
        return { success: false, message: 'Deletion failed.' };
    }
}
