
export const roles = [
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
] as const;
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
    'MANAGE_PROCEDURES',
    'BYPASS_MAINTENANCE_MODE',
] as const;
export type Permission = typeof permissions[number];

export type Division = "Harvesting" | "Processing" | "Logistics" | "Sales" | "Management" | "Maintenance" | "Security";
export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive' | 'Probation';
export type UserStatus = 'Active' | 'Banned';

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
  phoneNumber?: string;
  stateId?: string;
  reasonForApplying: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected";
  submittedAt: Date;
  reviewer_comment?: string;
  responses: any[];
  reviewer?: {
      id: string;
      username: string;
      avatarUrl?: string;
  } | null;
  reviewedAt?: Date | null;
}

export interface AppUser {
  id: string;
  username: string;
  roles: string[];
  status: UserStatus;
  createdAt?: string;
  avatarUrl?: string;
  personnel?: Partial<Personnel> | null;
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

export interface FarmProcedure {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    author_name: string;
    author_rank: string;
    created_at: Date;
}

export interface StaffIncident {
    id: string;
    personnel_name: string;
    reason: string;
    issued_by: string;
    incident_date: Date;
}

export interface FarmProduct {
    id: string;
    name: string;
    category: string;
    price: number;
}

export interface ManagerPlan {
    id: string;
    title: string;
    content: string;
    author: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    feedback?: string;
    created_at: Date;
}

export interface PromotionSuggestion {
    id: string;
    personnel_name: string;
    suggested_rank: string;
    reason: string;
    suggested_by: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    feedback?: string;
    created_at: Date;
}

export interface CeoChatMessage {
    id: string;
    author: string;
    message: string;
    created_at: Date;
}

export interface Personnel {
    id: string;
    name: string;
    rank: string;
    badgeNumber: string;
    discordUsername?: string;
    phoneNumber?: string;
    bankAccount?: string;
    hireDate?: string;
    ordersCompleted?: number;
    department: string;
    status: PersonnelStatus;
    loa_until?: string | null;
    is_rehired: boolean;
    userId?: string | null;
}

export type PersonnelStatus = 'Active' | 'LOA' | 'Inactive' | 'Low Activity' | 'Medical Leave' | 'Suspended';

export interface Rank {
    id: string;
    name: string;
    department: string;
    sort_order: number;
    insignia_url?: string;
}

export interface PersonnelEvent {
    id: string;
    personnel_name: string;
    event_type: 'Hired' | 'Fired' | 'Promoted' | 'Demoted' | 'Rehired';
    description: string;
    date: Date;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  submittedAt: Date;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  submittedAt: Date;
}

export type ReportStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';

export interface FormFieldData {
  id?: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: { id?: string; value: string }[];
}

export interface AccessRequest {
  id: string;
  requested_username: string;
  status: 'Pending' | 'Approved' | 'Denied';
  createdAt: Date;
}

export interface ArchivedPersonnel {
    id: string;
    name: string;
    rank: string;
    discordUsername?: string;
    status: 'Fired' | 'Resigned';
    date: Date;
    reason?: string;
}

export interface BlacklistedPersonnel {
    id: string;
    name: string;
    discordUsername?: string;
    reason?: string;
    dateAdded: string;
}

export interface CallsignLog {
    id: string;
    callsign: string;
    personnel_name: string;
    action: 'Assigned' | 'Unassigned';
    timestamp: Date;
}
