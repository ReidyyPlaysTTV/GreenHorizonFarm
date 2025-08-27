
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
  const { hasPermission, permissionsMap: initialPermissionsMap, userRole } = usePermissions();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editablePermissions, setEditablePermissions] = useState<Record<Role, Permission[]>>({} as Record<Role, Permission[]>);

  useEffect(() => {
    if (initialPermissionsMap) {
      setEditablePermissions(JSON.parse(JSON.stringify(initialPermissionsMap)));
      setIsLoading(false);
    }
  }, [initialPermissionsMap]);
  
  const handlePermissionChange = (role: Role, permissionId: Permission, checked: boolean) => {
    setEditablePermissions(prev => {
      const currentPermissions = prev[role] || [];
      if (checked) {
        return { ...prev, [role]: [...currentPermissions, permissionId] };
      } else {
        return { ...prev, [role]: currentPermissions.filter(p => p !== permissionId) };
      }
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (!userRole) throw new Error("User not authenticated");
      await updateRolePermissions(editablePermissions, userRole);
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
       <Card>
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
       <Card>
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Permission Groups</CardTitle>
                <CardDescription>
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
            {roles.filter(r => r !== 'Developer' && r !== 'Administrator').map(role => (
                 <AccordionItem value={role} key={role}>
                    <AccordionTrigger className="text-lg font-medium">{role}</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            {Object.entries(permissionDescriptions).map(([permissionId, label]) => (
                                <div key={permissionId} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`${role}-${permissionId}`} 
                                        checked={editablePermissions[role]?.includes(permissionId as Permission) || false}
                                        onCheckedChange={(checked) => handlePermissionChange(role, permissionId as Permission, !!checked)}
                                    />
                                    <Label htmlFor={`${role}-${permissionId}`} className="font-normal">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
