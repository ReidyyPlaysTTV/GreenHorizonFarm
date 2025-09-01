
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";
import { checkPermissions } from "@/lib/permissions";

export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    const headersList = headers();
    const loggedInUserCookie = headersList.get('cookie')?.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1];
    
    const isMaintenanceMode = await getMaintenanceMode();

    if (isMaintenanceMode && loggedInUserCookie) {
        const canBypass = await checkPermissions(loggedInUserCookie, 'BYPASS_MAINTENANCE_MODE');
        if (!canBypass) {
            redirect('/maintenance');
        }
    }
    
    // This part is handled by the AuthProvider on the client side now
    // to avoid issues with headers and server components.
    // We still need the cookie for the maintenance check above.

    return <>{children}</>;
}
