"use client";

import type { Application } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApplicationReviewCardProps {
  application: Application;
}

export function ApplicationReviewCard({ application }: ApplicationReviewCardProps) {
  const { toast } = useToast();

  const handleApprove = () => {
    toast({
      title: "Application Approved",
      description: `${application.name}'s application has been approved.`,
    });
    // Here you would update the application status in your database.
  };

  const handleReject = () => {
    toast({
      title: "Application Rejected",
      variant: "destructive",
      description: `${application.name}'s application has been rejected.`,
    });
     // Here you would update the application status in your database.
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
                <CardDescription>Age: {application.age}</CardDescription>
            </div>
            <Badge variant={statusColors[application.status]}>{application.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground italic">
          "{application.reasonForApplying}"
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Submitted {formatDistanceToNow(application.submittedAt, { addSuffix: true })}
        </p>
      </CardContent>
      {application.status === "Pending" && (
        <CardFooter className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={handleReject}>
            <X className="h-4 w-4" /> Reject
          </Button>
          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={handleApprove}>
            <Check className="h-4 w-4" /> Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
