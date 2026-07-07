
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";
import { checkPermissions } from "@/lib/permissions";

export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie');
    const loggedInUserCookie = cookieHeader
        ? cookieHeader.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1]
        : undefined;
    
    let isMaintenanceMode = false;
    try {
        isMaintenanceMode = await getMaintenanceMode();
    } catch (error) {
        console.error("Maintenance mode check failed:", error);
    }

    if (isMaintenanceMode && loggedInUserCookie) {
        const canByPass = await checkPermissions(loggedInUserCookie, 'BYPASS_MAINTENANCE_MODE');
        if (!canByPass) {
            redirect('/maintenance');
        }
    }
    
    return <>{children}</>;
}
