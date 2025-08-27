
import { getAuditLogs } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Shield, User, FileText, UserPlus, UserMinus, ArrowUp, ArrowDown, UserX } from "lucide-react";
import { RefreshButton } from "@/components/layout/refresh-button";

const actionTypeIcons: Record<string, React.ReactNode> = {
    "Login": <User className="h-4 w-4" />,
    "Add Personnel": <UserPlus className="h-4 w-4 text-green-500" />,
    "Update Personnel": <User className="h-4 w-4 text-blue-500" />,
    "Promote Personnel": <ArrowUp className="h-4 w-4 text-blue-500" />,
    "Demote Personnel": <ArrowDown className="h-4 w-4 text-orange-500" />,
    "Fire Personnel": <UserMinus className="h-4 w-4 text-red-500" />,
    "Update Application Status": <FileText className="h-4 w-4" />,
    "Add to Blacklist": <UserX className="h-4 w-4 text-destructive" />,
    "Update Form": <FileText className="h-4 w-4" />,
    "Assign Role": <Shield className="h-4 w-4" />,
};

export default async function AuditLogPage() {
  const logs = await getAuditLogs();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
            A chronological record of all actions performed in the system.
            </p>
        </div>
        <RefreshButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>
            This log is for administrative review only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1.5 pl-1.5">
                        {actionTypeIcons[log.actionType] || <User className="h-4 w-4" />}
                        {log.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
