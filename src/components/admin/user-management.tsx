
"use client";

import type { AppUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { assignUserRole } from "@/lib/actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface UserManagementProps {
    users: AppUser[];
}

// In a real app, these roles would be fetched from the database.
const roles = ["Developer", "Administrator", "Commissioners Office", "High Command", "Command", "NCOs", "User"];

export function UserManagement({ users }: UserManagementProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

    const handleRoleChange = async (userId: string, role: string) => {
        setIsUpdating(prev => ({...prev, [userId]: true}));
        try {
            const result = await assignUserRole(userId, role);
            if (result.success) {
                toast({
                    title: "Role Updated",
                    description: `User's role has been successfully changed to ${role}.`,
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: `Could not update the user's role.`,
            });
        } finally {
            setIsUpdating(prev => ({...prev, [userId]: false}));
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Assign roles to registered application users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead className="w-[250px]">Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>
                                     <div className="flex items-center gap-2">
                                        {isUpdating[user.id] && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <Select 
                                            defaultValue={user.role} 
                                            onValueChange={(value) => handleRoleChange(user.id, value)}
                                            disabled={isUpdating[user.id]}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(role => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                     </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
