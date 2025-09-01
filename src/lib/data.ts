

import type { Department, Permission, Role } from "./types";

export const departments: Department[] = ["Commissioners Office", "High Command", "Command", "NCOS", "Corrections", "Training", "BCSO"];

export const rankInsignias: Record<string, string> = {
    "Sheriff": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/gota.png",
    "Commissioner": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/gota.png",
    "Deputy Comissioner": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/gota.png",
    "Warden": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/general.png",
    "Deputy Warden": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/lt-general.png",
    "Major": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/major.png",
    "Captain": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/captain.png",
    "Lieutenant": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/first-lieutenant.png",
    "Corrections Sergeant": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/staff-sergeant.png",
    "Senior Corrections Officer": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/corporal.png",
    "Correctional Officer": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png",
    "Probationary Correctional Officer": "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png",
    "Developer": "https://i.imgur.com/FxJ5c2v.png",
};

export const rankToDepartmentMap: Record<string, Department> = {
    "Sheriff": "BCSO",
    "Commissioner": "Commissioners Office",
    "Deputy Comissioner": "Commissioners Office",
    "Warden": "High Command",
    "Deputy Warden": "High Command",
    "Major": "High Command",
    "Captain": "Command",
    "Lieutenant": "Command",
    "Corrections Sergeant": "NCOS",
    "Senior Corrections Officer": "Corrections",
    "Correctional Officer": "Corrections",
    "Probationary Correctional Officer": "Training",
    "Developer": "BCSO",
};

export const rankOrder = [
    "Developer",
    "Sheriff",
    "Commissioner",
    "Deputy Comissioner",
    "Warden",
    "Deputy Warden",
    "Major",
    "Captain",
    "Lieutenant",
    "Corrections Sergeant",
    "Senior Corrections Officer",
    "Correctional Officer",
    "Probationary Correctional Officer",
];

export const roles: Role[] = ["Developer", "Administrator", "Commissioners Office", "High Command", "Command", "NCOs", "User"];

export const permissions: Permission[] = [
    // Page Access
    'ACCESS_DASHBOARD',
    'VIEW_ROSTER',
    'VIEW_USERS',
    'VIEW_CALLSIGNS',
    'VIEW_SOPS',
    'VIEW_ARCHIVE',
    'ACCESS_COMMAND_CENTER',
    'VIEW_APPLICATIONS',
    'VIEW_LOGS',
    'ACCESS_ADMIN_PANEL',
    'VIEW_ANNOUNCEMENTS',
    'VIEW_CHANGELOGS',
    
    // Actions
    'MANAGE_PERSONNEL', // Promote, Demote, Fire, Edit Status
    'HIRE_PERSONNEL', // Add new personnel from roster or rehire
    'MANAGE_APPLICATIONS', // Approve, Deny
    'EDIT_APPLICATION_FORM',
    'MANAGE_BLACKLIST',
    'MANAGE_USERS', // Create users, assign roles
    'MANAGE_ROLES_PERMISSIONS',
    'MANAGE_ACCESS_REQUESTS',
    'MANAGE_APP_SETTINGS',
    'MANAGE_ANNOUNCEMENTS',
    'MANAGE_GALLERY',
    'MANAGE_CHANGELOGS',
    'BYPASS_MAINTENANCE_MODE',
];

export const permissionDescriptions: Record<Permission, string> = {
    ACCESS_DASHBOARD: "Access Dashboard Page",
    VIEW_ROSTER: "View Roster Page",
    VIEW_USERS: "View Users Page",
    VIEW_CALLSIGNS: "View Callsigns Page",
    VIEW_SOPS: "View SOPs Page",
    VIEW_ARCHIVE: "View Fired/Resigned Archive",
    ACCESS_COMMAND_CENTER: "Access Command Center",
    VIEW_APPLICATIONS: "View Application Center",
    VIEW_LOGS: "View DOC Logs",
    ACCESS_ADMIN_PANEL: "Access Admin Panel",
    MANAGE_PERSONNEL: "Manage Personnel (Promote, Demote, Fire, Status)",
    HIRE_PERSONNEL: "Hire & Rehire Personnel",
    MANAGE_APPLICATIONS: "Manage Applications (Approve/Deny)",
    EDIT_APPLICATION_FORM: "Edit Application Form",
    MANAGE_BLACKLIST: "Manage DOC Blacklist",
    MANAGE_USERS: "Manage Users & Roles",
    MANAGE_ROLES_PERMISSIONS: "Manage Permission Groups",
    MANAGE_ACCESS_REQUESTS: "Manage Access Requests",
    MANAGE_APP_SETTINGS: "Manage Application Settings (e.g. SOPs)",
    VIEW_ANNOUNCEMENTS: "View Dashboard Announcements",
    MANAGE_ANNOUNCEMENTS: "Create and Delete Announcements",
    MANAGE_GALLERY: "Manage Dashboard Photo Gallery",
    VIEW_CHANGELOGS: "View Changelogs Page",
    MANAGE_CHANGELOGS: "Create and Delete Changelogs",
    BYPASS_MAINTENANCE_MODE: "Bypass Maintenance Mode",
};


// Initial permissions map for database seeding.
// This will no longer be the source of truth for the application.
export const initialPermissionsMap: Record<Role, Permission[]> = {
    User: [
        'ACCESS_DASHBOARD',
        'VIEW_ROSTER',
        'VIEW_USERS',
        'VIEW_CALLSIGNS',
        'VIEW_SOPS',
        'VIEW_ANNOUNCEMENTS',
        'VIEW_CHANGELOGS',
    ],
    NCOs: [
        'ACCESS_DASHBOARD',
        'VIEW_ROSTER',
        'VIEW_USERS',
        'VIEW_CALLSIGNS',
        'VIEW_SOPS',
        'VIEW_LOGS',
        'VIEW_APPLICATIONS',
        'VIEW_ANNOUNCEMENTS',
        'VIEW_CHANGELOGS',
    ],
    Command: [
        'ACCESS_DASHBOARD',
        'VIEW_ROSTER',
        'VIEW_USERS',
        'VIEW_CALLSIGNS',
        'VIEW_SOPS',
        'VIEW_LOGS',
        'VIEW_APPLICATIONS',
        'MANAGE_APPLICATIONS',
        'MANAGE_PERSONNEL',
        'HIRE_PERSONNEL',
        'ACCESS_COMMAND_CENTER',
        'MANAGE_BLACKLIST',
        'VIEW_ARCHIVE',
        'VIEW_ANNOUNCEMENTS',
        'MANAGE_ANNOUNCEMENTS',
        'VIEW_CHANGELOGS',
    ],
    "High Command": [
        'ACCESS_DASHBOARD',
        'VIEW_ROSTER',
        'VIEW_USERS',
        'VIEW_CALLSIGNS',
        'VIEW_SOPS',
        'VIEW_LOGS',
        'VIEW_APPLICATIONS',
        'MANAGE_APPLICATIONS',
        'EDIT_APPLICATION_FORM',
        'MANAGE_PERSONNEL',
        'HIRE_PERSONNEL',
        'ACCESS_COMMAND_CENTER',
        'MANAGE_BLACKLIST',
        'VIEW_ARCHIVE',
        'MANAGE_APP_SETTINGS',
        'VIEW_ANNOUNCEMENTS',
        'MANAGE_ANNOUNCEMENTS',
        'MANAGE_GALLERY',
        'VIEW_CHANGELOGS',
    ],
    "Commissioners Office": [
        'ACCESS_DASHBOARD',
        'VIEW_ROSTER',
        'VIEW_USERS',
        'VIEW_CALLSIGNS',
        'VIEW_SOPS',
        'VIEW_LOGS',
        'VIEW_APPLICATIONS',
        'MANAGE_APPLICATIONS',
        'EDIT_APPLICATION_FORM',
        'MANAGE_PERSONNEL',
        'HIRE_PERSONNEL',
        'ACCESS_COMMAND_CENTER',
        'MANAGE_BLACKLIST',
        'VIEW_ARCHIVE',
        'ACCESS_ADMIN_PANEL',
        'MANAGE_USERS',
        'MANAGE_ACCESS_REQUESTS',
        'MANAGE_APP_SETTINGS',
        'VIEW_ANNOUNCEMENTS',
        'MANAGE_ANNOUNCEMENTS',
        'MANAGE_GALLERY',
        'VIEW_CHANGELOGS',
    ],
    // Administrator and Developer have all permissions, handled separately.
    Administrator: [...permissions],
    Developer: [...permissions],
};
