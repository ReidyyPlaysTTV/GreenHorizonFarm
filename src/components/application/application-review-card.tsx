
"use client";

import type { Application } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Loader2, ClipboardCopy, Minus, User, Undo2, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { updateApplicationStatus, deleteApplication } from "@/lib/actions";
import { useState, useEffect } from "react";
import { ApproveApplicationDialog } from "./approve-application-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDesc, AlertDialogTrigger, AlertDialogFooter } from "../ui/alert-dialog";


interface ApplicationReviewCardProps {
  application: Application;
}

export function ApplicationReviewCard({ application }: ApplicationReviewCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();
  const canManageApplications = hasPermission('MANAGE_APPLICATIONS');
  const canDeleteApplications = hasPermission('DELETE_APPLICATIONS');
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const handleStatusUpdate = async (status: 'Rejected' | 'Under Review' | 'Pending') => {
    setIsUpdating(true);
    let comment: string | undefined;

    if (status === 'Rejected') {
        comment = rejectionReason || "Unfortunately, your application was not successful at this time. We appreciate your interest in Green Horizon.";
    } else if (status === 'Under Review') {
        comment = `Your application is currently being reviewed by ${currentUser}. We will update you shortly.`
    } else if (status === 'Pending') {
        comment = "Your application has been returned to the queue."
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        const result = await deleteApplication(application.id, currentUser);
        if (result.success) {
            toast({
                title: "Application Deleted",
                description: `The application for ${application.name} has been permanently deleted.`
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the application."
        });
    } finally {
        setIsDeleting(false);
    }
  }

  const statusColors: Record<Application['status'], "default" | "secondary" | "destructive"> = {
    Pending: "default",
    'Under Review': "secondary",
    Approved: "secondary",
    Rejected: "destructive",
  };
  
  const statusVariant = statusColors[application.status] || 'default';


  return (
    <Card className="flex flex-col border-primary/10 bg-card/60 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <CardTitle className="text-xl font-black text-primary">{application.name}</CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">REF: {application.id}</Badge>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5"
                        onClick={() => {
                            navigator.clipboard.writeText(application.id);
                            toast({ title: "Reference ID Copied!" });
                        }}
                    >
                        <ClipboardCopy className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <Badge variant={statusVariant} className="uppercase text-[10px] font-black">{application.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 p-2 rounded-lg text-center">
                <Label className="text-[10px] uppercase text-muted-foreground">State ID</Label>
                <p className="text-xs font-bold">{application.stateId || 'N/A'}</p>
            </div>
             <div className="bg-muted/30 p-2 rounded-lg text-center">
                <Label className="text-[10px] uppercase text-muted-foreground">Phone</Label>
                <p className="text-xs font-bold">{application.phoneNumber || 'N/A'}</p>
            </div>
        </div>

        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2 border-primary/20 hover:bg-primary/10">
                    <FileText className="h-4 w-4"/>
                    Read Full Application
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-primary">Application: {application.name}</DialogTitle>
                    <DialogDescription>Submitted {format(application.submittedAt, 'PPP p')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {Array.isArray(application.responses) && application.responses.map((res: any, idx: number) => (
                        <div key={idx} className="space-y-1 bg-muted/20 p-4 rounded-xl border border-white/5">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest">{res.label}</Label>
                            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{res.answer || "No response."}</p>
                        </div>
                    ))}
                </div>
                 <DialogFooter className="flex justify-between items-center border-t border-white/5 pt-4">
                    {canDeleteApplications && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Record
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Permanent Deletion?</AlertDialogTitle>
                                    <AlertDialogDesc>
                                        This will remove all records for <span className="font-bold">{application.name}</span>. This action cannot be reversed.
                                    </AlertDialogDesc>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                                        Delete Forever
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button variant="secondary" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </CardContent>
     
      <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-4">
        <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
                {application.reviewer ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 ring-2 ring-primary/20">
                            <AvatarImage src={application.reviewer.avatarUrl} alt={application.reviewer.username} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{application.reviewer.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-[10px] font-medium leading-none">
                            Reviewed by <span className="text-primary font-black uppercase">{application.reviewer.username}</span>
                            <p className="text-muted-foreground mt-1">{formatDistanceToNow(new Date(application.reviewedAt!), { addSuffix: true })}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Pending for {formatDistanceToNow(application.submittedAt)}</span>
                    </div>
                )}
            </div>
            
            {canManageApplications && (
                <div className="flex gap-2">
                    {application.status === 'Pending' && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold h-8 px-3 rounded-full" disabled={isUpdating} onClick={() => handleStatusUpdate('Under Review')}>
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin"/> : "Mark In Review"}
                        </Button>
                    )}

                    {application.status === 'Under Review' && (
                        <>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" disabled={isUpdating} onClick={() => handleStatusUpdate('Pending')}>
                                            <Undo2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Send to Queue</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Dialog open={isRejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg shadow-destructive/20" disabled={isUpdating}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Application: {application.name}</DialogTitle>
                                        <DialogDescription>
                                            Provide a detailed reason for the applicant. This will be shown when they track their status.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Textarea 
                                        placeholder="Reason for denial (e.g., Lack of experience, insufficient availability)..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="min-h-[120px]"
                                    />
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isUpdating || !rejectionReason}>
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Deny'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <ApproveApplicationDialog application={application} currentUser={currentUser}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-black h-8 px-4 rounded-full shadow-lg shadow-emerald-500/20" disabled={isUpdating}>
                                    Approve App
                                </Button>
                            </ApproveApplicationDialog>
                        </>
                    )}
                </div>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
