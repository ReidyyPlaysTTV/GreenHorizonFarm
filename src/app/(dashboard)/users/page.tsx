
import { getUsers, getPersonnel } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshButton } from "@/components/layout/refresh-button";
import type { AppUser } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default async function UsersPage() {
  const users: AppUser[] = await getUsers();
  const personnel = await getPersonnel();

  const usersWithPersonnelData = users.map(user => {
    const personnelRecord = personnel.find(p => p.name === user.username);
    return {
      ...user,
      personnel: personnelRecord || null,
    };
  });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Registered Users</h1>
            <p className="text-muted-foreground">
            List of all users with access to this application.
            </p>
        </div>
        <RefreshButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A total of {users.length} users are registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">Avatar</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Permission Group</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithPersonnelData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                     <Avatar>
                      <AvatarImage src={user.personnel?.avatarUrl} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.personnel?.rank || "N/A"}</TableCell>
                  <TableCell>{user.personnel?.department || "N/A"}</TableCell>
                </TableRow>
              ))}
               {users.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No users found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
