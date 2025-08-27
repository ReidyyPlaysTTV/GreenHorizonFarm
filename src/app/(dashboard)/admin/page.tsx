import { UserManagement } from "@/components/admin/user-management";
import { PermissionManagement } from "@/components/admin/permission-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPersonnel } from "@/lib/actions";

export default async function AdminPage() {
  // Note: In a real application, you would protect this page to ensure
  // only users with an 'Admin' or 'Developer' role can access it.
  const personnel = await getPersonnel();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and application-wide settings.
        </p>
      </div>

       <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permission Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
           <UserManagement personnel={personnel} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-6">
            <PermissionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
