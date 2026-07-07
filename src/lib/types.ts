
export const roles = ["CEO", "Manager", "Division Lead", "Employee", "User"] as const;
export type Role = typeof roles[number];

export const permissions = [
    // Page Access
    'ACCESS_DASHBOARD',
    'ACCESS_FARMERS',
    'ACCESS_SECURITY',
    'ACCESS_EVENTS',
    'ACCESS_FINANCES',
    'ACCESS_MANAGER_PORTAL',
    'ACCESS_CEO_PORTAL',
    'VIEW_SOPS',
    'VIEW_EMPLOYEES',
    'VIEW_USERS',
    'VIEW_ORDERS',
    'VIEW_ARCHIVE',
    'VIEW_APPLICATIONS',
    'VIEW_LOGS',
    'ACCESS_ADMIN_PANEL',
    'VIEW_ANNOUNCEMENTS',
    'VIEW_CHANGELOGS',
    
    // Actions
    'MANAGE_EMPLOYEES', 
    'HIRE_EMPLOYEES', 
    'MANAGE_APPLICATIONS',
    'DELETE_APPLICATIONS',
    'EDIT_APPLICATION_FORM',
    'MANAGE_ORDERS',
    'MANAGE_USERS',
    'DELETE_USERS',
    'MANAGE_ROLES_PERMISSIONS',
    'MANAGE_POSITIONS',
    'MANAGE_APP_SETTINGS',
    'MANAGE_ANNOUNCEMENTS',
    'MANAGE_GALLERY',
    'BYPASS_MAINTENANCE_MODE',
] as const;
export type Permission = typeof permissions[number];

export type Division = "Harvesting" | "Processing" | "Logistics" | "Sales" | "Management" | "Maintenance" | "Security";
export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive' | 'Probation';
export type UserStatus = 'Active' | 'Banned';

export interface Employee {
  id: string;
  name: string;
  position: string;
  employeeId: string;
  division: Division;
  discordUsername?: string;
  status: EmployeeStatus;
  joinedAt: Date;
  userId?: string | null;
}

export interface UserProfile {
  id: string;
  discordId: string;
  username: string;
  avatarUrl?: string;
  roles: string[];
  lastLogin: Date;
}

export interface FarmOrder {
    id: string;
    item_name: string;
    quantity: number;
    status: 'Pending' | 'Completed' | 'Cancelled';
    completed_by?: string;
    completed_at?: Date;
    created_at: Date;
}

export interface DetailedFarmOrder {
    id: string;
    business_name: string;
    sugarcane: number;
    wheat: number;
    fruits: number;
    vegs: number;
    normal_meat: number;
    premium_meat: number;
    total_price: number;
    logistics_used: boolean;
    employee_cut_value: number;
    employee_cut_percentage: number;
    completed_by: string;
    created_at: Date;
}

export interface Application {
  id: string;
  name: string;
  discordUsername?: string;
  reasonForApplying: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected";
  submittedAt: Date;
  reviewer_comment?: string;
  responses: any[];
}

export interface AppUser {
  id: string;
  username: string;
  roles: string[];
  status: UserStatus;
  createdAt?: string;
  avatarUrl?: string;
  employee?: Partial<Employee> | null;
}

export interface AuditLog {
    id: string;
    user: string;
    actionType: string;
    description: string;
    timestamp: Date;
}

export interface Announcement {
    id: string;
    content: string;
    is_urgent: boolean;
    createdAt: Date;
    author: {
        id: string;
        username: string;
        avatarUrl?: string;
    }
}

export interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    hint?: string;
    createdAt: Date;
}

export interface SecurityTimeLog {
  id: string;
  user: string;
  hours: number;
  description: string;
  date: Date;
  created_at: Date;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  location: string;
  reported_by: string;
  pd_called: boolean;
  injured_details?: string;
  created_at: Date;
}

export interface FarmEvent {
    id: string;
    title: string;
    description: string;
    revenue: number;
    event_date: Date;
    status: 'Scheduled' | 'Cancelled' | 'Completed';
    created_at: Date;
}

export interface FarmTransaction {
    id: string;
    amount: number;
    category: 'Income' | 'Expense' | 'Expenditure' | 'Employee Cut';
    description: string;
    transaction_date: Date;
    created_at: Date;
}
