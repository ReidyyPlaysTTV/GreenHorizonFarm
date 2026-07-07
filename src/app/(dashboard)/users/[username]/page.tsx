
"use client";

import { useEffect, useState, useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Star, Mail, Activity, KeySquare, Image as ImageIcon, FileCheck2, Phone, Calendar, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuditLogs, getUsers, getReviewedApplicationsCount, getPersonnel, getDetailedOrders } from "@/lib/actions";
import type { AppUser, Personnel, AuditLog, DetailedFarmOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/user/change-password-dialog";
import { ChangeProfilePictureDialog } from "@/components/user/change-profile-picture-dialog";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const getRoleClass = (role: string) => {
    switch (role) {
        case "Administrator":
            return "animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent";
        case "Developer":
            return "animate-dev-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent";
        case "CEO":
            return "text-primary font-black";
        case "Manager":
            return "text-emerald-400 font-bold";
        default:
            return "";
    }
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const decodedUsername = decodeURIComponent(username);

  const [user, setUser] = useState<AppUser | null>(null);
  const [personnelRecord, setPersonnelRecord] = useState<Personnel | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [recentOrders, setRecentOrders] = useState<DetailedFarmOrder[]>([]);
  const [reviewedAppsCount, setReviewedAppsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const loggedInUserFromStorage = localStorage.getItem('loggedInUser');
      setLoggedInUser(loggedInUserFromStorage);

      try {
        const users = await getUsers();
        const foundUser = users.find(u => u.username === decodedUsername);
        
        if (!foundUser) {
          notFound();
          return;
        }
        
        setUser(foundUser);
        
        let pRecord = foundUser.personnel || null;
        if (!pRecord) {
            const allPersonnel = await getPersonnel();
            pRecord = allPersonnel.find(p => p.name === foundUser.username) || null;
        }
        
        setPersonnelRecord(pRecord as Personnel);

        const [logs, reviewedCount, allOrders] = await Promise.all([
            getAuditLogs({ username: decodedUsername }),
            getReviewedApplicationsCount(foundUser.id),
            getDetailedOrders(),
        ]);
        
        setActivityLogs(logs);
        setReviewedAppsCount(reviewedCount);
        setRecentOrders(allOrders.filter(o => o.completed_by === foundUser.username));

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
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </div>
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-96 w-full" />
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
  const userRoles = Array.isArray(user.roles) ? user.roles : [];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 p-6 bg-card/40 rounded-3xl border border-primary/10 shadow-2xl backdrop-blur-md">
          <Avatar className="h-32 w-32 text-2xl border-4 border-primary/20 shadow-xl">
            <AvatarImage src={user.avatarUrl} alt={user.username} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary"><User className="h-14 w-14"/></AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-primary">{user.username}</h1>
            <div className="flex items-center gap-3 mt-2">
                <p className="text-xl text-muted-foreground font-medium">{personnelRecord?.rank || 'Civilian'}</p>
                {personnelRecord?.department && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {personnelRecord.department}
                    </Badge>
                )}
            </div>
          </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/10 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Identity</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Username</span>
                        <span className="font-bold">{user.username}</span>
                    </div>
                     {personnelRecord?.discordUsername && (
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Discord</span>
                            <span className="font-bold text-blue-400">{personnelRecord.discordUsername}</span>
                        </div>
                    )}
                    <div className="flex flex-col items-start gap-3">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Permission Groups</span>
                         <div className="flex flex-wrap gap-2">
                             {userRoles.map(role => (
                                <Badge key={role} className={cn("font-bold text-xs uppercase tracking-tighter px-3", getRoleClass(role))}>{role}</Badge>
                             ))}
                         </div>
                    </div>
                </CardContent>
            </Card>

             <Card className="border-primary/10 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span>Security & Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">User Since</span>
                        <span className="font-medium">{user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Last Access</span>
                        <span className="font-medium text-primary">{lastLogin ? formatDistanceToNow(new Date(lastLogin.timestamp), {addSuffix: true}) : 'Never'}</span>
                    </div>
                </CardContent>
                {isOwnProfile && (
                    <CardContent className="border-t border-white/5 pt-4 mt-4 space-y-2">
                          <ChangeProfilePictureDialog user={user}>
                             <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10">
                                <ImageIcon className="h-4 w-4" /> Change Profile Picture
                            </Button>
                         </ChangeProfilePictureDialog>
                          <ChangePasswordDialog user={user}>
                            <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10">
                                <KeySquare className="h-4 w-4" /> Change Password
                            </Button>
                         </ChangePasswordDialog>
                    </CardContent>
                )}
            </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
             <Card className="border-primary/10 bg-card/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Briefcase className="h-5 w-5" />
                        <span>Employment & Roster Data</span>
                    </CardTitle>
                </CardHeader>
                {personnelRecord ? (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-white/5">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Star className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Current Position</p>
                            <p className="font-black text-lg">{personnelRecord.rank}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-white/5">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Phone className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact Number</p>
                            <p className="font-black text-lg">{personnelRecord.phoneNumber || 'Not Listed'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-white/5">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hire Date</p>
                            <p className="font-black text-lg">
                                {personnelRecord.hireDate ? format(new Date(personnelRecord.hireDate), 'MMMM dd, yyyy') : 'Unknown'}
                            </p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-white/5">
                        <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <FileCheck2 className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Leadership Reviews</p>
                            <p className="font-black text-lg">{reviewedAppsCount} Applications</p>
                        </div>
                    </div>
                </CardContent>
                ) : (
                <CardContent className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl mx-6 mb-6">
                    <User className="h-8 w-8 text-muted-foreground/20 mb-2" />
                    <p className="text-muted-foreground font-medium">This user is not an active staff member.</p>
                </CardContent>
                )}
            </Card>

            <Card className="border-primary/10 bg-card/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        <span>Recent Orders Completed</span>
                    </CardTitle>
                    <CardDescription>Latest contributions to the farm ledger.</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentOrders.length > 0 ? (
                        <div className="rounded-xl border border-white/5 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead>Business</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.slice(0, 5).map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-bold">{order.business_name}</TableCell>
                                            <TableCell className="text-emerald-500 font-bold">${Number(order.total_price).toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {format(new Date(order.created_at), 'MM/dd/yy')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
                            <p className="text-muted-foreground font-medium italic">No orders recorded yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-primary/10 bg-card/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <span>System Activity Log</span>
                    </CardTitle>
                    <CardDescription>Recent actions performed within the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64">
                        {activityLogs.length > 0 ? (
                            <ul className="space-y-4 pr-4">
                                {activityLogs.map(log => (
                                    <li key={log.id} className="flex items-start gap-4 p-3 bg-muted/10 rounded-xl border border-white/5">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Activity className="h-4 w-4 text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{log.actionType}</p>
                                            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{log.description}</p>
                                            <p className="text-[10px] text-muted-foreground/60 uppercase font-black mt-2">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p className="italic">No digital footprint found for this user.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}
