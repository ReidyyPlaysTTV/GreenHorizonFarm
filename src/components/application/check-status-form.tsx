
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { getApplicationById } from "@/lib/actions";
import type { Application } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { format } from "date-fns";

const formSchema = z.object({
  applicationId: z.string().uuid("Please enter a valid Application ID."),
});

export function CheckStatusForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicationId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setApplication(null);

    const result = await getApplicationById(values.applicationId);
    if (result.success && result.application) {
        setApplication(result.application);
    } else {
        setError(result.message || "Could not find an application with that ID.");
    }
    setIsLoading(false);
  }

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="applicationId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Application ID</FormLabel>
                <FormControl>
                    <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="animate-spin" />
            ) : (
                <>
                <Search className="mr-2 h-4 w-4" /> Check Status
                </>
            )}
            </Button>
        </form>
        </Form>

        {error && (
            <Alert variant="destructive" className="mt-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {application && (
            <div className="mt-6 space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg">Application Found</h3>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Applicant</span>
                    <span className="font-medium">{application.name}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">{format(new Date(application.submittedAt), "MMMM d, yyyy")}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
                </div>
                {application.status === 'Rejected' && (
                     <Alert variant="destructive">
                        <AlertTitle>Update</AlertTitle>
                        <AlertDescription>Unfortunately, your application was not successful at this time. You are welcome to re-apply in the future.</AlertDescription>
                    </Alert>
                )}
                 {application.status === 'Approved' && (
                     <Alert>
                        <AlertTitle>Congratulations!</AlertTitle>
                        <AlertDescription>Your application has been approved. Please contact command staff on Discord to proceed with your onboarding.</AlertDescription>
                    </Alert>
                )}
            </div>
        )}
    </div>
  );
}

