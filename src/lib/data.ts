import type { Personnel, ArchivedPersonnel, BlacklistedPersonnel, Application, Department } from "./types";

const departments: Department[] = ["Commissioners Office", "High Command", "Command", "NCOS", "Corrections", "Training"];

const sampleNames = [
  "John Smith", "Jane Doe", "Peter Jones", "Mary Williams", "David Brown", 
  "Susan Davis", "Michael Miller", "Linda Wilson", "Robert Moore", "Patricia Taylor",
  "James Anderson", "Jennifer Thomas", "William Jackson", "Elizabeth White", "Richard Harris",
  "Sarah Martin", "Joseph Thompson", "Karen Garcia", "Charles Martinez", "Nancy Robinson"
];

const sampleRanks = {
  "Commissioners Office": ["Commissioner", "Deputy Commissioner"],
  "High Command": ["Chief", "Assistant Chief"],
  "Command": ["Captain", "Lieutenant"],
  "NCOS": ["Sergeant", "Corporal"],
  "Corrections": ["Senior Officer", "Corrections Officer", "Cadet"],
  "Training": ["Training Officer", "Recruitment Officer"],
};

export const personnel: Personnel[] = Array.from({ length: 50 }, (_, i) => {
  const department = departments[i % departments.length];
  const ranks = sampleRanks[department];
  return {
    id: `DOC${1001 + i}`,
    name: sampleNames[i % sampleNames.length],
    rank: ranks[i % ranks.length],
    badgeNumber: `${700 + i}`,
    department,
    avatarUrl: `https://i.pravatar.cc/40?u=${1001 + i}`,
  }
});

export const archivedPersonnel: ArchivedPersonnel[] = [
  { id: "ARC001", name: "Former Officer A", rank: "Corrections Officer", status: "Fired", date: "2023-01-15", reason: "Violation of conduct." },
  { id: "ARC002", name: "Former Officer B", rank: "Sergeant", status: "Resigned", date: "2023-02-20", reason: "Personal reasons." },
  { id: "ARC003", name: "Former Officer C", rank: "Cadet", status: "Fired", date: "2023-03-10", reason: "Failed training." },
];

export const blacklistedPersonnel: BlacklistedPersonnel[] = [
  { id: "BLK001", name: "Criminal Mastermind X", reason: "Multiple felonies.", dateAdded: "2022-05-21" },
  { id: "BLK002", name: "Troublemaker Y", reason: "Repeated hostile behavior.", dateAdded: "2023-01-30" },
];

export const applications: Application[] = [
  { id: "APP001", name: "Hopeful Candidate 1", age: 25, reasonForApplying: "I want to serve the community and uphold the law.", status: "Pending", submittedAt: new Date("2024-05-20T10:00:00Z") },
  { id: "APP002", name: "Eager Applicant 2", age: 31, reasonForApplying: "My father was an officer, and I want to follow in his footsteps.", status: "Pending", submittedAt: new Date("2024-05-22T14:30:00Z") },
  { id: "APP003", name: "Ambitious Individual 3", age: 22, reasonForApplying: "Seeking a challenging and rewarding career.", status: "Approved", submittedAt: new Date("2024-05-18T09:00:00Z") },
  { id: "APP004", name: "Rejected Person 4", age: 45, reasonForApplying: "Looking for a job.", status: "Rejected", submittedAt: new Date("2024-05-19T11:00:00Z") },
];
