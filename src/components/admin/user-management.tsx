
"use client";

import type { AppUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { setUserStatus } from "@/lib/actions";
import { useState, useEffect } from "react";
import { Loader2, ShieldOff, MoreHorizontal } from "lucide-react";
import { AddUserForm } from "./add-user-form";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EditUserDialog } from "./edit-user-dialog";
import { Badge } from "../ui/badge";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { roles } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

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
        <Card className="bg-destructive-foreground/5 border-destructive-foreground/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription className="text-destructive-foreground/60">Manage user accounts and their status.</CardDescription>
              </div>
              {canManageUsers && <AddUserForm />}
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full" defaultValue={roles}>
                    {roles.map(role => {
                        const usersInRole = activeUsers.filter(u => u.role === role);
                        if (usersInRole.length === 0) return null;

                        return (
                            <AccordionItem value={role} key={role} className="border-destructive-foreground/20">
                                <AccordionTrigger className="text-lg font-medium hover:no-underline">
                                    <span className="flex-1 text-left">{role} ({usersInRole.length})</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-destructive-foreground/20">
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Username</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usersInRole.map(user => (
                                                <TableRow key={user.id} className="border-destructive-foreground/20">
                                                    <TableCell>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                                            <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.username}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.status === 'Active' ? 'secondary' : 'destructive'} className="bg-destructive-foreground/10 text-destructive-foreground">
                                                            {user.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {isUpdating[user.id] ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                                                            canManageUsers && user.username !== currentUser && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive-foreground/10">
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
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </CardContent>
        </Card>
    )
}
