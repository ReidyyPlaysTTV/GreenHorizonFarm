
"use client";

import type { AppUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { setUserStatus } from "@/lib/actions";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface BannedUsersManagementProps {
    users: AppUser[];
}

export function BannedUsersManagement({ users }: BannedUsersManagementProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
    const [currentUser, setCurrentUser] = useState("System");
    const { hasPermission } = usePermissions();
    const canManageUsers = hasPermission('MANAGE_USERS');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUser(localStorage.getItem('loggedInUser') || "System");
        }
    }, []);

    const handleUnban = async (userId: string) => {
        setIsUpdating(prev => ({...prev, [userId]: true}));
        try {
            const result = await setUserStatus({ userId, status: 'Active', adminUser: currentUser });
            if (result.success) {
                toast({
                    title: "User Unbanned",
                    description: `The user can now access the application again.`,
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || `Could not unban the user.`,
            });
        } finally {
            setIsUpdating(prev => ({...prev, [userId]: false}));
        }
    }

    const bannedUsers = users.filter(u => u.status === 'Banned');

    return (
        <Card className="bg-destructive-foreground/5 border-destructive-foreground/20">
            <CardHeader>
                <CardTitle>Banned Users</CardTitle>
                <CardDescription className="text-destructive-foreground/60">Users who are currently banned from accessing the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-destructive-foreground/20">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bannedUsers.length > 0 ? (
                            bannedUsers.map(user => (
                                <TableRow key={user.id} className="border-destructive-foreground/20">
                                     <TableCell>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                            <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell className="text-right">
                                        {isUpdating[user.id] ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                                            canManageUsers && (
                                                <Button variant="outline" size="sm" onClick={() => handleUnban(user.id)} className="bg-destructive-foreground/10 hover:bg-destructive-foreground/20 text-destructive-foreground border-destructive-foreground/20">
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                    Unban
                                                </Button>
                                            )
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No users are currently banned.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
