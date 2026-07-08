
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";

/**
 * RouteProtectionProvider handles high-level system states like Maintenance Mode.
 * Highly resilient fail-fast logic for unstable database environments.
 */
export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    let isMaintenanceMode = false;
    
    try {
        // Strict 1.5-second race timeout for the layout check
        const maintenancePromise = getMaintenanceMode();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('FAIL_FAST')), 1500)
        );
        
        isMaintenanceMode = await Promise.race([maintenancePromise, timeoutPromise]) as boolean;
    } catch (error) {
        // SILENT FAIL: If DB times out or errors, bypass maintenance to allow UI load.
        console.warn("RouteProtectionProvider: Database fail-fast triggered, bypassing maintenance.");
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
        
        // Safety: Master accounts bypass maintenance
        if (decodedUser !== 'Leon Green' && decodedUser !== 'admin') {
            redirect('/maintenance');
        }
    }
    
    return <>{children}</>;
}
