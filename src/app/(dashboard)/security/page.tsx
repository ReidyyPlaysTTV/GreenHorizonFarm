
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, ShieldAlert, History, MapPin, User, Siren, Activity, Truck, AlertTriangle, Users, Phone } from "lucide-react";
import { ClockHoursForm } from "@/components/security/clock-hours-form";
import { ReportIncidentForm } from "@/components/security/report-incident-form";
import { getSecurityIncidents, getSecurityTimeLogs, getActiveOrders } from "@/lib/actions";
import type { SecurityIncident, SecurityTimeLog, DetailedFarmOrder } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function SecurityPortal() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [timeLogs, setTimeLogs] = useState<SecurityTimeLog[]>([]);
  const [activeOps, setActiveOps] = useState<DetailedFarmOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [incData, logsData, opsData] = await Promise.all([
            getSecurityIncidents(),
            getSecurityTimeLogs(),
            getActiveOrders()
        ]);
        setIncidents(incData);
        setTimeLogs(logsData);
        setActiveOps(opsData);
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

      <div className="grid gap-6 md:grid-cols-3">
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

        <Card className="border-orange-500/20 shadow-lg bg-orange-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-orange-400">Field Operations</CardTitle>
                <Truck className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-orange-400">{activeOps.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Staff currently in delivery phase</p>
            </CardContent>
        </Card>
      </div>

      <Card className="border-orange-500/30 bg-orange-500/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-orange-400 flex items-center gap-2 font-black uppercase tracking-tighter">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    Live Activity Monitoring
                </CardTitle>
                <CardDescription className="text-orange-200/60">Real-time alerts for ongoing supply operations across the territory.</CardDescription>
              </div>
          </CardHeader>
          <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeOps.map(op => (
                      <div key={op.id} className="p-4 bg-black/40 rounded-2xl border border-orange-500/20 space-y-3">
                          <div className="flex justify-between items-start">
                              <h4 className="font-black text-white uppercase tracking-tight">{op.business_name}</h4>
                              <Badge className="bg-orange-500 text-black font-black text-[8px]">IN FIELD</Badge>
                          </div>
                          <div className="space-y-1">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-200/80">
                                    <User className="h-3 w-3" />
                                    Lead: {op.completed_by}
                                </div>
                                {(op as any).lead_info?.phone && (
                                    <div className="flex items-center gap-2 text-[8px] font-bold text-blue-300 opacity-60 ml-5">
                                        <Phone className="h-2.5 w-2.5" /> {(op as any).lead_info.phone}
                                    </div>
                                )}
                              </div>
                              {op.collaborators.length > 0 && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-orange-200/60 mt-1">
                                      <Users className="h-3 w-3" />
                                      Team: {op.collaborators.join(", ")}
                                  </div>
                              )}
                          </div>
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">Started {formatDistanceToNow(op.created_at, { addSuffix: true })}</span>
                              <Badge variant="outline" className="text-[8px] border-orange-500/40 text-orange-400">PRIORITY 2</Badge>
                          </div>
                      </div>
                  ))}
                  {activeOps.length === 0 && (
                      <div className="col-span-full py-8 text-center text-orange-200/20 font-black uppercase tracking-[0.4em] text-xs">
                          No active farm operations detected
                      </div>
                  )}
              </div>
          </CardContent>
      </Card>

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
                <ScrollArea className="h-[550px] pr-4">
                    {loading ? (
                         <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                         </div>
                    ) : incidents.length > 0 ? (
                        <div className="space-y-4">
                            {incidents.map((incident) => (
                                <div key={incident.id} className="p-5 rounded-2xl border border-destructive/10 bg-destructive/5 space-y-4 relative overflow-hidden group">
                                    {incident.pd_called && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <Badge className="bg-red-600 animate-pulse gap-1">
                                                <Siren className="h-3 w-3" /> PD CALLED
                                            </Badge>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-xl leading-tight">{incident.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {incident.location}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-destructive/20 pl-3">
                                        "{incident.description}"
                                    </p>
                                    
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            Reported by {incident.reported_by}
                                        </div>
                                        {incident.injured_details && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-red-400">
                                                <Activity className="h-3 w-3" />
                                                Injuries: {incident.injured_details}
                                            </div>
                                        )}
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
                <ScrollArea className="h-[550px]">
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
