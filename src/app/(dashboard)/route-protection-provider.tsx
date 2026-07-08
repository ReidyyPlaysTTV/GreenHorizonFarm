
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";

/**
 * RouteProtectionProvider handles high-level system states like Maintenance Mode.
 * It is designed to be non-blocking if the database is unreachable or timing out.
 */
export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    let isMaintenanceMode = false;
    
    try {
        // We use a safe wrapper or internal timeout check if necessary, 
        // but getMaintenanceMode already handles internal try/catch.
        isMaintenanceMode = await getMaintenanceMode();
    } catch (error) {
        // Log but don't crash the layout
        console.warn("RouteProtectionProvider: Maintenance check failed, defaulting to OFF.");
    }

    if (isMaintenanceMode) {
        const headersList = await headers();
        const cookieHeader = headersList.get('cookie');
        const loggedInUser = cookieHeader
            ? cookieHeader.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1]
            : undefined;
            
        // If it's not a developer or admin, redirect to maintenance
        const decodedUser = loggedInUser ? decodeURIComponent(loggedInUser) : '';
        if (decodedUser !== 'Leon Green' && decodedUser !== 'admin') {
            redirect('/maintenance');
        }
    }
    
    return <>{children}</>;
}
