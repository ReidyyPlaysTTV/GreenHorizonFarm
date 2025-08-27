
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUsers } from "@/lib/actions";
import type { AppUser } from "@/lib/types";
import { usePathname } from "next/navigation";


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
    
    // In a real app, you'd fetch the user from an auth context
    const profileLink = `/users/${encodeURIComponent(user.username)}`;
    const avatarUrl = user.personnel?.avatarUrl;

    if (state === "collapsed") {
        return (
             <Link href={profileLink} className="block p-2">
                <Avatar className="h-8 w-8">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            </Link>
        )
    }

    return (
        <Link href={profileLink} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
            <Avatar className="h-10 w-10">
                 {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
                 <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                 </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{user.username}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
        </Link>
    )
}
