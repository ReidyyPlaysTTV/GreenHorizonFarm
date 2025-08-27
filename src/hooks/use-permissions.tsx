
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Permission, type Role } from "@/lib/types";
import { permissionsMap } from "@/lib/data";
import { getUsers } from "@/lib/actions";
import type { AppUser } from "@/lib/types";

type PermissionsContextType = {
    userRole: Role | null;
    hasPermission: (permission: Permission) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<Role | null>(null);

    useEffect(() => {
        const fetchUserRole = async () => {
             if (typeof window !== 'undefined') {
                const loggedInUser = localStorage.getItem("loggedInUser");
                if (loggedInUser) {
                    // Special case for the 'admin' user
                    if (loggedInUser.toLowerCase() === 'admin') {
                        setUserRole("Administrator");
                        return;
                    }
                    try {
                        // In a real app, this might come from a context or a dedicated hook
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
        fetchUserRole();
    }, []);

    const hasPermission = (permission: Permission) => {
        if (!userRole) return false;
        
        // Developer and Administrator roles have all permissions implicitly
        if (userRole === "Developer" || userRole === "Administrator") {
            return true;
        }

        const userPermissions = permissionsMap[userRole];
        if (!userPermissions) return false;

        return userPermissions.includes(permission);
    };

    return (
        <PermissionsContext.Provider value={{ userRole, hasPermission }}>
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
