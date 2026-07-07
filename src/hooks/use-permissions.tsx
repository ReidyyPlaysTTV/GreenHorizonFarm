
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Permission } from "@/lib/types";
import { usePathname } from "next/navigation";
import { DISCORD_ROLES, PORTAL_MAPPING } from "@/lib/discord";

type PermissionsContextType = {
    userRoles: string[] | null;
    hasPermission: (permission: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [userRoles, setUserRoles] = useState<string[] | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // In a real Discord OAuth implementation, this would fetch from Firebase User Profile or a secure cookie.
        // For MVP, we check localStorage or simulate based on loggedInUser.
        const loggedInUser = typeof window !== 'undefined' ? localStorage.getItem("loggedInUser") : null;
        
        if (loggedInUser) {
            // Mocking role assignment for the demo.
            // In production, userRoles would be a list of Discord Role IDs fetched after authentication.
            if (loggedInUser.includes("CEO")) {
                setUserRoles([DISCORD_ROLES.CEO]);
            } else if (loggedInUser.includes("Manager")) {
                setUserRoles([DISCORD_ROLES.MANAGER]);
            } else if (loggedInUser.includes("Security")) {
                setUserRoles([DISCORD_ROLES.SECURITY]);
            } else {
                setUserRoles([DISCORD_ROLES.FARM_HAND]);
            }
        } else {
            setUserRoles(null);
        }
    }, [pathname]);

    const hasPermission = (permission: string) => {
        if (!userRoles) return false;
        
        // Universal Admin Check
        if (userRoles.includes(DISCORD_ROLES.CEO) || userRoles.includes(DISCORD_ROLES.CO_CEO)) {
            return true;
        }

        // Access Map for Portals
        switch (permission) {
            case 'ACCESS_DASHBOARD': return true;
            case 'VIEW_SOPS': return true;
            case 'ACCESS_FARMERS':
                return userRoles.some(r => PORTAL_MAPPING.FARMERS.includes(r as any));
            case 'ACCESS_SECURITY':
                return userRoles.some(r => PORTAL_MAPPING.SECURITY.includes(r as any));
            case 'ACCESS_EVENTS':
                return userRoles.some(r => PORTAL_MAPPING.EVENTS.includes(r as any));
            case 'ACCESS_FINANCES':
                return userRoles.some(r => PORTAL_MAPPING.FINANCES.includes(r as any));
            case 'ACCESS_MANAGER_PORTAL':
                return userRoles.some(r => PORTAL_MAPPING.MANAGER.includes(r as any));
            case 'ACCESS_CEO_PORTAL':
                return userRoles.some(r => PORTAL_MAPPING.CEO.includes(r as any));
            case 'ACCESS_ADMIN_PANEL':
                return userRoles.includes(DISCORD_ROLES.CEO) || userRoles.includes(DISCORD_ROLES.CO_CEO);
            default:
                return true; // Default permissions
        }
    };

    return (
        <PermissionsContext.Provider value={{ userRoles, hasPermission }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error("usePermissions must be used within a PermissionsProvider");
    }
    return context;
}
