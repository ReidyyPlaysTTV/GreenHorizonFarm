
export type Department = "Commissioners Office" | "High Command" | "Command" | "NCOS" | "Corrections" | "Training";

export interface Personnel {
  id: string;
  name: string;
  rank: string;
  badgeNumber: string;
  department: Department;
  avatarUrl: string;
  discordUsername?: string;
}

export interface ArchivedPersonnel {
  id: string;
  name: string;
  rank: string;
  status: "Fired" | "Resigned";
  date: string;
  reason: string;
}

export interface BlacklistedPersonnel {
  id: string;
  name: string;
  reason: string;
  dateAdded: string;
}

export interface Application {
  id: string;
  name: string;
  age: number;
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
    event_type: 'Hired' | 'Fired' | 'Promoted' | 'Demoted';
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

// New User type
export interface AppUser {
  id: string;
  username: string;
  role: string;
}

export interface CallsignLog {
    id: string;
    callsign: string;
    personnel_name: string;
    action: 'Assigned' | 'Unassigned';
    timestamp: Date;
}
