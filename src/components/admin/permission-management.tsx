
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save, Loader2 } from "lucide-react";
import { roles, permissionDescriptions, permissions as allPermissions } from "@/lib/data";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Role, Permission } from "@/lib/types";
import { updateRolePermissions } from "@/lib/actions/permission-actions";
import { useToast } from "@/hooks/use-toast";

export function PermissionManagement() {
  const { hasPermission, permissionsMap: initialPermissionsMap } = usePermissions();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("System");
  const [editablePermissions, setEditablePermissions] = useState<Record<Role, Permission[]>>({} as Record<Role, Permission[]>);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
    if (initialPermissionsMap) {
      setEditablePermissions(JSON.parse(JSON.stringify(initialPermissionsMap)));
      setIsLoading(false);
    }
  }, [initialPermissionsMap]);
  
  const handlePermissionChange = (role: Role, permissionId: Permission, checked: boolean) => {
    if (role === 'Developer' || role === 'Administrator') return;
    setEditablePermissions(prev => {
      const currentPermissions = prev[role] || [];
      if (checked) {
        return { ...prev, [role]: [...currentPermissions, permissionId] };
      } else {
        return { ...prev, [role]: currentPermissions.filter(p => p !== permissionId) };
      }
    });
  };

  const handleToggleAll = (role: Role) => {
    if (role === 'Developer' || role === 'Administrator') return;
    const currentPermissions = editablePermissions[role] || [];
    const allPermissionIds = Object.keys(permissionDescriptions) as Permission[];
    const areAllSelected = allPermissionIds.every(p => currentPermissions.includes(p));

    setEditablePermissions(prev => ({
        ...prev,
        [role]: areAllSelected ? [] : allPermissionIds
    }));
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (!currentUser) throw new Error("User not authenticated");
      
      const permissionsToSave = { ...editablePermissions };
      // Ensure Admin/Dev roles always have all permissions on save
      const allPermissionIds = Object.keys(permissionDescriptions) as Permission[];
      permissionsToSave.Administrator = allPermissionIds;
      permissionsToSave.Developer = allPermissionIds;

      await updateRolePermissions(permissionsToSave, currentUser);

      toast({
        title: "Success",
        description: "Permissions updated successfully. Changes may require a refresh to take effect.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save permissions.",
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (!hasPermission('MANAGE_ROLES_PERMISSIONS')) {
    return (
       <Card className="bg-black text-white">
        <CardHeader>
            <CardTitle>Permission Groups</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to manage roles and permissions.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
       <Card className="bg-black text-white">
        <CardHeader>
            <CardTitle>Permission Groups</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Permission Groups</CardTitle>
                <CardDescription className="text-gray-400">
                Define what each role can see and do within the application.
                </CardDescription>
            </div>
             <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Save Changes
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={roles.map(r => r)}>
            {roles.map(role => {
                const currentRolePermissions = editablePermissions[role as Role] || [];
                const allPermissionIds = Object.keys(permissionDescriptions) as Permission[];
                const areAllSelected = allPermissionIds.every(p => currentRolePermissions.includes(p));

                return (
                 <AccordionItem value={role} key={role} className="border-gray-700">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline text-white">
                        <span className="flex-1 text-left">{role}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        {(role === 'Developer' || role === 'Administrator') && (
                             <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Full Permissions</AlertTitle>
                                <AlertDescription>
                                    The {role} role always has all permissions granted.
                                </AlertDescription>
                            </Alert>
                        )}
                        {(role !== 'Developer' && role !== 'Administrator') && (
                          <div className="mb-4 text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAll(role as Role)}
                            >
                                {areAllSelected ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded-lg">
                            {allPermissionIds.map((permissionId) => (
                                <div key={permissionId} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`${role}-${permissionId}`} 
                                        checked={currentRolePermissions.includes(permissionId as Permission) || false}
                                        onCheckedChange={(checked) => handlePermissionChange(role as Role, permissionId as Permission, !!checked)}
                                        disabled={role === 'Developer' || role === 'Administrator'}
                                    />
                                    <Label htmlFor={`${role}-${permissionId}`} className="font-normal text-sm text-gray-300">
                                        {permissionDescriptions[permissionId as Permission]}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )})}
        </Accordion>
      </CardContent>
    </Card>
  );
}
