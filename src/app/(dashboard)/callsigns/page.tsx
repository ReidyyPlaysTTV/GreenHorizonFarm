
"use client";

import { useState, useMemo, useEffect } from "react";
import { getPersonnel, getCallsignLogs } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { CallsignLog } from "@/lib/types";

const usePersonnelData = () => {
    const [personnel, setPersonnel] = useState<Awaited<ReturnType<typeof getPersonnel>>>([]);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<CallsignLog[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const personnelData = await getPersonnel();
            const logsData = await getCallsignLogs();
            setPersonnel(personnelData);
            setLogs(logsData);
            setLoading(false);
        };
        fetchData();
    }, []);

    return { personnel, logs, loading };
}

export default function CallsignsPage() {
  const { personnel, logs, loading } = usePersonnelData();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 500;

  const usedCallsigns = useMemo(() => {
    return personnel.reduce((acc, p) => {
      acc[p.badgeNumber] = p.name;
      return acc;
    }, {} as Record<string, string>);
  }, [personnel]);


  const callsignStart = 1000;
  const callsignEnd = 9999;
  const allCallsigns = Array.from({ length: callsignEnd - callsignStart + 1 }, (_, i) => (callsignStart + i).toString());

  const filteredCallsigns = useMemo(() => 
    allCallsigns.filter(callsign => 
        callsign.includes(searchTerm) || usedCallsigns[callsign]?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [allCallsigns, searchTerm, usedCallsigns]
  );
  
  const totalPages = Math.ceil(filteredCallsigns.length / itemsPerPage);
  const paginatedCallsigns = filteredCallsigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Callsign Assignments</h1>
          <p className="text-muted-foreground">
            Overview of assigned and available callsigns (1000-9999).
          </p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <Input 
            placeholder="Search by callsign or name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="md:w-[250px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading callsigns...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {paginatedCallsigns.map(callsign => {
              const isUsed = !!usedCallsigns[callsign];
              const userName = usedCallsigns[callsign];

              return (
                <Card key={callsign} className={isUsed ? 'bg-card' : 'bg-muted/50'}>
                  <CardHeader className="p-4">
                    <CardTitle className="flex justify-between items-center">
                      <span>{callsign}</span>
                      {isUsed ? (
                        <X className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {isUsed ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{userName}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Available</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
      {!loading && filteredCallsigns.length === 0 && (
         <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No callsigns found matching your search.</p>
        </div>
      )}

      <Card className="mt-12">
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
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Loading logs...
                            </TableCell>
                        </TableRow>
                    )}
                    {!loading && logs.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No callsign logs found.
                            </TableCell>
                        </TableRow>
                    )}
                    {logs.map(log => (
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
