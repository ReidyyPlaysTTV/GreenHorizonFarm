
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";

/**
 * RouteProtectionProvider handles high-level system states like Maintenance Mode.
 * It is designed to be non-blocking if the database is unreachable.
 */
export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    // In diagnostic mode, we skip heavy blocking server-side DB checks 
    // to ensure the layout always renders.
    
    let isMaintenanceMode = false;
    try {
        // Maintenance mode check should fail-fast
        isMaintenanceMode = await getMaintenanceMode();
    } catch (error) {
        // Log but don't crash the layout
        console.warn("RouteProtectionProvider: Maintenance check bypassed due to timeout.");
    }

    if (isMaintenanceMode) {
        const headersList = await headers();
        const cookieHeader = headersList.get('cookie');
        const loggedInUser = cookieHeader
            ? cookieHeader.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1]
            : undefined;
            
        // If it's not a developer, redirect to maintenance
        if (loggedInUser !== 'Leon%20Green' && loggedInUser !== 'admin') {
            redirect('/maintenance');
        }
    }
    
    return <>{children}</>;
}
