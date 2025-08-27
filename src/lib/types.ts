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
}
