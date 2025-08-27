
import { getBlacklistedPersonnel, getCallsignLogs, addBlacklistedPersonnel } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AddToBlacklistForm } from "@/components/command/add-to-blacklist-form";
import { RefreshButton } from "@/components/layout/refresh-button";

export default async function CommandPage() {
  const blacklistedPersonnel = await getBlacklistedPersonnel();
  const callsignLogs = await getCallsignLogs();

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">DOC Command Center</h1>
            <p className="text-muted-foreground">
            High-level management and security tools.
            </p>
        </div>
        <RefreshButton />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blacklist</CardTitle>
            <CardDescription>
              Individuals barred from DOC premises and activities.
            </CardDescription>
          </div>
          <AddToBlacklistForm />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Reason for Blacklist</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blacklistedPersonnel.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.reason}</TableCell>
                  <TableCell>{p.dateAdded}</TableCell>
                </TableRow>
              ))}
               {blacklistedPersonnel.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No one is currently blacklisted.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Callsign Logs</CardTitle>
            <CardDescription>Recent callsign assignment changes.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Callsign</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Personnel</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {callsignLogs.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No callsign logs found.
                            </TableCell>
                        </TableRow>
                    )}
                    {callsignLogs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell><Badge variant="secondary">#{log.callsign}</Badge></TableCell>
                            <TableCell>
                                <Badge variant={log.action === 'Assigned' ? 'default' : 'destructive'}>
                                    {log.action}
                                </Badge>
                            </TableCell>
                            <TableCell>{log.personnel_name}</TableCell>
                            <TableCell>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

    </div>
  );
}
