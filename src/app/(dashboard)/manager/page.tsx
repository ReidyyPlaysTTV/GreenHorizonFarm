
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/layout/refresh-button";
import { 
    getDetailedOrders, 
    getFarmTransactions, 
    getPersonnel, 
    getRecentActivity, 
    getSecurityIncidents,
} from "@/lib/actions";
import { getManagerData } from "@/lib/actions/manager-actions";
import type { 
    DetailedFarmOrder, 
    FarmTransaction, 
    Personnel, 
    PersonnelEvent, 
    SecurityIncident,
    StaffIncident,
    FarmProduct,
    ManagerPlan,
    PromotionSuggestion
} from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { 
    ClipboardCheck, 
    ReceiptText, 
    TrendingUp, 
    UserPlus, 
    UserX, 
    ShieldAlert, 
    ExternalLink, 
    LayoutDashboard,
    Star,
    Lightbulb,
    CheckCircle2,
    XCircle,
    Clock,
    Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AddStaffIncidentDialog } from "@/components/manager/add-staff-incident-dialog";
import { AddProductDialog } from "@/components/manager/add-product-dialog";
import { EditProductDialog } from "@/components/manager/edit-product-dialog";
import { AddPlanDialog } from "@/components/manager/add-plan-dialog";
import { AddPromotionSuggestionDialog } from "@/components/manager/add-promotion-suggestion-dialog";
import { AddAnnouncementDialog } from "@/components/dashboard/add-announcement-dialog";

const StatusBadge = ({ status, feedback }: { status: string, feedback?: string }) => {
    let icon = <Clock className="h-3 w-3" />;
    let variant: "secondary" | "default" | "destructive" = "secondary";
    
    if (status === 'Approved') {
        icon = <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
        variant = "default";
    } else if (status === 'Rejected') {
        icon = <XCircle className="h-3 w-3 text-destructive" />;
        variant = "destructive";
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <Badge variant={variant} className="gap-1.5 px-2 py-0.5 uppercase text-[10px] font-black">
                {icon}
                {status}
            </Badge>
            {feedback && <p className="text-[9px] text-muted-foreground italic text-right max-w-[150px]">CEO: "{feedback}"</p>}
        </div>
    );
};

export default function ManagerPortal() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [transactions, setTransactions] = useState<FarmTransaction[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [activity, setActivity] = useState<PersonnelEvent[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [managerData, setManagerData] = useState<{
    staffIncidents: StaffIncident[];
    farmProducts: FarmProduct[];
    managerPlans: ManagerPlan[];
    promotionSuggestions: PromotionSuggestion[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [o, t, p, a, s, m] = await Promise.all([
            getDetailedOrders(),
            getFarmTransactions(),
            getPersonnel(),
            getRecentActivity(),
            getSecurityIncidents(),
            getManagerData()
        ]);
        setOrders(o);
        setTransactions(t);
        setPersonnel(p);
        setActivity(a);
        setSecurityIncidents(s);
        setManagerData(m);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const inactivePersonnel = useMemo(() => 
    personnel.filter(p => Number(p.ordersCompleted || 0) === 0 && p.status === 'Active')
  , [personnel]);

  const recentIncome = useMemo(() => {
    const fromOrders = orders.map(o => ({ date: new Date(o.created_at), desc: `Order: ${o.business_name}`, amt: Number(o.total_price), type: 'Income' }));
    const fromManual = transactions.filter(t => t.category === 'Income').map(t => ({ date: new Date(t.transaction_date), desc: t.description, amt: Number(t.amount), type: 'Income' }));
    return [...fromOrders, ...fromManual].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [orders, transactions]);

  const recentExpenses = useMemo(() => {
    const fromManual = transactions.filter(t => t.category !== 'Income').map(t => ({ date: new Date(t.transaction_date), desc: t.description, amt: Number(t.amount), type: 'Expense' }));
    return fromManual.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [transactions]);

  if (loading) return <div className="p-10 space-y-4"><Skeleton className="h-10 w-64"/><Skeleton className="h-96 w-full"/></div>;

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary flex items-center gap-3">
            <LayoutDashboard className="h-10 w-10 opacity-40" />
            Manager Command Center
          </h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Global operations oversight and leadership workspace.</p>
        </div>
        <div className="flex items-center gap-2">
             <AddAnnouncementDialog />
            <Button asChild variant="secondary" className="font-bold border border-primary/20 h-10">
                <Link href="/applications" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Recruitment
                </Link>
            </Button>
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <AddStaffIncidentDialog />
          <AddProductDialog />
          <AddPlanDialog />
          <AddPromotionSuggestionDialog />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="lg:col-span-2 border-primary/10 bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Latest Order Logs
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px]">
                    <Table>
                        <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Business</TableHead><TableHead>Value</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {orders.slice(0, 10).map(o => (
                                <TableRow key={o.id}>
                                    <TableCell className="font-bold">{o.completed_by}</TableCell>
                                    <TableCell className="text-xs">{o.business_name}</TableCell>
                                    <TableCell className="text-emerald-500 font-bold">${Number(o.total_price).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-[10px] text-muted-foreground">{format(new Date(o.created_at), 'HH:mm')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>

        {/* Inactive Personnel */}
        <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-destructive" />
                    Inactive Staff
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                        {inactivePersonnel.map(p => (
                            <div key={p.id} className="p-3 bg-background/50 rounded-lg flex items-center justify-between border border-destructive/10">
                                <p className="font-bold text-xs">{p.name}</p>
                                <Badge variant="outline" className="text-[9px] uppercase text-destructive border-destructive/20">0 Orders</Badge>
                            </div>
                        ))}
                        {inactivePersonnel.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm italic">All staff have logged orders.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
          {/* Income Feed */}
          <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Recent Income
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                        {recentIncome.map((i, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5">
                                <p className="text-sm font-bold">{i.desc}</p>
                                <span className="text-emerald-500 font-black">+${i.amt.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
              </CardContent>
          </Card>

          {/* Expense Feed */}
          <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <ReceiptText className="h-5 w-5 text-red-500" />
                      Recent Outgoings
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                        {recentExpenses.map((e, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5">
                                <p className="text-sm font-bold">{e.desc}</p>
                                <span className="text-red-400 font-black">-${e.amt.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
          {/* Promotion Review Tracker */}
          <Card className="border-yellow-500/20 bg-card/30 lg:col-span-1 shadow-xl">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <Star className="h-5 w-5" />
                      Promotion Tracker
                  </CardTitle>
                  <CardDescription>Status of your staff recommendations.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                        {managerData?.promotionSuggestions.map(s => (
                            <div key={s.id} className="p-3 bg-muted/20 rounded-xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-xs">{s.personnel_name}</h4>
                                    <StatusBadge status={s.status} feedback={s.feedback} />
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase">Target: {s.suggested_rank}</p>
                            </div>
                        ))}
                    </div>
                  </ScrollArea>
              </CardContent>
          </Card>

          {/* Manager Strategy Board */}
          <Card className="border-primary/10 bg-card/30 lg:col-span-2 shadow-xl">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                      <Lightbulb className="h-5 w-5" />
                      Management Strategy Board
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="grid md:grid-cols-2 gap-4">
                        {managerData?.managerPlans.map(p => (
                            <div key={p.id} className="p-4 bg-muted/20 rounded-xl border border-white/5">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm">{p.title}</h4>
                                    <StatusBadge status={p.status} feedback={p.feedback} />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 line-clamp-3 italic whitespace-pre-wrap">{p.content}</p>
                                <p className="text-[8px] text-muted-foreground/60 mt-4 font-black uppercase">Published by {p.author}</p>
                            </div>
                        ))}
                    </div>
                  </ScrollArea>
              </CardContent>
          </Card>
      </div>

       <Card className="border-primary/10 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                        Global Product Catalog
                    </CardTitle>
                    <CardDescription>Management view of all network supply items and pricing.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {managerData?.farmProducts.map(p => (
                        <div key={p.id} className="p-4 bg-muted/30 rounded-2xl border border-white/5 text-center group relative overflow-hidden transition-all hover:border-primary/30">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{p.category}</p>
                            <h4 className="font-bold text-sm mt-1">{p.name}</h4>
                            <p className="text-primary font-black mt-2 text-lg">${Number(p.price).toLocaleString()}</p>
                            
                            {/* Management Actions */}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <EditProductDialog product={p}>
                                    <Button size="icon" className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </EditProductDialog>
                            </div>
                        </div>
                    ))}
                    {managerData?.farmProducts.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground italic">No products listed.</p>}
                </div>
            </CardContent>
        </Card>

       {/* Security Incidents */}
       <Card className="border-destructive/20 bg-destructive/10 mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                    Security Logs (Executive Summary)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Incident</TableHead><TableHead>Location</TableHead><TableHead>Reported By</TableHead><TableHead className="text-right">Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {securityIncidents.slice(0, 5).map(si => (
                            <TableRow key={si.id}>
                                <TableCell className="font-bold text-destructive text-xs">{si.title}</TableCell>
                                <TableCell className="text-xs">{si.location}</TableCell>
                                <TableCell className="text-xs">{si.reported_by}</TableCell>
                                <TableCell className="text-right text-[10px] text-muted-foreground">{format(new Date(si.created_at), 'MM/dd')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
