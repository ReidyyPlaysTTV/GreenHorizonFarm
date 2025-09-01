





'use server';

import db from '../db';
import type { AppUser, AccessRequest, Personnel } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { checkPermissions } from '../permissions';
import { roles } from '../data';

async function createUsersTableIfNeeded() {
    try {
        const connection = await db.getConnection();
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    roles JSON NOT NULL,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    avatarUrl VARCHAR(255),
                    status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active'
                );
            `);
             const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'avatarUrl'");
            if (Array.isArray(columns) && columns.length === 0) {
                await connection.query("ALTER TABLE users ADD COLUMN avatarUrl VARCHAR(255) NULL");
            }
             const [statusColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'status'");
            if (Array.isArray(statusColumns) && statusColumns.length === 0) {
                 await connection.query("ALTER TABLE users ADD COLUMN status ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active'");
            }
             const [roleColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'role'");
             if (Array.isArray(roleColumns) && roleColumns.length > 0) {
                // Check if old role column exists, if so migrate data and drop it
                 const [oldRoleUsers] = await connection.query('SELECT id, role FROM users WHERE role IS NOT NULL');
                 if(Array.isArray(oldRoleUsers) && oldRoleUsers.length > 0) {
                     await connection.query("ALTER TABLE users ADD COLUMN roles JSON;");
                     for (const user of (oldRoleUsers as any[])) {
                        await connection.query('UPDATE users SET roles = ? WHERE id = ?', [JSON.stringify([user.role]), user.id]);
                     }
                     await connection.query("ALTER TABLE users DROP COLUMN role;");
                 }
             }

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Failed to create or alter users table:", error);
        throw new Error("Database schema setup for users failed.");
    }
}


async function createAccessRequestsTableIfNeeded(connection: any) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS access_requests (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            requested_username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            status ENUM('Pending', 'Approved', 'Denied') NOT NULL DEFAULT 'Pending',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
}


export async function getUsers(): Promise<AppUser[]> {
    try {
        await createUsersTableIfNeeded();
        const connection = await db.getConnection();
        try {
            const [users] = await connection.query('SELECT id, username, roles, createdAt, avatarUrl, status FROM users ORDER BY username ASC');
            if (!Array.isArray(users)) {
                return [];
            }

            const [personnel] = await connection.query('SELECT name, rank, department, userId FROM personnel');
            const personnelMap = new Map<string, Partial<Personnel>>();
            if (Array.isArray(personnel)) {
                personnel.forEach((p: any) => {
                    if (p.userId) {
                        personnelMap.set(p.userId, p);
                    }
                });
            }

            return (users as any[]).map((u: any) => {
                const pRecord = personnelMap.get(u.id);
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

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!Array.isArray(rows) || rows.length === 0) {
            return { success: false, message: 'Incorrect username or password. Please try again.' };
        }
        
        const user = (rows as any[])[0];
        if (user.status === 'Banned') {
            return { success: false, message: 'This account has been banned.' };
        }

        const passwordMatch = user.password === password;

        if (!passwordMatch) {
            return { success: false, message: 'Incorrect username or password. Please try again.' };
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

    } catch (error) {
        console.error("Login failed:", error);
        return { success: false, message: 'An internal server error occurred.' };
    } finally {
        connection.release();
    }
}

const accessRequestSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function submitAccessRequest(data: unknown) {
  const validation = accessRequestSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  const { username, password } = validation.data;

  const connection = await db.getConnection();
  try {
    await createAccessRequestsTableIfNeeded(connection);
    
    // Check if username is already in users or requests
    const [[userExists], [requestExists]] = await Promise.all([
        connection.query('SELECT id FROM users WHERE username = ?', [username]),
        connection.query('SELECT id FROM access_requests WHERE requested_username = ?', [username])
    ]);

    if ((userExists as any[]).length > 0 || (requestExists as any[]).length > 0) {
      return { success: false, message: "This username is already taken or requested." };
    }

    await connection.query(
      'INSERT INTO access_requests (id, requested_username, password) VALUES (?, ?, ?)',
      [crypto.randomUUID(), username, password]
    );

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Failed to submit access request:", error);
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
    const connection = await db.getConnection();
    try {
        await createAccessRequestsTableIfNeeded(connection);
        const [rows] = await connection.query("SELECT id, requested_username, status, createdAt FROM access_requests WHERE status = 'Pending' ORDER BY createdAt ASC");
        return (rows as any[]).map(r => ({
            ...r,
            createdAt: new Date(r.createdAt)
        }));
    } catch (error) {
        console.error("Failed to fetch access requests:", error);
        return [];
    } finally {
        connection.release();
    }
}

const approveRequestSchema = z.object({
    requestId: z.string(),
    username: z.string().min(3),
    roles: z.array(z.string()).min(1, "At least one role must be selected."),
    adminUser: z.string(),
});

export async function approveAccessRequest(data: unknown) {
    const validation = approveRequestSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: "Invalid data provided." };
    }
    const { requestId, username, roles, adminUser } = validation.data;

    const hasPermission = await checkPermissions(adminUser, 'MANAGE_ACCESS_REQUESTS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [requestRows] = await connection.query('SELECT * FROM access_requests WHERE id = ?', [requestId]);
        if ((requestRows as any[]).length === 0) {
            throw new Error("Access request not found.");
        }
        const request = (requestRows as any)[0];
        const { password, requested_username } = request;
        const newUserId = crypto.randomUUID();

        await connection.query(
            'INSERT INTO users (id, username, password, roles) VALUES (?, ?, ?, ?)',
            [newUserId, username, password, JSON.stringify(roles)]
        );

        await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Approved', requestId]);

        await logUserAction(adminUser, 'Approve Access Request', `Approved request for '${requested_username}' as new user '${username}' with roles '${roles.join(', ')}'.`, connection);

        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/logs');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to approve access request:", error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
            return { success: false, message: 'This username is already taken.' };
        }
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

export async function denyAccessRequest(requestId: string, username: string, adminUser: string) {
    const hasPermission = await checkPermissions(adminUser, 'MANAGE_ACCESS_REQUESTS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE access_requests SET status = 'Denied' WHERE id = ?", [requestId]);
        await logUserAction(adminUser, 'Deny Access Request', `Denied access request for '${username}'.`, connection);
        await connection.commit();

        revalidatePath('/admin');
        revalidatePath('/logs');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to deny access request:", error);
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  roles: z.array(z.string()).min(1, "At least one role must be selected."),
  adminUser: z.string(),
});

export async function createUser(data: unknown) {
  const validation = createUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.errors[0].message };
  }
  const { username, password, roles, adminUser } = validation.data;
  
  const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const newUserId = crypto.randomUUID();
    
    await connection.query(
      'INSERT INTO users (id, username, password, roles) VALUES (?, ?, ?, ?)',
      [newUserId, username, password, JSON.stringify(roles)]
    );

    await logUserAction(adminUser, 'Create User', `Created new user '${username}' with roles '${roles.join(', ')}'.`, connection);
    
    await connection.commit();

    revalidatePath('/admin');
    revalidatePath('/logs');
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("Failed to create user:", error);
     if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'This username is already taken.' };
    }
    return { success: false, message: 'Database operation failed.' };
  } finally {
    connection.release();
  }
}

const changePasswordSchema = z.object({
    userId: z.string(),
    currentPassword: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export async function changeUserPassword(data: unknown) {
    const validation = changePasswordSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.' };
    }
    const { userId, currentPassword, newPassword } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [rows] = await connection.query('SELECT username, password FROM users WHERE id = ?', [userId]);
        if ((rows as any[]).length === 0) {
            return { success: false, message: "User not found." };
        }
        const user = (rows as any)[0];

        const isMatch = user.password === currentPassword;
        if (!isMatch) {
            return { success: false, message: "Incorrect current password." };
        }

        await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await logUserAction(user.username, 'Change Password', `User '${user.username}' changed their password.`, connection);
        
        await connection.commit();
        revalidatePath(`/users/${encodeURIComponent(user.username)}`);
        return { success: true, message: "Password updated successfully." };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to change password:", error);
        return { success: false, message: "Database operation failed." };
    } finally {
        connection.release();
    }
}
    
const updateProfilePictureSchema = z.object({
    userId: z.string(),
    url: z.string().url("Please enter a valid URL.").refine(
        (url) => /^https:\/\/i\.imgur\.com\//.test(url) || /^https:\/\/r2\.fivemanage\.com\//.test(url), 
        "URL must be from i.imgur.com or r2.fivemanage.com"
    ),
    user: z.string(),
});

export async function updateProfilePicture(data: unknown) {
    const validation = updateProfilePictureSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { userId, url, user } = validation.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('UPDATE users SET avatarUrl = ? WHERE id = ?', [url, userId]);
        await logUserAction(user, 'Update Profile Picture', `Updated their profile picture.`, connection);

        await connection.commit();
        revalidatePath(`/users/${encodeURIComponent(user)}`);
        revalidatePath(`/users`);
        return { success: true, message: "Profile picture updated successfully." };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to update profile picture:", error);
        return { success: false, message: "Database operation failed." };
    } finally {
        connection.release();
    }
}

export async function getReviewedApplicationsCount(userId: string): Promise<number> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(
            "SELECT COUNT(*) as count FROM applications WHERE reviewer_id = ? AND status IN ('Approved', 'Rejected')",
            [userId]
        );
        if (Array.isArray(rows) && rows.length > 0) {
            return (rows[0] as any).count;
        }
        return 0;
    } catch (error) {
        console.error("Failed to fetch reviewed applications count:", error);
        return 0;
    } finally {
        connection.release();
    }
}

const updateUserSchema = z.object({
    userId: z.string(),
    username: z.string().min(3),
    roles: z.array(z.string()).min(1, "At least one role is required."),
    adminUser: z.string(),
});

export async function updateUser(data: unknown) {
    const validation = updateUserSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { userId, username, roles, adminUser } = validation.data;
    
    const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        const originalUsername = (userRows as any)[0]?.username;
        if (!originalUsername) {
            throw new Error("User not found.");
        }

        await connection.query(
            'UPDATE users SET username = ?, roles = ? WHERE id = ?',
            [username, JSON.stringify(roles), userId]
        );

        await logUserAction(adminUser, 'Update User', `Updated user '${originalUsername}' to username '${username}' and roles '${roles.join(', ')}'.`, connection);
        
        await connection.commit();
        revalidatePath('/admin');
        revalidatePath(`/users/${encodeURIComponent(username)}`);
        revalidatePath(`/users/${encodeURIComponent(originalUsername)}`);
        return { success: true, message: "User updated successfully." };

    } catch (error) {
        await connection.rollback();
        console.error("Failed to update user:", error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
            return { success: false, message: 'This username is already taken.' };
        }
        return { success: false, message: 'Database operation failed.' };
    } finally {
        connection.release();
    }
}

const setUserStatusSchema = z.object({
    userId: z.string(),
    status: z.enum(['Active', 'Banned']),
    adminUser: z.string(),
});

export async function setUserStatus(data: unknown) {
    const validation = setUserStatusSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.' };
    }
    const { userId, status, adminUser } = validation.data;

    const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        const username = (userRows as any)[0]?.username;
        if (!username) {
            throw new Error("User not found.");
        }
        
        if (username === adminUser) {
             throw new Error("You cannot change your own status.");
        }

        await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        await logUserAction(adminUser, 'Update User Status', `Set status of user '${username}' to '${status}'.`, connection);

        await connection.commit();
        revalidatePath('/admin');
        return { success: true, message: `User status set to ${status}.` };

    } catch (error: any) {
        await connection.rollback();
        console.error("Failed to set user status:", error);
        return { success: false, message: error.message || 'Database operation failed.' };
    } finally {
        connection.release();
    }
}


const resetPasswordSchema = z.object({
    userId: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    adminUser: z.string(),
});

export async function resetUserPassword(data: unknown) {
    const validation = resetPasswordSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    const { userId, newPassword, adminUser } = validation.data;
    
    const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [rows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        if ((rows as any[]).length === 0) {
            return { success: false, message: "User not found." };
        }
        const user = (rows as any)[0];

        await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await logUserAction(adminUser, 'Admin Password Reset', `Reset password for user '${user.username}'.`, connection);
        
        await connection.commit();
        
        return { success: true, message: `Password for ${user.username} has been reset.` };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to reset password:", error);
        return { success: false, message: "Database operation failed." };
    } finally {
        connection.release();
    }
}

export async function deleteUser(userId: string, adminUser: string) {
    const hasPermission = await checkPermissions(adminUser, 'DELETE_USERS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        const username = (userRows as any)[0]?.username;
        if (!username) {
            throw new Error("User not found.");
        }

        if (username === adminUser) {
            throw new Error("You cannot delete your own account.");
        }

        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        await logUserAction(adminUser, 'Delete User', `Permanently deleted user '${username}' (ID: ${userId}).`, connection);
        
        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/logs');
        return { success: true, message: `User '${username}' has been deleted.` };

    } catch (error: any) {
        await connection.rollback();
        console.error("Failed to delete user:", error);
        return { success: false, message: error.message || 'Database operation failed.' };
    } finally {
        connection.release();
    }
}
