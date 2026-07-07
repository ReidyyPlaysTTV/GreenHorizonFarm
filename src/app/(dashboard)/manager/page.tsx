
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
    Briefcase,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AddStaffIncidentDialog } from "@/components/manager/add-staff-incident-dialog";
import { AddProductDialog } from "@/components/manager/add-product-dialog";
import { AddPlanDialog } from "@/components/manager/add-plan-dialog";
import { AddPromotionSuggestionDialog } from "@/components/manager/add-promotion-suggestion-dialog";

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
    const fromOrders = orders.map(o => ({ date: o.created_at, desc: `Order: ${o.business_name}`, amt: Number(o.total_price), type: 'Income' }));
    const fromManual = transactions.filter(t => t.category === 'Income').map(t => ({ date: t.transaction_date, desc: t.description, amt: Number(t.amount), type: 'Income' }));
    return [...fromOrders, ...fromManual].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [orders, transactions]);

  const recentExpenses = useMemo(() => {
    const fromManual = transactions.filter(t => t.category !== 'Income').map(t => ({ date: t.transaction_date, desc: t.description, amt: Number(t.amount), type: 'Expense' }));
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
            <Button asChild variant="secondary" className="font-bold border border-primary/20">
                <Link href="/applications" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Hiring Portal
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
        {/* Activity Feeds */}
        <Card className="lg:col-span-2 border-primary/10 bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Recently Completed Jobs
                    </CardTitle>
                    <CardDescription>Latest order submissions from the farm floor.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                <TableHead>Business</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.slice(0, 8).map(o => (
                                <TableRow key={o.id}>
                                    <TableCell className="font-bold">{o.completed_by}</TableCell>
                                    <TableCell>{o.business_name}</TableCell>
                                    <TableCell className="text-emerald-500 font-bold">${Number(o.total_price).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-[10px] text-muted-foreground">{format(o.created_at, 'p')}</TableCell>
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
                    Inactive Staff (0 Orders)
                </CardTitle>
                <CardDescription>Active employees who haven't logged work yet.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                        {inactivePersonnel.map(p => (
                            <div key={p.id} className="p-3 bg-background/50 rounded-lg flex items-center justify-between border border-destructive/10">
                                <div>
                                    <p className="font-bold text-sm">{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{p.rank}</p>
                                </div>
                                <Badge variant="outline" className="text-destructive border-destructive/20">Inactive</Badge>
                            </div>
                        ))}
                        {inactivePersonnel.length === 0 && (
                            <p className="text-center text-muted-foreground py-10 text-sm italic">All staff have logged orders.</p>
                        )}
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
                      Recent Farm Income
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                        {recentIncome.map((i, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">{i.desc}</p>
                                    <p className="text-[10px] text-muted-foreground">{format(i.date, 'MMM dd')}</p>
                                </div>
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
                      Recent Expenditures
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                        {recentExpenses.map((e, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">{e.desc}</p>
                                    <p className="text-[10px] text-muted-foreground">{format(e.date, 'MMM dd')}</p>
                                </div>
                                <span className="text-red-400 font-black">-${e.amt.toLocaleString()}</span>
                            </div>
                        ))}
                        {recentExpenses.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm italic">No recent manual expenditures.</p>}
                    </div>
                </ScrollArea>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Hires */}
          <Card className="border-primary/10 bg-card/30">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Personnel Activity
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[350px]">
                      <div className="space-y-4">
                          {activity.slice(0, 10).map(e => (
                              <div key={e.id} className="flex items-start gap-3">
                                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                  <div className="flex-1">
                                      <p className="text-sm font-bold">{e.personnel_name}</p>
                                      <p className="text-xs text-muted-foreground">{e.description}</p>
                                      <p className="text-[10px] text-muted-foreground mt-1">{format(e.date, 'MMM dd')}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </ScrollArea>
              </CardContent>
          </Card>

          {/* Security Incidents */}
          <Card className="border-destructive/20 bg-destructive/10">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                      Security Breaches
                  </CardTitle>
              </CardHeader>
              <CardContent>
                   <ScrollArea className="h-[350px]">
                      <div className="space-y-4">
                          {securityIncidents.slice(0, 5).map(si => (
                              <div key={si.id} className="p-3 bg-black/20 rounded-xl border border-destructive/20">
                                  <h4 className="font-bold text-sm text-destructive">{si.title}</h4>
                                  <p className="text-[10px] text-muted-foreground mt-1">at {si.location} • {format(si.created_at, 'MMM dd')}</p>
                                  <p className="text-xs mt-2 line-clamp-2 text-muted-foreground italic">"{si.description}"</p>
                              </div>
                          ))}
                          {securityIncidents.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm italic">All perimeter plots are clear.</p>}
                      </div>
                  </ScrollArea>
              </CardContent>
          </Card>

          {/* Product Catalog Reference */}
          <Card className="border-primary/10 bg-card/30">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Product Price List
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[350px]">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead>Price</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {managerData?.farmProducts.map(p => (
                                  <TableRow key={p.id}>
                                      <TableCell className="text-xs font-bold">{p.name}</TableCell>
                                      <TableCell className="text-xs text-primary font-black">${Number(p.price).toLocaleString()}</TableCell>
                                  </TableRow>
                              ))}
                              {managerData?.farmProducts.length === 0 && (
                                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground text-xs py-10">No products defined.</TableCell></TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              </CardContent>
          </Card>
      </div>

      {/* Disciplinaries, Plans, Promotions */}
      <div className="grid gap-8 lg:grid-cols-2">
          {/* Promotion Suggestions */}
          <Card className="border-primary/10 bg-card/30 shadow-2xl">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Promotion Recommendations
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                        {managerData?.promotionSuggestions.map(s => (
                            <div key={s.id} className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-primary">{s.personnel_name}</h4>
                                    <Badge variant="secondary">{s.suggested_rank}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 italic whitespace-pre-wrap">"{s.reason}"</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-3 font-bold uppercase">Proposed by {s.suggested_by} on {format(s.created_at, 'MM/dd/yy')}</p>
                            </div>
                        ))}
                         {managerData?.promotionSuggestions.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm italic">No pending promotion requests.</p>}
                    </div>
                  </ScrollArea>
              </CardContent>
          </Card>

          {/* Strategic Plans */}
          <Card className="border-primary/10 bg-card/30 shadow-2xl">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Farm Strategy & Plans
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                        {managerData?.managerPlans.map(p => (
                            <div key={p.id} className="p-4 bg-muted/20 rounded-xl border border-white/5">
                                <h4 className="font-bold">{p.title}</h4>
                                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{p.content}</p>
                                <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground/60 font-black uppercase">
                                    <span>Author: {p.author}</span>
                                    <span>{format(p.created_at, 'MMM dd, yyyy')}</span>
                                </div>
                            </div>
                        ))}
                        {managerData?.managerPlans.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm italic">No active management plans.</p>}
                    </div>
                  </ScrollArea>
              </CardContent>
          </Card>
      </div>

       {/* Staff Incidents Table */}
       <Card className="border-destructive/20 bg-black/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                    Internal Disciplinary Log
                </CardTitle>
                <CardDescription>Official record of staff incidents and issued warnings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Name</TableHead>
                            <TableHead>Incident / Reason</TableHead>
                            <TableHead>Issued By</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {managerData?.staffIncidents.map(inc => (
                            <TableRow key={inc.id}>
                                <TableCell className="font-bold text-destructive">{inc.personnel_name}</TableCell>
                                <TableCell className="max-w-[400px] text-xs text-muted-foreground">{inc.reason}</TableCell>
                                <TableCell className="text-xs font-medium">{inc.issued_by}</TableCell>
                                <TableCell className="text-right text-[10px] text-muted-foreground">{format(inc.incident_date, 'MM/dd/yy')}</TableCell>
                            </TableRow>
                        ))}
                        {managerData?.staffIncidents.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">No disciplinaries on record.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
