
"use client";

import type { Personnel } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserManagementProps {
    personnel: Personnel[];
}

// In a real app, these roles would be fetched from the database.
const roles = ["Developer", "Administrator", "Commissioners Office", "High Command", "Command", "NCOs", "User"];

export function UserManagement({ personnel }: UserManagementProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Assign roles to users. Changes are saved automatically.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead className="w-[250px]">Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {personnel.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell>{p.rank}</TableCell>
                                <TableCell>
                                     <Select defaultValue="User">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
