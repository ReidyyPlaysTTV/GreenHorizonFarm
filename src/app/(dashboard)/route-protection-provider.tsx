
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";

/**
 * Provides server-side route protection and maintenance mode enforcement.
 * Uses an aggressive race strategy to prevent MariaDB latency from blocking navigation.
 */
export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    let isMaintenanceMode = false;
    
    try {
        // Race the DB check against a tight timeout
        const maintenancePromise = getMaintenanceMode();
        const timeoutPromise = new Promise<boolean>((resolve) => 
            setTimeout(() => resolve(false), 800) // 800ms fail-fast for navigation snappiness
        );
        
        isMaintenanceMode = await Promise.race([maintenancePromise, timeoutPromise]);
    } catch (error) {
        // Silent fail - assume app is operational if DB is unreachable
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
