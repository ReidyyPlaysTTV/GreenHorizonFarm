
"use client";

import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUsers } from "@/lib/actions";
import type { AppUser } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "lucide-react";


export function UserProfile() {
    const { state } = useSidebar();
    const [user, setUser] = useState<AppUser | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUserData = async () => {
            if (typeof window !== 'undefined') {
                const loggedInUserName = localStorage.getItem('loggedInUser');
                if (loggedInUserName) {
                    try {
                        const allUsers = await getUsers();
                        const currentUser = allUsers.find(u => u.username === loggedInUserName);
                        setUser(currentUser || null);
                    } catch (error) {
                        console.error("Failed to fetch user data for profile", error);
                        setUser({ id: 'temp', username: loggedInUserName, role: 'User' });
                    }
                }
            }
        };

        fetchUserData();
    }, [pathname]);
    
    if (!user) {
        return null; // Or a loading skeleton
    }
    
    const profileLink = `/users/${encodeURIComponent(user.username)}`;
    
    return (
        <Link href={profileLink} className="flex items-center justify-center gap-2 p-2 rounded-md hover:bg-accent transition-colors group-data-[state=expanded]:justify-start">
             <Avatar className="h-8 w-8 text-lg">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
            </Avatar>
            <div className="flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-foreground">{user.username}</span>
            </div>
        </Link>
    )
}
