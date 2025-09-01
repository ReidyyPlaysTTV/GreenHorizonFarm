
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";
import { getUsers } from "@/lib/actions";

export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    const headersList = headers();
    const loggedInUserCookie = headersList.get('cookie')?.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1];
    
    const isMaintenanceMode = await getMaintenanceMode();

    if (isMaintenanceMode) {
        let isDeveloper = false;
        if (loggedInUserCookie) {
            const users = await getUsers();
            const currentUser = users.find(u => u.username === loggedInUserCookie);
            if (currentUser && currentUser.role === 'Developer') {
                isDeveloper = true;
            }
        }
        
        if (!isDeveloper) {
            redirect('/maintenance');
        }
    } else {
         if (loggedInUserCookie) {
            const users = await getUsers();
            const currentUser = users.find(u => u.username === loggedInUserCookie);
            if (currentUser?.status === 'Banned') {
                redirect('/banned');
            }
         }
    }

    return <>{children}</>;
}
