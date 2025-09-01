

"use client";

import type { AppUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { setUserStatus } from "@/lib/actions";
import { useState, useEffect } from "react";
import { Loader2, ShieldOff, ShieldCheck, MoreHorizontal, KeySquare } from "lucide-react";
import { AddUserForm } from "./add-user-form";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EditUserDialog } from "./edit-user-dialog";
import { Badge } from "../ui/badge";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface UserManagementProps {
    users: AppUser[];
}

export function UserManagement({ users }: UserManagementProps) {
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

    const handleSetStatus = async (userId: string, status: 'Active' | 'Banned') => {
        setIsUpdating(prev => ({...prev, [userId]: true}));
        try {
            const result = await setUserStatus({ userId, status, adminUser: currentUser });
            if (result.success) {
                toast({
                    title: "Status Updated",
                    description: `User status has been updated to ${status}.`,
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || `Could not update the user's status.`,
            });
        } finally {
            setIsUpdating(prev => ({...prev, [userId]: false}));
        }
    }

    const activeUsers = users.filter(u => u.status === 'Active');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and their status.</CardDescription>
              </div>
              {canManageUsers && <AddUserForm />}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                 <TableCell>
                                    <Badge variant={user.status === 'Active' ? 'secondary' : 'destructive'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     {isUpdating[user.id] ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                                        canManageUsers && user.username !== currentUser && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <EditUserDialog user={user} />
                                                    <ResetPasswordDialog user={user} />
                                                    <DropdownMenuItem onClick={() => handleSetStatus(user.id, 'Banned')} className="text-destructive focus:text-destructive">
                                                        <ShieldOff className="mr-2 h-4 w-4" />
                                                        Ban User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )
                                     )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
