
"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuditLogs, getUsers } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Shield, User, FileText, UserPlus, UserMinus, ArrowUp, ArrowDown, UserX, Check, ChevronsUpDown } from "lucide-react";
import { RefreshButton } from "@/components/layout/refresh-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLog, AppUser } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const [fetchedLogs, fetchedUsers] = await Promise.all([
        getAuditLogs(),
        getUsers()
    ]);
    setLogs(fetchedLogs);
    const allUsernames = fetchedUsers.map(u => u.username);
    setUsers(['All Users', ...Array.from(new Set(allUsernames))]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = useMemo(() => {
    const allTypes = logs.map(log => log.actionType);
    return ['all', ...Array.from(new Set(allTypes))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const userMatch = userFilter === '' || userFilter === 'All Users' || log.user === userFilter;
      const actionMatch = actionFilter === 'all' || log.actionType === actionFilter;
      return userMatch && actionMatch;
    });
  }, [logs, userFilter, actionFilter]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
            A chronological record of all actions performed in the system.
            </p>
        </div>
        <RefreshButton onRefresh={fetchLogs} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>
                This log is for administrative review only.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-[200px] justify-between"
                  >
                    {userFilter ? users.find((u) => u === userFilter) : "Filter by user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search user..." />
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user}
                          value={user}
                          onSelect={(currentValue) => {
                            const filterValue = currentValue === userFilter.toLowerCase() ? '' : user;
                            setUserFilter(filterValue === 'all users' ? '' : filterValue);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              userFilter === user ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by action..." />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Actions' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading ? (
                 <div className="space-y-4">
                    {Array.from({length: 10}).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-32 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                            <Skeleton className="h-10 flex-1 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                        </div>
                    ))}
                 </div>
            ) : (
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
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
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
                            No audit logs found matching your criteria.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
