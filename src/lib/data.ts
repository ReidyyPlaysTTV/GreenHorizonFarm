
import type { Division, Permission, Role } from "./types";

export const divisions: Division[] = ["Management", "Harvesting", "Processing", "Logistics", "Sales", "Maintenance"];

export const roles: Role[] = ["CEO", "Manager", "Division Lead", "Employee", "User"];

export const permissionDescriptions: Record<Permission, string> = {
    ACCESS_DASHBOARD: "Access Farm Dashboard",
    VIEW_EMPLOYEES: "View Employee List",
    VIEW_USERS: "View Registered Users",
    VIEW_ORDERS: "View Farm Orders",
    VIEW_SOPS: "View Farm Guidelines",
    VIEW_ARCHIVE: "View Former Employees",
    ACCESS_MANAGER_PORTAL: "Access Manager Portal",
    ACCESS_CEO_PORTAL: "Access CEO Executive Portal",
    VIEW_APPLICATIONS: "View Job Applications",
    VIEW_LOGS: "View Audit Logs",
    ACCESS_ADMIN_PANEL: "Access Technical Admin Panel",
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
    VIEW_ANNOUNCEMENTS: "Read Farm News",
    MANAGE_ANNOUNCEMENTS: "Post Farm News",
    MANAGE_GALLERY: "Update Farm Photo Gallery",
    VIEW_CHANGELOGS: "View App Updates",
    BYPASS_MAINTENANCE_MODE: "Access during maintenance",
};

export const initialPermissionsMap: Record<Role, Permission[]> = {
    User: ['ACCESS_DASHBOARD', 'VIEW_ANNOUNCEMENTS'],
    Employee: ['ACCESS_DASHBOARD', 'VIEW_EMPLOYEES', 'VIEW_ORDERS', 'VIEW_SOPS', 'VIEW_ANNOUNCEMENTS'],
    "Division Lead": ['ACCESS_DASHBOARD', 'VIEW_EMPLOYEES', 'VIEW_ORDERS', 'MANAGE_ORDERS', 'VIEW_SOPS', 'VIEW_ANNOUNCEMENTS'],
    Manager: ['ACCESS_DASHBOARD', 'VIEW_EMPLOYEES', 'VIEW_ORDERS', 'MANAGE_ORDERS', 'VIEW_SOPS', 'ACCESS_MANAGER_PORTAL', 'VIEW_APPLICATIONS', 'MANAGE_APPLICATIONS', 'MANAGE_EMPLOYEES', 'VIEW_ANNOUNCEMENTS', 'MANAGE_ANNOUNCEMENTS'],
    CEO: ['ACCESS_DASHBOARD', 'VIEW_EMPLOYEES', 'VIEW_ORDERS', 'MANAGE_ORDERS', 'VIEW_SOPS', 'ACCESS_MANAGER_PORTAL', 'ACCESS_CEO_PORTAL', 'VIEW_APPLICATIONS', 'MANAGE_APPLICATIONS', 'MANAGE_EMPLOYEES', 'HIRE_EMPLOYEES', 'ACCESS_ADMIN_PANEL', 'MANAGE_USERS', 'VIEW_ANNOUNCEMENTS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_GALLERY'],
};
