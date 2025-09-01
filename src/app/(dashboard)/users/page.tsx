
"use client";

import { useState, useEffect, useMemo } from "react";
import { getUsers } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshButton } from "@/components/layout/refresh-button";
import type { AppUser } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Shield } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { roles } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const getRoleClass = (role: string) => {
    switch (role) {
        case "Administrator":
            return "animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent";
        case "Developer":
            return "animate-dev-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent";
        case "Commissioners Office":
            return "animate-co-text";
        case "High Command":
            return "animate-hc-text";
        case "Command":
            return "animate-cmd-text";
        case "NCOs":
            return "animate-nco-text";
        case "Corrections":
             return "animate-co-text-yellow";
        case "User":
            return "animate-user-text";
        case "Training":
            return "text-yellow-400";
        default:
            return "";
    }
}

const UserCard = ({ user, primaryRole }: { user: AppUser, primaryRole: string }) => {
    const otherRoles = user.roles.filter(r => r !== primaryRole);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle>
                        <Link href={`/users/${encodeURIComponent(user.username)}`} className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto text-xl")}>
                        {user.username}
                        </Link>
                    </CardTitle>
                    <CardDescription>{user.personnel?.rank || 'Civilian'}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{user.personnel?.department || "Department of Corrections"}</span>
                </div>
                <div className="flex flex-col items-start text-sm gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Shield className="h-4 w-4" />
                        Permission Groups
                    </span>
                    <div className="flex flex-wrap gap-1">
                        <Badge className={cn("font-bold", getRoleClass(primaryRole))}>
                            {primaryRole}
                        </Badge>
                        {otherRoles.map(role => (
                            <Badge key={role} variant="secondary" className={cn("font-bold", getRoleClass(role))}>
                                {role}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getPrimaryRole = (userRoles: string[]) => {
        for (const role of roles) { // Iterate in order of role importance
            if (userRoles.includes(role)) {
                return role;
            }
        }
        return "User"; // Default fallback
    };
    
    const filteredAndGroupedUsers = useMemo(() => {
        const filtered = users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.personnel?.rank?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const grouped: Record<string, AppUser[]> = {};

        filtered.forEach(user => {
            const primaryRole = getPrimaryRole(user.roles);
            if (!grouped[primaryRole]) {
                grouped[primaryRole] = [];
            }
            grouped[primaryRole].push(user);
        });
        
        return grouped;

    }, [users, searchTerm]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-10" />
                </div>
                 <div className="mb-8">
                    <Skeleton className="h-10 w-full max-w-sm" />
                </div>
                <div className="space-y-8">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i}>
                            <Skeleton className="h-8 w-48 mb-4" />
                             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {Array.from({length: 4}).map((_, j) => (
                                    <Skeleton key={j} className="h-48 w-full" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Registered Users</h1>
                <p className="text-muted-foreground">
                List of all users with access to this application. A total of {users.length} users are registered.
                </p>
            </div>
            <RefreshButton onRefresh={fetchUsers} />
        </div>

        <div className="mb-8">
            <Input
                placeholder="Search by username or rank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>

        <div className="space-y-8">
            {roles.map((role) => {
            const usersInRole = filteredAndGroupedUsers[role];
            if (!usersInRole || usersInRole.length === 0) return null;

            return (
                <div key={role}>
                <h2 className="text-2xl font-semibold tracking-tight mb-4">{role} ({usersInRole.length})</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {usersInRole.map((user) => (
                    <UserCard key={user.id} user={user} primaryRole={role} />
                    ))}
                </div>
                </div>
            );
            })}
        </div>

        {Object.keys(filteredAndGroupedUsers).length === 0 && !loading && (
            <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No users found matching your search.</p>
            </div>
        )}
        </div>
    );
}
