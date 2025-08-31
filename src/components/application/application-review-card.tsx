
"use client";

import type { Application } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Loader2, ClipboardCopy, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { updateApplicationStatus } from "@/lib/actions";
import { useState, useEffect } from "react";
import { ApproveApplicationDialog } from "./approve-application-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


interface ApplicationReviewCardProps {
  application: Application;
}

export function ApplicationReviewCard({ application }: ApplicationReviewCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();
  const canManageApplications = hasPermission('MANAGE_APPLICATIONS');
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const handleStatusUpdate = async (status: 'Rejected' | 'Under Review') => {
    setIsUpdating(true);
    let comment: string | undefined;

    if (status === 'Rejected') {
        comment = rejectionReason || "Unfortunately, your application was not successful at this time. You are welcome to re-apply in the future.";
    } else if (status === 'Under Review') {
        comment = "Your application is currently under review by our command team."
    }

    try {
      await updateApplicationStatus({
        applicationId: application.id, 
        status, 
        comment,
        user: currentUser
      });
      toast({
        title: `Application ${status}`,
        description: `${application.name}'s application has been updated.`,
      });
      setRejectDialogOpen(false);
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

  const statusColors: Record<Application['status'], "default" | "secondary" | "destructive"> = {
    Pending: "default",
    'Under Review': "secondary",
    Approved: "secondary",
    Rejected: "destructive",
  };
  
  const statusVariant = statusColors[application.status] || 'default';


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{application.name}</CardTitle>
                <CardDescription>Discord: {application.discordUsername || 'N/A'}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">ID: {application.id}</Badge>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => {
                            navigator.clipboard.writeText(application.id);
                            toast({ title: "Copied ID to clipboard!" });
                        }}
                    >
                        <ClipboardCopy className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <Badge variant={statusVariant}>{application.status}</Badge>
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
        {application.status === "Pending" && canManageApplications && (
            <TooltipProvider>
                <div className="flex justify-end gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" className="bg-orange-600 hover:bg-orange-700 rounded-full" disabled={isUpdating} onClick={() => handleStatusUpdate('Under Review')}>
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Minus className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Mark as Under Review</p>
                        </TooltipContent>
                    </Tooltip>

                    <Dialog open={isRejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="destructive" className="rounded-full" disabled={isUpdating}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reject Application</p>
                            </TooltipContent>
                        </Tooltip>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject Application for {application.name}</DialogTitle>
                                <DialogDescription>
                                    Provide a reason for the denial. This will be visible to the applicant. If left blank, a default message will be used.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea 
                                placeholder="Reason for denial..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Tooltip>
                        <TooltipTrigger asChild>
                             <ApproveApplicationDialog application={application} currentUser={currentUser}>
                               <Button size="icon" className="bg-green-600 hover:bg-green-700 rounded-full" disabled={isUpdating}>
                                   <Check className="h-4 w-4" />
                               </Button>
                             </ApproveApplicationDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Approve Application</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
