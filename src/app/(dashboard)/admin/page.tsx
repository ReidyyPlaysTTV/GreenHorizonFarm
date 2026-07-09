
"use client";

import { useState, useEffect } from 'react';
import { UserManagement } from "@/components/admin/user-management";
import { PermissionManagement } from "@/components/admin/permission-management";
import { DeveloperPanel } from "@/components/admin/developer-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUsers, getBugReports, getSuggestions, getAccessRequests, getApplicationStatus, getMaintenanceMode, testDatabaseConnection } from "@/lib/actions";
import { RefreshButton } from "@/components/layout/refresh-button";
import { AccessRequestManagement } from "@/components/admin/access-request-management";
import { SettingsManagement } from "@/components/admin/settings-management";
import { BannedUsersManagement } from "@/components/admin/banned-users-management";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, Clock, Database, ServerCrash } from "lucide-react";
import Link from "next/link";
import type { AppUser, BugReport, Suggestion, AccessRequest } from '@/lib/types';

export default function AdminPage() {
  const { hasPermission, userRoles } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [data, setData] = useState<{
    users: AppUser[];
    bugReports: BugReport[];
    suggestions: Suggestion[];
    accessRequests: AccessRequest[];
    applicationsOpen: boolean;
    isMaintenanceMode: boolean;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUser(localStorage.getItem('loggedInUser'));
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setIsTimedOut(false);
    setDbError(null);
    
    const timeoutTimer = setTimeout(() => {
        if (isLoading) {
            setIsTimedOut(true);
        }
    }, 8000);

    try {
        // Run a quick ping first
        const ping = await testDatabaseConnection();
        if (!ping.success) {
            setDbError(ping.message);
            setIsLoading(false);
            clearTimeout(timeoutTimer);
            return;
        }

        const fetchPromise = Promise.all([
          getUsers(),
          getBugReports(),
          getSuggestions(),
          getAccessRequests(),
          getApplicationStatus(),
          getMaintenanceMode(),
        ]);

        const [users, bugReports, suggestions, accessRequests, applicationsOpen, isMaintenanceMode] = await fetchPromise;
        
        setData({ users, bugReports, suggestions, accessRequests, applicationsOpen, isMaintenanceMode });
        clearTimeout(timeoutTimer);
    } catch (error: any) {
        console.error("Failed to load admin data:", error);
        setDbError(error.message || "A fatal database connection error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRoles === null) return;

    const canAccess = hasPermission('ACCESS_ADMIN_PANEL');
    if (!canAccess) {
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [userRoles, hasPermission]);
  
  if (!hasPermission('ACCESS_ADMIN_PANEL')) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                   You do not have the required permissions to view this page. Please contact an administrator if you believe this is an error.
                   <br />
                   <Link href="/dashboard" className="mt-2 inline-block font-bold underline">
                        Return to Dashboard
                   </Link>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 bg-destructive text-destructive-foreground rounded-lg my-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-destructive-foreground/80">
            Manage users, roles, and application-wide settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin opacity-50" />}
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

       <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-destructive-foreground/20 text-destructive-foreground">
          <TabsTrigger value="users" className="data-[state=active]:bg-destructive-foreground data-[state=active]:text-destructive">Users & Roles</TabsTrigger>
          <TabsTrigger value="banned" className="data-[state=active]:bg-destructive-foreground data-[state=active]:text-destructive">Banned Users</TabsTrigger>
          <TabsTrigger value="access_requests" className="data-[state=active]:bg-destructive-foreground data-[state=active]:text-destructive">Access Requests</TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-destructive-foreground data-[state=active]:text-destructive">Permission Groups</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-destructive-foreground data-[state=active]:text-destructive">App Settings</TabsTrigger>
          <TabsTrigger value="developer" className="data-[state=active]:bg-destructive-foreground data-[state=active]:text-destructive">Developer</TabsTrigger>
        </TabsList>

        <div className="mt-6">
            {dbError && (
                 <Alert variant="destructive" className="mb-6 bg-black border-red-500 text-red-500 shadow-2xl animate-pulse">
                    <ServerCrash className="h-6 w-6" />
                    <AlertTitle className="text-lg font-black uppercase tracking-tighter">Database Access Restricted</AlertTitle>
                    <AlertDescription className="mt-2 font-medium">
                        {dbError}
                        <div className="mt-4 pt-4 border-t border-red-500/20">
                            <p className="text-xs uppercase font-black text-white/60">Helpful Tip:</p>
                            <p className="text-sm text-white/90">Go to your **ZAP-Hosting Database Panel**, find **'Remote MySQL'** or **'External Access'**, and ensure the IP shown above is whitelisted or set to `%` for global access.</p>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4 h-8 bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={fetchData}>Retry Handshake</Button>
                    </AlertDescription>
                </Alert>
            )}

            {isTimedOut && !data && !dbError && (
                <Alert variant="destructive" className="mb-6 bg-black/40 border-white/10 text-white">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <AlertTitle>Data Link Latency</AlertTitle>
                    <AlertDescription>
                        The server is taking longer than usual to respond. Main tables may be empty, but you can still run diagnostics in the **Developer** tab.
                        <Button variant="outline" size="sm" className="ml-4 h-7 text-[10px]" onClick={fetchData}>Retry Sync</Button>
                    </AlertDescription>
                </Alert>
            )}

            <TabsContent value="users">
                {data ? <UserManagement users={data.users} currentUser={currentUser || ''} /> : (dbError ? <div className="text-center py-20 opacity-40 italic">Waiting for connection...</div> : <LoadingPlaceholder />)}
            </TabsContent>
            <TabsContent value="banned">
                {data ? <BannedUsersManagement users={data.users} /> : (dbError ? <div className="text-center py-20 opacity-40 italic">Waiting for connection...</div> : <LoadingPlaceholder />)}
            </TabsContent>
            <TabsContent value="access_requests">
                {data ? <AccessRequestManagement requests={data.accessRequests} /> : (dbError ? <div className="text-center py-20 opacity-40 italic">Waiting for connection...</div> : <LoadingPlaceholder />)}
            </TabsContent>
            <TabsContent value="permissions">
                <PermissionManagement />
            </TabsContent>
            <TabsContent value="settings">
                {data ? (
                    <SettingsManagement 
                        applicationsOpen={data.applicationsOpen}
                        isMaintenanceMode={data.isMaintenanceMode}
                    />
                ) : (dbError ? <div className="text-center py-20 opacity-40 italic">Waiting for connection...</div> : <LoadingPlaceholder />)}
            </TabsContent>
            <TabsContent value="developer">
                <DeveloperPanel 
                    bugReports={data?.bugReports || []} 
                    suggestions={data?.suggestions || []} 
                />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function LoadingPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-xl border border-dashed border-white/10">
            <Loader2 className="h-8 w-8 animate-spin text-white opacity-20" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/40">Synchronizing Data Node...</p>
        </div>
    )
}
