
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save } from "lucide-react";
import { roles, permissionsMap, permissionDescriptions } from "@/lib/data";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";


export function PermissionManagement() {
  const { hasPermission } = usePermissions();

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Permission Groups</CardTitle>
                <CardDescription>
                Define what each role can see and do within the application. Permissions are code-based and cannot be edited here.
                </CardDescription>
            </div>
             <Button disabled>
                <Save className="mr-2 h-4 w-4"/>
                Save Changes (Disabled)
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={roles}>
            {roles.map(role => (
                 <AccordionItem value={role} key={role}>
                    <AccordionTrigger className="text-lg font-medium">{role}</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            {Object.entries(permissionDescriptions).map(([permissionId, label]) => (
                                <div key={permissionId} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`${role}-${permissionId}`} 
                                        checked={permissionsMap[role as keyof typeof permissionsMap]?.includes(permissionId as any)}
                                        disabled
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
