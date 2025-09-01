
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";
import { getUsers } from "@/lib/actions";

export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    const headersList = headers();
    const loggedInUserCookie = headersList.get('cookie')?.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1];
    
    const isMaintenanceMode = await getMaintenanceMode();
    const users = await getUsers();
    const currentUser = loggedInUserCookie ? users.find(u => u.username === loggedInUserCookie) : null;

    if (isMaintenanceMode) {
        let canBypass = false;
        if (currentUser && (currentUser.role === 'Developer' || currentUser.role === 'Administrator')) {
            canBypass = true;
        }
        
        if (!canBypass) {
            redirect('/maintenance');
        }
    }

    if (currentUser?.status === 'Banned') {
        redirect('/banned');
    }

    return <>{children}</>;
}
