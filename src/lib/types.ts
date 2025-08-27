
export type Department = "Commissioners Office" | "High Command" | "Command" | "NCOS" | "Corrections" | "Training";

export interface Personnel {
  id: string;
  name: string;
  rank: string;
  badgeNumber: string;
  department: Department;
  avatarUrl: string;
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
  responses: any; // JSON column
}

export interface FormFieldOption {
    id?: string;
    value: string;
}

export interface FormFieldData {
    id?: string;
    type: 'text' | 'textarea' | 'select';
    label: string;
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
    id: string;
    title: string;
    description: string;
    status: ReportStatus;
    submittedAt: Date;
}
