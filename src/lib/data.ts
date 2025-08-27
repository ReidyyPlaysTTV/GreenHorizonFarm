
import type { Department } from "./types";

export const departments: Department[] = ["Commissioners Office", "High Command", "Command", "NCOS", "Corrections", "Training"];

export const rankInsignias: Record<string, string> = {
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
};

export const rankToDepartmentMap: Record<string, Department> = {
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
};

export const rankOrder = [
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
