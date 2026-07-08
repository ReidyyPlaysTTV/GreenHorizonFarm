
"use client";

import { useState, useEffect } from 'react';
import { UserManagement } from "@/components/admin/user-management";
import { PermissionManagement } from "@/components/admin/permission-management";
import { DeveloperPanel } from "@/components/admin/developer-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUsers, getBugReports, getSuggestions, getAccessRequests, getApplicationStatus, getMaintenanceMode } from "@/lib/actions";
import { RefreshButton } from "@/components/layout/refresh-button";
import { AccessRequestManagement } from "@/components/admin/access-request-management";
import { SettingsManagement } from "@/components/admin/settings-management";
import { BannedUsersManagement } from "@/components/admin/banned-users-management";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import type { AppUser, BugReport, Suggestion, AccessRequest } from '@/lib/types';

export default function AdminPage() {
  const { hasPermission, userRoles } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
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

  useEffect(() => {
    // Safety timeout to prevent neverending load if DB hangs
    const timeoutTimer = setTimeout(() => {
        if (isLoading) {
            setIsLoading(false);
            setIsTimedOut(true);
        }
    }, 7000);

    // Wait until the user's roles have been determined.
    if (userRoles === null) {
      return;
    }

    const canAccess = hasPermission('ACCESS_ADMIN_PANEL');
    if (!canAccess) {
      setIsLoading(false);
      clearTimeout(timeoutTimer);
      return;
    }

    const fetchData = async () => {
      try {
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
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => clearTimeout(timeoutTimer);
  }, [userRoles, hasPermission]);
  
  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-20">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse opacity-50">Authorized Access Required...</p>
            </div>
        </div>
    );
  }

  if (isTimedOut && !data) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Alert variant="destructive" className="bg-black/60 border-destructive/20 backdrop-blur-md">
                <Clock className="h-4 w-4" />
                <AlertTitle>Connection Refused</AlertTitle>
                <AlertDescription>
                   The database is taking too long to respond. This usually happens during high network lag or server maintenance.
                   <br />
                   <Button variant="outline" className="mt-4 border-destructive/20" onClick={() => window.location.reload()}>
                        Retry Connection
                   </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

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
  
  if (!data) {
    return (
       <div className="container mx-auto p-4 md:p-8">
         <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Failed to load administrative data. Please try refreshing the page.
            </AlertDescription>
        </Alert>
       </div>
    );
  }

  const { users, bugReports, suggestions, accessRequests, applicationsOpen, isMaintenanceMode } = data;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-destructive text-destructive-foreground rounded-lg my-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-destructive-foreground/80">
            Manage users, roles, and application-wide settings.
          </p>
        </div>
        <RefreshButton />
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
        <TabsContent value="users" className="mt-6">
           <UserManagement users={users} currentUser={currentUser || ''} />
        </TabsContent>
        <TabsContent value="banned" className="mt-6">
            <BannedUsersManagement users={users} />
        </TabsContent>
         <TabsContent value="access_requests" className="mt-6">
            <AccessRequestManagement requests={accessRequests} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-6">
            <PermissionManagement />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
            <SettingsManagement 
                applicationsOpen={applicationsOpen}
                isMaintenanceMode={isMaintenanceMode}
            />
        </TabsContent>
        <TabsContent value="developer" className="mt-6">
            <DeveloperPanel bugReports={bugReports} suggestions={suggestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
