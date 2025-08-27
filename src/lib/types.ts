
export type Department = "Commissioners Office" | "High Command" | "Command" | "NCOS" | "Corrections" | "Training";
export type PersonnelStatus = 'Active' | 'LOA' | 'Inactive' | 'Low Activity' | 'Medical Leave' | 'Suspended';


export interface Personnel {
  id: string;
  name: string;
  rank: string;
  badgeNumber: string;
  department: Department;
  avatarUrl: string;
  discordUsername?: string;
  status: PersonnelStatus;
  loa_until?: string | null;
  is_rehired?: boolean;
}

export interface ArchivedPersonnel {
  id: string;
  name: string;
  rank: string;
  discordUsername?: string;
  status: "Fired" | "Resigned";
  date: string;
  reason: string;
}

export interface BlacklistedPersonnel {
  id: string;
  name: string;
  discordUsername?: string;
  reason: string;
  dateAdded: string;
}

export interface Application {
  id: string;
  name: string;
  discordUsername?: string;
  reasonForApplying: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: Date;
  responses: {
    fieldId: string;
    label: string;
    type: string;
    answer: string;
  }[];
}

export interface FormFieldOption {
    id?: string;
    value: string;
}

export interface FormFieldData {
    id?: string;
    type: 'text' | 'textarea' | 'select';
    label: string;
    required: boolean;
    options?: FormFieldOption[];
}

export interface PersonnelEvent {
    id: string;
    personnel_name: string;
    event_type: 'Hired' | 'Fired' | 'Promoted' | 'Demoted' | 'Rehired';
    description: string;
    date: Date;
}

export type ReportStatus = "Pending" | "In Progress" | "Completed" | "Rejected";

export interface BugReport {
    id: string;
    title: string;
    description: string;
    status: ReportStatus;
    submittedAt: Date;
}

export interface Suggestion {
    id:string;
    title: string;
    description: string;
    status: ReportStatus;
    submittedAt: Date;
}

export interface AppUser {
  id: string;
  username: string;
  role: string;
  personnel?: Personnel | null;
}

export interface AccessRequest {
  id: string;
  requested_username: string;
  status: 'Pending' | 'Approved' | 'Denied';
  createdAt: Date;
}

export interface CallsignLog {
    id: string;
    callsign: string;
    personnel_name: string;
    action: 'Assigned' | 'Unassigned';
    timestamp: Date;
}

export interface AuditLog {
    id: string;
    user: string;
    actionType: string;
    description: string;
    timestamp: Date;
}
