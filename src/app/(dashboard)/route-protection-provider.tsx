
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";
import { getUsers } from "@/lib/actions";

export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    const headersList = headers();
    // Getting cookies from headers is a way to access them in Server Components
    const loggedInUserCookie = headersList.get('cookie')?.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1];
    
    // Check maintenance mode
    const isMaintenanceMode = await getMaintenanceMode();

    if (isMaintenanceMode) {
        if (loggedInUserCookie) {
            const users = await getUsers();
            const currentUser = users.find(u => u.username === loggedInUserCookie);
            // Only allow developers to pass
            if (currentUser?.role !== 'Developer') {
                redirect('/maintenance');
            }
        } else {
            // If not logged in during maintenance, redirect
            redirect('/maintenance');
        }
    }

    // Check for banned status
    if (loggedInUserCookie) {
        const users = await getUsers();
        const currentUser = users.find(u => u.username === loggedInUserCookie);
        if (currentUser?.status === 'Banned') {
            redirect('/banned');
        }
    }

    return <>{children}</>;
}
