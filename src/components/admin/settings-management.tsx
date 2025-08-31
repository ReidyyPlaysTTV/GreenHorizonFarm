
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { updateSopLink, updateApplicationStatusSetting } from "@/lib/actions";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

interface SettingsManagementProps {
    currentSopLink: string | null;
    applicationsOpen: boolean;
}

export function SettingsManagement({ currentSopLink, applicationsOpen }: SettingsManagementProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const form = useForm<z.infer<typeof sopFormSchema>>({
    resolver: zodResolver(sopFormSchema),
    defaultValues: {
      sopLink: currentSopLink || "",
    },
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


  if (!hasPermission('MANAGE_APP_SETTINGS')) {
    return (
       <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>
          Manage global settings for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSopSubmit)} className="space-y-6 max-w-lg">
                <FormField
                    control={form.control}
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

        <Separator />

        <div className="space-y-4 max-w-lg">
            <h3 className="text-lg font-medium">Application Controls</h3>
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="applications-open">Open Applications</Label>
                     <p className="text-[0.8rem] text-muted-foreground">
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
        </div>

      </CardContent>
    </Card>
  );
}
