
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { User } from "lucide-react";

export function UserProfile() {
    const { state } = useSidebar();
    
    // In a real app, you'd fetch the user from an auth context
    const user = {
        name: "Admin User",
        role: "Developer",
        avatarUrl: ""
    };

    if (state === "collapsed") {
        return (
            <div className="p-2">
                <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 p-2">
            <Avatar className="h-10 w-10">
                 {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                 <AvatarFallback>
                    {user.name.charAt(0)}
                 </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
        </div>
    )
}
