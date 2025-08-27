
"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Star, Hash, Mail, Activity, KeySquare, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAuditLogs, getPersonnel, getUsers } from "@/lib/actions";
import type { AppUser, Personnel, AuditLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/user/change-password-dialog";
import { ChangeProfilePictureDialog } from "@/components/user/change-profile-picture-dialog";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";


const getRoleClass = (role: string) => {
    switch (role) {
        case "Administrator":
            return "animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent";
        case "Developer":
            return "animate-dev-text";
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

const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
        case 'Active': return 'secondary';
        case 'LOA':
        case 'Medical Leave':
            return 'default';
        case 'Inactive':
        case 'Suspended':
        case 'Low Activity':
            return 'destructive';
        default: return 'secondary';
    }
};

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const decodedUsername = decodeURIComponent(username);

  const [user, setUser] = useState<AppUser | null>(null);
  const [personnelRecord, setPersonnelRecord] = useState<Personnel | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoggedInUser(localStorage.getItem('loggedInUser'));
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const users = await getUsers();
        const foundUser = users.find(u => u.username === decodedUsername);

        if (!foundUser) {
          notFound();
          return;
        }
        setUser(foundUser);
        
        const personnel = await getPersonnel();
        const foundPersonnel = personnel.find(p => p.name === foundUser.username) || null;
        setPersonnelRecord(foundPersonnel);

        const logs = await getAuditLogs({ username: decodedUsername });
        setActivityLogs(logs);

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [decodedUsername]);
  
  if (loading) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center space-x-6 mb-8">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </div>
             <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="md:col-span-2">
                    <Skeleton className="h-80 w-full" />
                </div>
             </div>
        </div>
    )
  }

  if (!user) {
    return notFound();
  }
  
  const isOwnProfile = loggedInUser === user.username;
  const lastLogin = activityLogs.find(log => log.actionType === 'Login');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center space-x-6 mb-8">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={personnelRecord?.avatarUrl} />
          <AvatarFallback className="text-3xl">
            <User />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{user.username}</h1>
          <p className="text-xl text-muted-foreground">{personnelRecord?.rank || 'Civilian'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Identity</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Username</span>
                        <span className="font-medium">{user.username}</span>
                    </div>
                     {personnelRecord?.discordUsername && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Discord</span>
                            <span className="font-medium">{personnelRecord.discordUsername}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Permission Group</span>
                         <span className={cn("font-bold text-lg", getRoleClass(user.role))}>{user.role}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span>Security</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">User Since</span>
                        <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Login</span>
                        <span className="font-medium">{lastLogin ? formatDistanceToNow(lastLogin.timestamp, {addSuffix: true}) : 'Never'}</span>
                    </div>
                </CardContent>
                {isOwnProfile && (
                    <CardContent className="border-t pt-4 mt-4 space-y-2">
                         <ChangeProfilePictureDialog user={user} personnel={personnelRecord}>
                             <Button variant="outline" className="w-full justify-start gap-2">
                                <ImageIcon /> Change Profile Picture
                             </Button>
                         </ChangeProfilePictureDialog>
                          <ChangePasswordDialog user={user}>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <KeySquare /> Change Password
                            </Button>
                         </ChangePasswordDialog>
                    </CardContent>
                )}
            </Card>
        </div>
        <div className="lg:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <span>Roster Information</span>
                    </CardTitle>
                </CardHeader>
                {personnelRecord ? (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Star className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Rank</p>
                            <p className="font-semibold">{personnelRecord.rank}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Hash className="h-6 w-6 text-muted-foreground" />
                            <div>
                            <p className="text-sm text-muted-foreground">Callsign</p>
                            <p className="font-semibold">#{personnelRecord.badgeNumber}</p>
                        </div>
                    </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Department</p>
                            <p className="font-semibold">{personnelRecord.department}</p>
                        </div>
                    </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Image src={personnelRecord.avatarUrl} alt="Insignia" width={20} height={20} className="object-contain" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={getStatusBadgeVariant(personnelRecord.status)}>{personnelRecord.status}</Badge>
                        </div>
                    </div>
                </CardContent>
                ) : (
                <CardContent className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground">This user is not an active DOC personnel member.</p>
                </CardContent>
                )}
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <span>Activity Log</span>
                    </CardTitle>
                    <CardDescription>Recent actions performed by this user.</CardDescription>
                </CardHeader>
                <CardContent>
                    {activityLogs.length > 0 ? (
                        <ul className="space-y-4">
                            {activityLogs.map(log => (
                                <li key={log.id} className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{log.actionType}</p>
                                        <p className="text-sm text-muted-foreground">{log.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No activity recorded for this user.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}
