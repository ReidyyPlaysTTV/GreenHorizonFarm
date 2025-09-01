
"use client";

import type { AccessRequest } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { denyAccessRequest } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { ApproveRequestDialog } from "./approve-request-dialog";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface AccessRequestManagementProps {
    requests: AccessRequest[];
}

export function AccessRequestManagement({ requests }: AccessRequestManagementProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();
  const canManageRequests = hasPermission('MANAGE_ACCESS_REQUESTS');


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const handleDeny = async (id: string, username: string) => {
    setIsProcessing(prev => ({ ...prev, [id]: true }));
    try {
        const result = await denyAccessRequest(id, username, currentUser);
        if (result.success) {
            toast({ title: "Request Denied", description: `Access request for '${username}' has been denied.` });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Action Failed", description: "Could not deny the access request." });
    } finally {
        setIsProcessing(prev => ({ ...prev, [id]: false }));
    }
  }
  
  return (
    <Card className="bg-destructive-foreground/5 border-destructive-foreground/20">
      <CardHeader>
        <CardTitle>Access Requests</CardTitle>
        <CardDescription className="text-destructive-foreground/60">Review and approve or deny requests for application access.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-destructive-foreground/20">
              <TableHead>Username</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id} className="border-destructive-foreground/20">
                  <TableCell className="font-medium">{request.requested_username}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'Pending' ? 'secondary' : 'default'} className="bg-destructive-foreground/10 text-destructive-foreground">{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {request.status === 'Pending' && canManageRequests && (
                        isProcessing[request.id] ? <Loader2 className="h-4 w-4 animate-spin inline-block" /> :
                        <>
                            <Button variant="destructive" size="sm" onClick={() => handleDeny(request.id, request.requested_username)}>Deny</Button>
                            <ApproveRequestDialog request={request} />
                        </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No pending access requests.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
