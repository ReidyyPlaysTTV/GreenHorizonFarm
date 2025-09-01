
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMaintenanceMode } from "@/lib/actions/settings-actions";
import { getUsers } from "@/lib/actions";

export async function RouteProtectionProvider({ children }: { children: React.ReactNode }) {
    const headersList = headers();
    const loggedInUserCookie = headersList.get('cookie')?.split('; ').find(row => row.startsWith('loggedInUser='))?.split('=')[1];
    
    // Fetch users once to avoid multiple database calls and ensure consistency
    const users = await getUsers();
    const currentUser = loggedInUserCookie ? users.find(u => u.username === loggedInUserCookie) : null;

    // Check maintenance mode
    const isMaintenanceMode = await getMaintenanceMode();
    if (isMaintenanceMode) {
        // Redirect if not logged in or if the logged-in user is not a developer
        if (!currentUser || currentUser.role !== 'Developer') {
            redirect('/maintenance');
        }
    }

    // Check for banned status if a user is logged in
    if (currentUser?.status === 'Banned') {
        redirect('/banned');
    }

    return <>{children}</>;
}
