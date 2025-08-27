

"use client";

import type { Application } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { updateApplicationStatus } from "@/lib/actions";
import { useState, useEffect } from "react";
import { ApproveApplicationDialog } from "./approve-application-dialog";

interface ApplicationReviewCardProps {
  application: Application;
}

export function ApplicationReviewCard({ application }: ApplicationReviewCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const handleStatusUpdate = async (status: 'Rejected') => {
    setIsUpdating(true);
    try {
      // We only handle rejection here now. Approval is via the dialog.
      await updateApplicationStatus(application.id, status, currentUser);
      toast({
        title: `Application ${status}`,
        description: `${application.name}'s application has been ${status.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Could not update the application status. Please try again.`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors = {
    Pending: "default",
    Approved: "secondary",
    Rejected: "destructive",
  } as const;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{application.name}</CardTitle>
                <CardDescription>Discord: {application.discordUsername || 'N/A'}</CardDescription>
            </div>
            <Badge variant={statusColors[application.status]}>{application.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
            <Label className="text-xs text-muted-foreground">Reason for Applying</Label>
            <p className="text-sm italic line-clamp-3">
            "{application.reasonForApplying}"
            </p>
        </div>
        
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                    <FileText className="h-4 w-4"/>
                    View Full Application
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Application for {application.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {Array.isArray(application.responses) && application.responses.map((res: any) => (
                        <div key={res.fieldId}>
                            <Label className="font-semibold">{res.label}</Label>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{res.answer || "No answer provided."}</p>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>

      </CardContent>
     
      <CardFooter className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground mt-4">
          Submitted {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
        </p>
        {application.status === "Pending" && (
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => handleStatusUpdate('Rejected')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4" /> Reject</>}
                </Button>
                <ApproveApplicationDialog application={application} currentUser={currentUser}>
                  <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" disabled={isUpdating}>
                      <Check className="h-4 w-4" /> Approve
                  </Button>
                </ApproveApplicationDialog>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
