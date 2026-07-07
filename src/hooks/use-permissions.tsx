
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { initialPermissionsMap } from "@/lib/data";
import type { Role, Permission } from "@/lib/types";
import { getUsers } from "@/lib/actions";

type PermissionsContextType = {
    userRoles: string[] | null;
    hasPermission: (permission: Permission) => boolean;
    permissionsMap: Record<Role, Permission[]> | null;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [userRoles, setUserRoles] = useState<string[] | null>(null);
    const [permissionsMap, setPermissionsMap] = useState<Record<Role, Permission[]> | null>(initialPermissionsMap);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUserData = async () => {
            const loggedInUsername = typeof window !== 'undefined' ? localStorage.getItem("loggedInUser") : null;
            
            if (loggedInUsername) {
                try {
                    const users = await getUsers();
                    const user = users.find(u => u.username === loggedInUsername);
                    if (user) {
                        setUserRoles(user.roles);
                    } else {
                        // Simulated high-level access for dev mode if user not found in DB
                        setUserRoles(["CEO"]);
                    }
                } catch (e) {
                    setUserRoles(["CEO"]);
                }
            } else {
                setUserRoles(null);
            }
        };
        fetchUserData();
    }, [pathname]);

    const hasPermission = (permission: Permission) => {
        if (!userRoles || !permissionsMap) return false;
        
        // Universal Admin/Dev Check
        if (userRoles.includes("CEO") || userRoles.includes("Administrator") || userRoles.includes("Developer")) {
            return true;
        }

        // Check if any of the user's roles have the required permission
        return userRoles.some(role => {
            const rolePermissions = permissionsMap[role as Role];
            return rolePermissions?.includes(permission);
        });
    };

    return (
        <PermissionsContext.Provider value={{ userRoles, hasPermission, permissionsMap }}>
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
