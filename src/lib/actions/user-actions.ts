

'use server';

import db from '../db';
import type { AppUser, AccessRequest, Personnel } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './audit-log-actions';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
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
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'User',
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    avatarUrl VARCHAR(255)
                );
            `);
            const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'avatarUrl'");
            if (Array.isArray(columns) && columns.length === 0) {
                await connection.query("ALTER TABLE users ADD COLUMN avatarUrl VARCHAR(255)");
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
            password_hash VARCHAR(255) NOT NULL,
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
            const [users] = await connection.query('SELECT id, username, role, createdAt FROM users ORDER BY username ASC');
            if (!Array.isArray(users)) {
                return [];
            }

            const [personnel] = await connection.query('SELECT name, avatarUrl, rank, department, userId FROM personnel');
            const personnelMap = new Map<string, Partial<Personnel>>();
            if (Array.isArray(personnel)) {
                personnel.forEach((p: any) => {
                    if (p.userId) {
                        personnelMap.set(p.userId, {
                            ...p,
                            avatarUrl: p.avatarUrl || "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png"
                        });
                    }
                });
            }

            return (users as any[]).map((u: any) => {
                const pRecord = personnelMap.get(u.id);
                return {
                    ...u,
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
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return { success: false, message: 'Incorrect username or password. Please try again.' };
        }

        return { success: true, user: { username: user.username, role: user.role } };

    } catch (error) {
        console.error("Login failed:", error);
        return { success: false, message: 'An internal server error occurred.' };
    } finally {
        connection.release();
    }
}


const roleSchema = z.object({
    role: z.string().min(1, "Role cannot be empty."),
    user: z.string(),
});

export async function assignUserRole(userId: string, data: { role: string, user: string }) {
    const validation = roleSchema.safeParse(data);

    if (!validation.success) {
        return { success: false, message: 'Invalid role specified.' };
    }
    const { role, user } = validation.data;
    
    const hasPermission = await checkPermissions(user, 'MANAGE_USERS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
        const targetUsername = (userRows as any)[0]?.username || 'Unknown User';

        await connection.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, userId]
        );

        await logUserAction(user, 'Assign Role', `Assigned role '${role}' to user '${targetUsername}'.`, connection);

        await connection.commit();
        revalidatePath('/admin');
        revalidatePath('/logs');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Failed to assign user role:', error);
        return { success: false, message: 'Database operation failed.' };
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

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await connection.query(
      'INSERT INTO access_requests (id, requested_username, password_hash) VALUES (?, ?, ?)',
      [randomUUID(), username, password_hash]
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
    role: z.string(),
    adminUser: z.string(),
});

export async function approveAccessRequest(data: unknown) {
    const validation = approveRequestSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: "Invalid data provided." };
    }
    const { requestId, username, role, adminUser } = validation.data;

    const hasPermission = await checkPermissions(adminUser, 'MANAGE_ACCESS_REQUESTS');
    if (!hasPermission) {
        return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get the request details (specifically the password hash)
        const [requestRows] = await connection.query('SELECT * FROM access_requests WHERE id = ?', [requestId]);
        if ((requestRows as any[]).length === 0) {
            throw new Error("Access request not found.");
        }
        const request = (requestRows as any)[0];
        const { password_hash, requested_username } = request;
        const newUserId = randomUUID();

        // 2. Create the user
        await connection.query(
            'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [newUserId, username, password_hash, role]
        );

        // 3. Update the request status
        await connection.query('UPDATE access_requests SET status = ? WHERE id = ?', ['Approved', requestId]);

        // 4. Log the action
        await logUserAction(adminUser, 'Approve Access Request', `Approved request for '${requested_username}' as new user '${username}' with role '${role}'.`, connection);

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
  role: z.string(),
  adminUser: z.string(),
});

export async function createUser(data: unknown) {
  const validation = createUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  const { username, password, role, adminUser } = validation.data;
  
  const hasPermission = await checkPermissions(adminUser, 'MANAGE_USERS');
  if (!hasPermission) {
    return { success: false, message: 'You do not have permission to perform this action.' };
  }
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUserId = randomUUID();
    
    await connection.query(
      'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [newUserId, username, password_hash, role]
    );

    await logUserAction(adminUser, 'Create User', `Created new user '${username}' with role '${role}'.`, connection);
    
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
        
        const [rows] = await connection.query('SELECT username, password_hash FROM users WHERE id = ?', [userId]);
        if ((rows as any[]).length === 0) {
            return { success: false, message: "User not found." };
        }
        const user = (rows as any)[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return { success: false, message: "Incorrect current password." };
        }

        const salt = await bcrypt.genSalt(10);
        const new_password_hash = await bcrypt.hash(newPassword, salt);

        await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [new_password_hash, userId]);
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
  userId: z.string().uuid(),
  avatarUrl: z.string().url("Invalid URL format."),
  loggedInUser: z.string(),
});

export async function updateProfilePicture(data: unknown) {
    const validation = updateProfilePictureSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
    }
    const { userId, avatarUrl, loggedInUser } = validation.data;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update avatar in personnel table using the userId
        const [result] = await connection.query(
            'UPDATE personnel SET avatarUrl = ? WHERE userId = ?', 
            [avatarUrl, userId]
        );

        const updateWasSuccessful = (result as any).affectedRows > 0;
        if(!updateWasSuccessful) {
             // This can happen if the user is not a personnel member yet.
             // We can log this, but it's not a hard error.
            console.log(`Attempted to update avatar for userId ${userId}, but no matching personnel record was found.`);
        }
        
        await logUserAction(loggedInUser, 'Update Profile Picture', `User '${loggedInUser}' updated their profile picture.`, connection);

        await connection.commit();
        
        revalidatePath(`/users/${encodeURIComponent(loggedInUser)}`, 'layout');
        
        return { success: true, message: "Profile picture updated." };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to update profile picture:", error);
        return { success: false, message: "Database operation failed." };
    } finally {
        connection.release();
    }
}


    
