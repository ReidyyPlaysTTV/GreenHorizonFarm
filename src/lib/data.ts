
import type { Division, Permission, Role } from "./types";

export const divisions: Division[] = ["Management", "Harvesting", "Processing", "Logistics", "Sales", "Maintenance", "Security"];

export const roles: Role[] = [
    "CEO", 
    "Co-CEO", 
    "Manager", 
    "Book-Keeper", 
    "Business Co-Ordinator", 
    "Events Planner", 
    "Security", 
    "Senior Farm Hand", 
    "Farm Hand", 
    "Trainee Farm Hand",
    "Administrator",
    "Developer",
    "User"
];

export const permissionDescriptions: Record<Permission, string> = {
    ACCESS_DASHBOARD: "Access Farm Dashboard",
    ACCESS_FARMERS: "Access Farmers Portal",
    ACCESS_SECURITY: "Access Security Portal",
    ACCESS_EVENTS: "Access Events Portal",
    ACCESS_FINANCES: "Access Finances Portal",
    ACCESS_MANAGER_PORTAL: "Access Manager Portal",
    ACCESS_CEO_PORTAL: "Access CEO Executive Portal",
    VIEW_SOPS: "View Farm Guidelines",
    VIEW_EMPLOYEES: "View Employee List",
    VIEW_USERS: "View Registered Users",
    VIEW_ORDERS: "View Farm Orders",
    VIEW_ARCHIVE: "View Former Employees",
    VIEW_APPLICATIONS: "View Job Applications",
    VIEW_LOGS: "View Audit Logs",
    ACCESS_ADMIN_PANEL: "Access Technical Admin Panel",
    VIEW_ANNOUNCEMENTS: "Read Farm News",
    VIEW_CHANGELOGS: "View App Updates",
    MANAGE_EMPLOYEES: "Promote/Demote/Fire Employees",
    HIRE_EMPLOYEES: "Onboard New Staff",
    MANAGE_APPLICATIONS: "Review Job Apps",
    DELETE_APPLICATIONS: "Remove Old Apps",
    EDIT_APPLICATION_FORM: "Modify Job App Questions",
    MANAGE_ORDERS: "Create and Mark Orders as Complete",
    MANAGE_USERS: "Manage User Access",
    DELETE_USERS: "Remove User Accounts",
    MANAGE_ROLES_PERMISSIONS: "Configure Access Groups",
    MANAGE_POSITIONS: "Define Employee Positions",
    MANAGE_APP_SETTINGS: "Global App Settings",
    MANAGE_ANNOUNCEMENTS: "Post Farm News",
    MANAGE_GALLERY: "Update Farm Photo Gallery",
    MANAGE_PROCEDURES: "Manage Farm Guidelines",
    BYPASS_MAINTENANCE_MODE: "Access during maintenance",
};

export const initialPermissionsMap: Record<Role, Permission[]> = {
    CEO: Object.keys(permissionDescriptions) as Permission[],
    "Co-CEO": Object.keys(permissionDescriptions) as Permission[],
    Manager: [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS', 
        'ACCESS_EVENTS', 
        'ACCESS_MANAGER_PORTAL', 
        'ACCESS_FINANCES', 
        'VIEW_APPLICATIONS',
        'VIEW_ANNOUNCEMENTS'
    ],
    "Book-Keeper": [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS', 
        'ACCESS_EVENTS', 
        'ACCESS_MANAGER_PORTAL', 
        'ACCESS_FINANCES',
        'VIEW_ANNOUNCEMENTS'
    ],
    "Business Co-Ordinator": [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS', 
        'ACCESS_EVENTS', 
        'ACCESS_MANAGER_PORTAL',
        'VIEW_ANNOUNCEMENTS'
    ],
    "Events Planner": [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS', 
        'ACCESS_EVENTS',
        'VIEW_ANNOUNCEMENTS'
    ],
    Security: [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_SECURITY', 
        'VIEW_SOPS',
        'VIEW_ANNOUNCEMENTS'
    ],
    "Senior Farm Hand": [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS',
        'VIEW_ANNOUNCEMENTS'
    ],
    "Farm Hand": [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS',
        'VIEW_ANNOUNCEMENTS'
    ],
    "Trainee Farm Hand": [
        'ACCESS_DASHBOARD', 
        'VIEW_EMPLOYEES', 
        'VIEW_USERS', 
        'ACCESS_FARMERS', 
        'VIEW_SOPS',
        'VIEW_ANNOUNCEMENTS'
    ],
    Administrator: Object.keys(permissionDescriptions) as Permission[],
    Developer: Object.keys(permissionDescriptions) as Permission[],
    User: ['ACCESS_DASHBOARD', 'VIEW_ANNOUNCEMENTS'],
};
