
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";

/**
 * RouteProtectionProvider handles high-level system states like Maintenance Mode.
 * Improved resilience for unstable database connectivity.
 */
export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    let isMaintenanceMode = false;
    
    try {
        // Fetch maintenance status with a safe fallback
        isMaintenanceMode = await getMaintenanceMode();
    } catch (error) {
        // If DB fails, we assume maintenance is OFF to allow the app to attempt loading
        console.warn("RouteProtectionProvider: Maintenance check failed, bypassing protection.");
    }

    if (isMaintenanceMode) {
        const headersList = await headers();
        const cookieHeader = headersList.get('cookie');
        const loggedInUserCookie = cookieHeader
            ? cookieHeader.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1]
            : undefined;
            
        // Decode user with safety check
        let decodedUser = '';
        if (loggedInUserCookie) {
            try {
                decodedUser = decodeURIComponent(loggedInUserCookie);
            } catch (e) {
                decodedUser = '';
            }
        }
        
        // Only Leon Green and admin bypass maintenance
        if (decodedUser !== 'Leon Green' && decodedUser !== 'admin') {
            redirect('/maintenance');
        }
    }
    
    return <>{children}</>;
}
