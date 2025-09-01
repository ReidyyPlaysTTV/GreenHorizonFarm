

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { updateSopLink, updateApplicationStatusSetting, updateLoginBackgroundImage, updateMaintenanceMode } from "@/lib/actions";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

const sopFormSchema = z.object({
  sopLink: z.string().url("Please enter a valid URL."),
});

const bgImageFormSchema = z.object({
    bgImageUrl: z.string().url("Please enter a valid URL.").refine(
        (url) => /^https:\/\/i\.imgur\.com\//.test(url) || /^https:\/\/r2\.fivemanage\.com\//.test(url),
        "URL must be from i.imgur.com or r2.fivemanage.com"
    ),
});

interface SettingsManagementProps {
    currentSopLink: string | null;
    applicationsOpen: boolean;
    currentLoginBgImage: string;
    isMaintenanceMode: boolean;
}

export function SettingsManagement({ currentSopLink, applicationsOpen, currentLoginBgImage, isMaintenanceMode }: SettingsManagementProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const sopForm = useForm<z.infer<typeof sopFormSchema>>({
    resolver: zodResolver(sopFormSchema),
    defaultValues: {
      sopLink: currentSopLink || "",
    },
  });

  const bgImageForm = useForm<z.infer<typeof bgImageFormSchema>>({
    resolver: zodResolver(bgImageFormSchema),
    defaultValues: {
        bgImageUrl: currentLoginBgImage || "",
    }
  });

  const onSopSubmit = async (data: z.infer<typeof sopFormSchema>) => {
    setIsSaving(true);
    try {
        const result = await updateSopLink(data.sopLink, currentUser);
        if (result.success) {
            toast({
                title: "Success",
                description: "SOP link updated successfully.",
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update SOP link.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onBgImageSubmit = async (data: z.infer<typeof bgImageFormSchema>) => {
    setIsSaving(true);
    try {
        const result = await updateLoginBackgroundImage(data.bgImageUrl, currentUser);
        if (result.success) {
            toast({
                title: "Success",
                description: "Login background image updated.",
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update background image.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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
        <Form {...sopForm}>
            <form onSubmit={sopForm.handleSubmit(onSopSubmit)} className="space-y-6 max-w-lg">
                <FormField
                    control={sopForm.control}
                    name="sopLink"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SOP Google Slides Embed URL</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="https://docs.google.com/presentation/d/.../embed" 
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save SOP Link
                </Button>
            </form>
        </Form>

        <Separator className="bg-gray-700"/>

        <Form {...bgImageForm}>
            <form onSubmit={bgImageForm.handleSubmit(onBgImageSubmit)} className="space-y-6 max-w-lg">
                <FormField
                    control={bgImageForm.control}
                    name="bgImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Login Background Image URL</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="https://i.imgur.com/..." 
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-400">
                                Must be a direct link from i.imgur.com or r2.fivemanage.com.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save Background Image
                </Button>
            </form>
        </Form>

        <Separator className="bg-gray-700"/>

        <div className="space-y-4 max-w-lg">
            <h3 className="text-lg font-medium">Application Controls</h3>
            <div className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="applications-open">Open Applications</Label>
                     <p className="text-[0.8rem] text-gray-400">
                        Allow users to submit new applications.
                    </p>
                </div>
                <Switch
                    id="applications-open"
                    checked={applicationsOpen}
                    onCheckedChange={handleApplicationStatusChange}
                    disabled={isSaving}
                />
            </div>
             <div className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                     <p className="text-[0.8rem] text-gray-400">
                        Redirect all non-developer users to a maintenance page.
                    </p>
                </div>
                <Switch
                    id="maintenance-mode"
                    defaultChecked={isMaintenanceMode}
                    onCheckedChange={handleMaintenanceModeChange}
                    disabled={isSaving}
                />
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
