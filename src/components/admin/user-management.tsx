"use client";

import type { AppUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { setUserStatus, deleteUser } from "@/lib/actions";
import { useState, useEffect } from "react";
import { Loader2, ShieldOff, MoreHorizontal, Trash2 } from "lucide-react";
import { AddUserForm } from "./add-user-form";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { EditUserDialog } from "./edit-user-dialog";
import { Badge } from "../ui/badge";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { roles } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { cn } from "@/lib/utils";

interface UserManagementProps {
    users: AppUser[];
    currentUser: string;
}

const getRoleClass = (role: string) => {
    return "animate-rgb-mesh border-none text-white font-black text-[10px] shadow-sm";
}

export function UserManagement({ users, currentUser }: UserManagementProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
    const { hasPermission } = usePermissions();
    const canManageUsers = hasPermission('MANAGE_USERS');
    const canDeleteUsers = hasPermission('DELETE_USERS');

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

    const handleDelete = async (userId: string) => {
        setIsUpdating(prev => ({...prev, [userId]: true}));
         try {
            const result = await deleteUser(userId, currentUser);
            if (result.success) {
                toast({
                    title: "User Deleted",
                    description: result.message,
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: error.message || `Could not delete the user.`,
            });
        } finally {
            setIsUpdating(prev => ({...prev, [userId]: false}));
        }
    }


    const activeUsers = users.filter(u => u.status === 'Active');

    return (
        <Card className="bg-black text-white border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription className="text-gray-400">Manage user accounts and their status.</CardDescription>
              </div>
              {canManageUsers && <AddUserForm />}
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full" defaultValue={roles}>
                    {roles.map(role => {
                        const usersInRole = activeUsers.filter(u => Array.isArray(u.roles) && u.roles.includes(role));
                        if (usersInRole.length === 0) return null;

                        return (
                            <AccordionItem value={role} key={role} className="border-gray-800">
                                <AccordionTrigger className="text-lg font-black hover:no-underline text-white/90">
                                    <span className="flex-1 text-left uppercase tracking-widest">{role} ({usersInRole.length})</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-gray-700">
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead className="text-white font-black uppercase text-[10px]">Username</TableHead>
                                                <TableHead className="text-white font-black uppercase text-[10px]">Permission Groups</TableHead>
                                                <TableHead className="text-white font-black uppercase text-[10px]">Status</TableHead>
                                                <TableHead className="text-right text-white font-black uppercase text-[10px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usersInRole.map(user => (
                                                <TableRow key={user.id} className="border-gray-800 hover:bg-white/5 transition-colors">
                                                    <TableCell>
                                                        <Avatar className="h-8 w-8 border border-white/10">
                                                            <AvatarImage src={user.avatarUrl} alt={user.username} className="object-cover" />
                                                            <AvatarFallback className="bg-muted text-[10px]">{user.username[0]}</AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-sm tracking-tight">{user.username}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {Array.isArray(user.roles) && user.roles.map(r => (
                                                                <Badge key={r} className={getRoleClass(r)}>{r}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.status === 'Active' ? 'secondary' : 'destructive'} className="text-[10px] uppercase font-black">
                                                            {user.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {isUpdating[user.id] ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                                                             user.username !== currentUser && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800 rounded-full">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="glass-card">
                                                                        {canManageUsers && <>
                                                                            <EditUserDialog user={user} />
                                                                            <ResetPasswordDialog user={user} />
                                                                            <DropdownMenuItem onClick={() => handleSetStatus(user.id, 'Banned')} className="text-destructive focus:text-destructive">
                                                                                <ShieldOff className="mr-2 h-4 w-4" />
                                                                                Ban User
                                                                            </DropdownMenuItem>
                                                                        </>}
                                                                        {canDeleteUsers && <>
                                                                            <DropdownMenuSeparator className="bg-white/5" />
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                     <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                                         <Trash2 className="mr-2 h-4 w-4" />
                                                                                         Delete User
                                                                                     </DropdownMenuItem>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent className="glass-card">
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{user.username}</span> and all of their associated data.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/80">Delete User</AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </>}
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