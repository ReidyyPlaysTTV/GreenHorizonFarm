
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

// In a real app, these would be fetched from the database.
const roles = ["Developer", "Administrator", "Commissioners Office", "High Command", "Command", "NCOs", "User"];
const permissions = [
  { id: "view_roster", label: "View Roster" },
  { id: "manage_personnel", label: "Manage Personnel (Promote, Demote, Fire)" },
  { id: "manage_applications", label: "Manage Applications" },
  { id: "edit_application_form", label: "Edit Application Form" },
  { id: "view_archive", label: "View Fired/Resigned Archive" },
  { id: "manage_blacklist", label: "Manage DOC Blacklist" },
  { id: "access_admin_panel", label: "Access Admin Panel" },
  { id: "manage_roles_permissions", label: "Manage Roles & Permissions" },
];


export function PermissionManagement() {
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
             <Button>
                <Save className="mr-2 h-4 w-4"/>
                Save Changes
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
            {roles.map(role => (
                 <AccordionItem value={role} key={role}>
                    <AccordionTrigger className="text-lg font-medium">{role}</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            {permissions.map(permission => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                    <Checkbox id={`${role}-${permission.id}`} />
                                    <Label htmlFor={`${role}-${permission.id}`} className="font-normal">
                                        {permission.label}
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
