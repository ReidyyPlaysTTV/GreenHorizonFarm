
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Permission, type Role } from "@/lib/types";
import { getPermissionsMap } from "@/lib/actions/permission-actions";
import { getUsers } from "@/lib/actions";
import type { AppUser } from "@/lib/types";
import { usePathname } from "next/navigation";

type PermissionsMap = Record<Role, Permission[]>;

type PermissionsContextType = {
    userRole: Role | null;
    hasPermission: (permission: Permission) => boolean;
    permissionsMap: PermissionsMap | null;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [permissionsMap, setPermissionsMap] = useState<PermissionsMap | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUserAndPermissions = async () => {
             if (typeof window !== 'undefined') {
                const loggedInUser = localStorage.getItem("loggedInUser");
                
                try {
                    const fetchedMap = await getPermissionsMap();
                    setPermissionsMap(fetchedMap);
                } catch(e) {
                     console.error("Failed to fetch permissions map", e);
                }

                if (loggedInUser) {
                    if (loggedInUser.toLowerCase() === 'admin') {
                        setUserRole("Administrator");
                        return;
                    }
                    try {
                        const allUsers: AppUser[] = await getUsers();
                        const currentUser = allUsers.find((u: any) => u.username === loggedInUser);
                        setUserRole(currentUser?.role || "User");
                    } catch (e) {
                        console.error("Failed to fetch user roles, defaulting to 'User'", e);
                        setUserRole("User");
                    }
                } else {
                    setUserRole(null); // No user logged in
                }
            }
        };
        fetchUserAndPermissions();
    }, [pathname]);

    const hasPermission = (permission: Permission) => {
        if (!userRole || !permissionsMap) return false;
        
        if (userRole === "Developer" || userRole === "Administrator") {
            return true;
        }

        const userPermissions = permissionsMap[userRole];
        if (!userPermissions) return false;

        return userPermissions.includes(permission);
    };

    return (
        <PermissionsContext.Provider value={{ userRole, hasPermission, permissionsMap }}>
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
