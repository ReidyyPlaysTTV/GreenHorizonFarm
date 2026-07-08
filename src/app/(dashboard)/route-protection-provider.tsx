
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";

/**
 * RouteProtectionProvider handles high-level system states like Maintenance Mode.
 * Improved resilience for unstable database connectivity with internal timeouts.
 */
export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    let isMaintenanceMode = false;
    
    try {
        // We race the maintenance check against a 3-second timeout to prevent layout hangs.
        const maintenancePromise = getMaintenanceMode();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 3000)
        );
        
        isMaintenanceMode = await Promise.race([maintenancePromise, timeoutPromise]) as boolean;
    } catch (error) {
        // If DB fails or times out, we assume maintenance is OFF to allow the app to attempt loading UI
        console.warn("RouteProtectionProvider: Maintenance check timed out or failed, bypassing protection.");
    }

    if (isMaintenanceMode) {
        const headersList = await headers();
        const cookieHeader = headersList.get('cookie');
        const loggedInUserCookie = cookieHeader
            ? cookieHeader.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1]
            : undefined;
            
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
