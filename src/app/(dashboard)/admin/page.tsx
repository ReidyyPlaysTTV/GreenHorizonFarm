
import { UserManagement } from "@/components/admin/user-management";
import { PermissionManagement } from "@/components/admin/permission-management";
import { DeveloperPanel } from "@/components/admin/developer-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUsers, getBugReports, getSuggestions, getAccessRequests } from "@/lib/actions";
import { RefreshButton } from "@/components/layout/refresh-button";
import { AccessRequestManagement } from "@/components/admin/access-request-management";

export default async function AdminPage() {
  // Note: In a real application, you would protect this page to ensure
  // only users with an 'Admin' or 'Developer' role can access it.
  const users = await getUsers();
  const bugReports = await getBugReports();
  const suggestions = await getSuggestions();
  const accessRequests = await getAccessRequests();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and application-wide settings.
          </p>
        </div>
        <RefreshButton />
      </div>

       <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="access_requests">Access Requests</TabsTrigger>
          <TabsTrigger value="permissions">Permission Groups</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
           <UserManagement users={users} />
        </TabsContent>
         <TabsContent value="access_requests" className="mt-6">
            <AccessRequestManagement requests={accessRequests} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-6">
            <PermissionManagement />
        </TabsContent>
        <TabsContent value="developer" className="mt-6">
            <DeveloperPanel bugReports={bugReports} suggestions={suggestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
