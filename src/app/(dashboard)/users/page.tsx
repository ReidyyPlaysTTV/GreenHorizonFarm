
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
        case "CEO":
            return "bg-primary text-primary-foreground font-black";
        case "Co-CEO":
            return "bg-primary/80 text-primary-foreground font-bold";
        case "Manager":
            return "text-emerald-400 border-emerald-400/30";
        case "Book-Keeper":
            return "text-yellow-400 border-yellow-400/30";
        case "Business Co-Ordinator":
            return "text-blue-400 border-blue-400/30";
        case "Events Planner":
            return "text-pink-400 border-pink-400/30";
        case "Security":
            return "text-red-400 border-red-400/30";
        default:
            return "text-muted-foreground";
    }
}

const UserCard = ({ user, primaryRole }: { user: AppUser, primaryRole: string }) => {
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const otherRoles = userRoles.filter(r => r !== primaryRole);

    return (
        <Card className="flex flex-col border-primary/10 bg-card/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={user.avatarUrl} alt={user.username} className="object-cover" />
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle>
                        <Link href={`/users/${encodeURIComponent(user.username)}`} className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto text-xl font-bold tracking-tight")}>
                        {user.username}
                        </Link>
                    </CardTitle>
                    <CardDescription>{user.personnel?.rank || 'Civilian'}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    <span>Department</span>
                    <span className="text-foreground">{user.personnel?.department || "Unassigned"}</span>
                </div>
                <div className="flex flex-col items-start text-sm gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest flex items-center gap-1.5">
                        <Shield className="h-3 w-3" />
                        Permissions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", getRoleClass(primaryRole))}>
                            {primaryRole}
                        </Badge>
                        {otherRoles.map(role => (
                            <Badge key={role} variant="secondary" className={cn("font-bold text-[10px] uppercase bg-muted/50", getRoleClass(role))}>
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

    const getPrimaryRole = (userRoles: any) => {
        const rolesToCheck = Array.isArray(userRoles) ? userRoles : [];
        for (const role of roles) { // Iterate in order of role importance from types.ts
            if (rolesToCheck.includes(role)) {
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
                <h1 className="text-4xl font-black tracking-tighter text-primary">User Directory</h1>
                <p className="text-muted-foreground font-medium mt-1">
                Access profiles for all {users.length} registered farm personnel.
                </p>
            </div>
            <RefreshButton onRefresh={fetchUsers} />
        </div>

        <div className="mb-8">
            <Input
                placeholder="Search colleagues by name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md h-12 bg-card/50 border-primary/20"
            />
        </div>

        <div className="space-y-12">
            {roles.map((role) => {
            const usersInRole = filteredAndGroupedUsers[role];
            if (!usersInRole || usersInRole.length === 0) return null;

            return (
                <div key={role}>
                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6 flex items-center gap-4">
                    {role}
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    <Badge variant="outline" className="ml-auto font-black">{usersInRole.length}</Badge>
                </h2>
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
            <div className="flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-primary/10 bg-primary/5">
                <User className="h-12 w-12 text-primary opacity-20 mb-4" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">No matches found in directory.</p>
            </div>
        )}
        </div>
    );
}
