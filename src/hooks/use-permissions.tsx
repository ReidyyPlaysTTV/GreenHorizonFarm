
"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { initialPermissionsMap } from "@/lib/data";
import type { Role, Permission } from "@/lib/types";
import { getUserByUsername } from "@/lib/actions";

type PermissionsContextType = {
    userRoles: string[] | null;
    hasPermission: (permission: Permission) => boolean;
    permissionsMap: Record<Role, Permission[]> | null;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// In-memory cache to prevent re-fetching on every navigation
const rolesCache: Record<string, string[]> = {};

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [userRoles, setUserRoles] = useState<string[] | null>(null);
    const [permissionsMap, setPermissionsMap] = useState<Record<Role, Permission[]> | null>(initialPermissionsMap);
    const pathname = usePathname();
    const isFetching = useRef(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const loggedInUsername = typeof window !== 'undefined' ? localStorage.getItem("loggedInUser") : null;
            
            if (loggedInUsername) {
                // Return fast if developer/admin
                if (loggedInUsername === 'Leon Green' || loggedInUsername === 'admin') {
                    setUserRoles(["Developer", "Administrator", "CEO"]);
                    return;
                }

                // Check in-memory cache first to avoid DB call
                if (rolesCache[loggedInUsername]) {
                    setUserRoles(rolesCache[loggedInUsername]);
                    return;
                }

                if (isFetching.current) return;
                isFetching.current = true;

                try {
                    const user = await getUserByUsername(loggedInUsername);
                    if (user) {
                        rolesCache[loggedInUsername] = user.roles;
                        setUserRoles(user.roles);
                    } else {
                        setUserRoles(["User"]);
                    }
                } catch (e) {
                    setUserRoles(["User"]);
                } finally {
                    isFetching.current = false;
                }
            } else {
                setUserRoles(null);
            }
        };
        fetchUserData();
    }, [pathname]);

    const hasPermission = (permission: Permission) => {
        if (!userRoles || !permissionsMap) return false;
        
        if (userRoles.includes("CEO") || userRoles.includes("Administrator") || userRoles.includes("Developer")) {
            return true;
        }

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
