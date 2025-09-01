

import { UserManagement } from "@/components/admin/user-management";
import { PermissionManagement } from "@/components/admin/permission-management";
import { DeveloperPanel } from "@/components/admin/developer-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUsers, getBugReports, getSuggestions, getAccessRequests, getSopLink, getApplicationStatus, getLoginBackgroundImage, getMaintenanceMode } from "@/lib/actions";
import { RefreshButton } from "@/components/layout/refresh-button";
import { AccessRequestManagement } from "@/components/admin/access-request-management";
import { SettingsManagement } from "@/components/admin/settings-management";
import { BannedUsersManagement } from "@/components/admin/banned-users-management";

export default async function AdminPage() {
  // Note: In a real application, you would protect this page to ensure
  // only users with an 'Admin' or 'Developer' role can access it.
  const [users, bugReports, suggestions, accessRequests, sopLink, applicationsOpen, loginBgImage, isMaintenanceMode] = await Promise.all([
      getUsers(),
      getBugReports(),
      getSuggestions(),
      getAccessRequests(),
      getSopLink(),
      getApplicationStatus(),
      getLoginBackgroundImage(),
      getMaintenanceMode(),
  ]);

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
           <UserManagement users={users} />
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
                currentSopLink={sopLink} 
                applicationsOpen={applicationsOpen}
                currentLoginBgImage={loginBgImage}
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
