

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

const UserCard = ({ user }: { user: AppUser }) => (
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
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    Permission Group
                </span>
                <span className={cn("font-bold text-base", getRoleClass(user.role))}>
                    {user.role}
                </span>
            </div>
        </CardContent>
    </Card>
);


export default async function UsersPage() {
  const users: AppUser[] = await getUsers();
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Registered Users</h1>
            <p className="text-muted-foreground">
            List of all users with access to this application. A total of {users.length} users are registered.
            </p>
        </div>
        <RefreshButton />
      </div>

      <div className="space-y-8">
        {roles.map((role) => {
          const usersInRole = users.filter(user => user.role === role);
          if (usersInRole.length === 0) return null;

          return (
            <div key={role}>
              <h2 className="text-2xl font-semibold tracking-tight mb-4">{role} ({usersInRole.length})</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {usersInRole.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

       {users.length === 0 && (
         <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No users found.</p>
        </div>
      )}
    </div>
  );
}
