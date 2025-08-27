
"use client";

import { useState } from "react";
import type { BugReport, Suggestion, ReportStatus } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateBugReportStatus, deleteBugReport, updateSuggestionStatus, deleteSuggestion } from "@/lib/actions";

type Report = BugReport | Suggestion;

interface ReportTableProps {
  reports: Report[];
  type: 'bug' | 'suggestion';
}

const statusOptions: ReportStatus[] = ["Pending", "In Progress", "Completed", "Rejected"];

const statusColors: Record<ReportStatus, "default" | "secondary" | "destructive"> = {
    Pending: "secondary",
    "In Progress": "default",
    Completed: "secondary",
    Rejected: "destructive"
};


export function ReportTable({ reports, type }: ReportTableProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const handleStatusChange = async (id: string, status: ReportStatus) => {
    setIsUpdating(prev => ({ ...prev, [id]: true }));
    try {
        const action = type === 'bug' ? updateBugReportStatus : updateSuggestionStatus;
        const result = await action(id, status);
        if (result.success) {
            toast({ title: "Status Updated", description: `Report status changed to ${status}.` });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the report status." });
    } finally {
        setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
     setIsUpdating(prev => ({ ...prev, [id]: true }));
     try {
        const action = type === 'bug' ? deleteBugReport : deleteSuggestion;
        const result = await action(id);
        if (result.success) {
            toast({ title: "Report Deleted" });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the report." });
    } finally {
       setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="w-[180px]">Status</TableHead>
          <TableHead className="text-right w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length > 0 ? (
          reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div className="font-medium">{report.title}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
              </TableCell>
              <TableCell>{formatDistanceToNow(new Date(report.submittedAt), { addSuffix: true })}</TableCell>
              <TableCell>
                <Select
                  defaultValue={report.status}
                  onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}
                  disabled={isUpdating[report.id]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                         <Badge variant={statusColors[report.status]} className="mr-2">{report.status}</Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        <Badge variant={statusColors[status]} className="mr-2">{status}</Badge>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isUpdating[report.id]}>
                      {isUpdating[report.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this {type} report. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(report.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
              No {type} reports found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
