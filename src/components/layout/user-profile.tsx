
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function UserProfile() {
    const { state } = useSidebar();
    const [user, setUser] = useState({
        name: "User",
        role: "Developer",
        avatarUrl: ""
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const loggedInUserName = localStorage.getItem('loggedInUser');
            if (loggedInUserName) {
                setUser(prevUser => ({...prevUser, name: loggedInUserName}));
            }
        }
    }, []);
    
    // In a real app, you'd fetch the user from an auth context
    const profileLink = `/users/${encodeURIComponent(user.name)}`;

    if (state === "collapsed") {
        return (
             <Link href={profileLink} className="block p-2">
                <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
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
                 {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                 <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                 </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
        </Link>
    )
}
