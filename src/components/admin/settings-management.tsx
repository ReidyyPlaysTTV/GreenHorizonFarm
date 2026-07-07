
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { updateApplicationStatusSetting, updateMaintenanceMode } from "@/lib/actions";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

interface SettingsManagementProps {
    applicationsOpen: boolean;
    isMaintenanceMode: boolean;
}

export function SettingsManagement({ applicationsOpen, isMaintenanceMode }: SettingsManagementProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);
  
  const handleApplicationStatusChange = async (checked: boolean) => {
    setIsSaving(true);
     try {
        const result = await updateApplicationStatusSetting(checked, currentUser);
        if (result.success) {
            toast({
                title: "Success",
                description: `Applications are now ${checked ? 'OPEN' : 'CLOSED'}.`,
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update application status.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceModeChange = async (checked: boolean) => {
    setIsSaving(true);
    try {
        const result = await updateMaintenanceMode(checked, currentUser);
        if (result.success) {
            toast({
                title: "Success",
                description: `Maintenance mode is now ${checked ? 'ON' : 'OFF'}.`,
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update maintenance mode.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPermission('MANAGE_APP_SETTINGS')) {
    return (
       <Card className="bg-black text-white">
        <CardHeader>
            <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to manage application settings.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black text-white">
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription className="text-gray-400">
          Manage global settings for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4 max-w-lg">
            <h3 className="text-lg font-medium">Application Controls</h3>
            
            <div className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="applications-open">Open Applications</Label>
                     <p className="text-[0.8rem] text-gray-400">
                        Allow users to submit new applications.
                    </p>
                </div>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <Switch
                      id="applications-open"
                      checked={applicationsOpen}
                      onCheckedChange={handleApplicationStatusChange}
                      disabled={isSaving}
                  />
                )}
            </div>

             <div className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                     <p className="text-[0.8rem] text-gray-400">
                        Redirect all non-developer users to a maintenance page.
                    </p>
                </div>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <Switch
                      id="maintenance-mode"
                      defaultChecked={isMaintenanceMode}
                      onCheckedChange={handleMaintenanceModeChange}
                      disabled={isSaving}
                  />
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
