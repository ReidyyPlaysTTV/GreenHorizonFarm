
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, ShieldAlert, History, MapPin, User, FileText } from "lucide-react";
import { ClockHoursForm } from "@/components/security/clock-hours-form";
import { ReportIncidentForm } from "@/components/security/report-incident-form";
import { getSecurityIncidents, getSecurityTimeLogs } from "@/lib/actions";
import type { SecurityIncident, SecurityTimeLog } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SecurityPortal() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [timeLogs, setTimeLogs] = useState<SecurityTimeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [incData, logsData] = await Promise.all([
            getSecurityIncidents(),
            getSecurityTimeLogs()
        ]);
        setIncidents(incData);
        setTimeLogs(logsData);
    } catch (error) {
        console.error("Failed to fetch security data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalHours = timeLogs.reduce((acc, log) => acc + Number(log.hours), 0);
    const incidentCount24h = incidents.filter(i => 
        new Date(i.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return { totalHours, incidentCount24h };
  }, [incidents, timeLogs]);

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">Security Portal</h1>
          <p className="text-muted-foreground mt-1 text-lg">Farm perimeter and asset protection systems.</p>
        </div>
        <div className="flex items-center gap-3">
            <ClockHoursForm />
            <ReportIncidentForm />
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Duty Hours</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative officer hours logged</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 shadow-lg bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-destructive">Incidents (24h)</CardTitle>
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive">{stats.incidentCount24h}</div>
            <p className="text-xs text-muted-foreground mt-1">Security breaches reported today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>Security Incident Log</CardTitle>
                </div>
                <CardDescription>Recent perimeter events and property damage reports.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                    {loading ? (
                         <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                         </div>
                    ) : incidents.length > 0 ? (
                        <div className="space-y-4">
                            {incidents.map((incident) => (
                                <div key={incident.id} className="p-4 rounded-xl border border-destructive/10 bg-destructive/5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{incident.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {incident.location}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                                        "{incident.description}"
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground pt-2 border-t border-destructive/10">
                                        <User className="h-3 w-3" />
                                        Reported by {incident.reported_by}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl">
                            <Shield className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="text-muted-foreground font-medium">No incidents logged.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>

        <Card className="border-primary/10 bg-card/40">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <CardTitle>Recent Time Logs</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[450px]">
                    {loading ? (
                         <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                         </div>
                    ) : timeLogs.length > 0 ? (
                        <div className="space-y-3">
                            {timeLogs.map((log) => (
                                <div key={log.id} className="p-3 bg-muted/20 rounded-lg flex items-center justify-between border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{log.user}</p>
                                            <p className="text-[10px] text-muted-foreground">{format(new Date(log.date), 'MM/dd/yyyy')}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/20 text-primary border-primary/20">
                                        {log.hours}h
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-10">No hours logged yet.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
