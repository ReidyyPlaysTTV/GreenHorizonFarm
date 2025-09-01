
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
    <Card className="bg-black text-white">
      <CardHeader>
        <CardTitle>Access Requests</CardTitle>
        <CardDescription className="text-gray-400">Review and approve or deny requests for application access.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-white">Username</TableHead>
              <TableHead className="text-white">Date Requested</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id} className="border-gray-800">
                  <TableCell className="font-medium">{request.requested_username}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'Pending' ? 'secondary' : 'default'} className="bg-gray-700 text-white">{request.status}</Badge>
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
                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
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
