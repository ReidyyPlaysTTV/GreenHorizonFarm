
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
    getBusinesses,
    getAccessRequests
} from "@/lib/actions";
import { 
    getManagerData, 
    getCeoChatMessages, 
    sendCeoChatMessage, 
    reviewPromotionSuggestion, 
    reviewManagerPlan 
} from "@/lib/actions/manager-actions";
import type { 
    DetailedFarmOrder, 
    FarmTransaction, 
    Personnel, 
    PersonnelEvent, 
    SecurityIncident,
    StaffIncident,
    FarmProduct,
    ManagerPlan,
    PromotionSuggestion,
    CeoChatMessage,
    Business,
    AccessRequest
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
    ShieldCheck,
    MessageSquare,
    Send,
    CheckCircle2,
    XCircle,
    Star,
    Lightbulb,
    LayoutDashboard,
    Pencil,
    Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddStaffIncidentDialog } from "@/components/manager/add-staff-incident-dialog";
import { AddProductDialog } from "@/components/manager/add-product-dialog";
import { EditProductDialog } from "@/components/manager/edit-product-dialog";
import { AddPlanDialog } from "@/components/manager/add-plan-dialog";
import { AddPromotionSuggestionDialog } from "@/components/manager/add-promotion-suggestion-dialog";
import { AddAnnouncementDialog } from "@/components/dashboard/add-announcement-dialog";
import { BusinessManagement } from "@/components/manager/business-management";
import { AccessRequestManagement } from "@/components/admin/access-request-management";

export default function CEOPortal() {
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
  const [chatMessages, setChatMessages] = useState<CeoChatMessage[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
        const [o, t, p, a, s, m, c, b, ar] = await Promise.all([
            getDetailedOrders(),
            getFarmTransactions(),
            getPersonnel(),
            getRecentActivity(),
            getSecurityIncidents(),
            getManagerData(),
            getCeoChatMessages(),
            getBusinesses(),
            getAccessRequests()
        ]);
        setOrders(o);
        setTransactions(t);
        setPersonnel(p);
        setActivity(a);
        setSecurityIncidents(s);
        setManagerData(m);
        setChatMessages(c);
        setBusinesses(b);
        setAccessRequests(ar);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
    if (typeof window !== 'undefined') setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    fetchData(); 
  }, []);

  const handleSendMessage = async () => {
      if (!newMessage.trim()) return;
      await sendCeoChatMessage(newMessage, currentUser);
      setNewMessage("");
      fetchData();
  };

  const handleReviewPromotion = async (id: string, status: 'Approved' | 'Rejected') => {
      const feedback = prompt("Enter CEO feedback/reasoning:");
      if (feedback === null) return;
      const res = await reviewPromotionSuggestion(id, status, feedback, currentUser);
      if (res.success) {
          toast({ title: `Promotion ${status}` });
          fetchData();
      }
  };

  const handleReviewPlan = async (id: string, status: 'Approved' | 'Rejected') => {
      const feedback = prompt("Enter CEO feedback/reasoning:");
      if (feedback === null) return;
      const res = await reviewManagerPlan(id, status, feedback, currentUser);
      if (res.success) {
          toast({ title: `Plan ${status}` });
          fetchData();
      }
  };

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

  if (loading) return <div className="p-10 space-y-4"><Skeleton className="h-20 w-64"/><Skeleton className="h-96 w-full"/></div>;

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-primary/10 rounded-3xl border border-primary/20 shadow-2xl">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-primary flex items-center gap-4">
            <ShieldCheck className="h-14 w-14 opacity-80" />
            CEO Executive Portal
          </h1>
          <p className="text-muted-foreground mt-2 text-xl font-medium">Strategic control and high-level business oversight.</p>
        </div>
        <div className="flex items-center gap-3">
             <AddAnnouncementDialog />
             <Button asChild variant="secondary" className="font-bold h-12 px-6 rounded-xl border border-primary/20">
                <Link href="/applications" className="gap-2">
                    <ExternalLink className="h-5 w-5" /> Recruitment Center
                </Link>
            </Button>
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <AddStaffIncidentDialog />
          <AddProductDialog />
          <AddPlanDialog />
          <AddPromotionSuggestionDialog />
      </div>

      {accessRequests.length > 0 && (
          <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                  <Key className="h-5 w-5" />
                  System Entry Requests
              </h2>
              <AccessRequestManagement requests={accessRequests} />
          </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
          <Card className="border-primary/20 bg-card/60 shadow-xl lg:col-span-1">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="flex items-center gap-2 text-primary">
                      <MessageSquare className="h-5 w-5" />
                      Executive Discussion
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                          {chatMessages.map(msg => (
                              <div key={msg.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase text-primary">{msg.author}</span>
                                      <span className="text-[8px] text-muted-foreground">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                  </div>
                                  <p className="bg-muted/40 p-2 rounded-lg text-sm border border-white/5">{msg.message}</p>
                              </div>
                          ))}
                          {chatMessages.length === 0 && <p className="text-center py-20 text-muted-foreground text-xs italic">No executive messages.</p>}
                      </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-primary/10 flex gap-2">
                      <Input 
                        placeholder="Discuss strategy..." 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="bg-background/50"
                      />
                      <Button size="icon" onClick={handleSendMessage} className="shrink-0"><Send className="h-4 w-4" /></Button>
                  </div>
              </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5 shadow-xl lg:col-span-2">
              <CardHeader className="bg-yellow-500/10 border-b border-yellow-500/20">
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <Star className="h-5 w-5" />
                      Promotion Review Queue
                  </CardTitle>
                  <CardDescription>Management recommendations awaiting executive approval.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[445px]">
                    <div className="grid gap-4 mt-4">
                        {managerData?.promotionSuggestions.filter(s => s.status === 'Pending').map(s => (
                            <div key={s.id} className="p-5 bg-background/60 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-primary">{s.personnel_name}</h4>
                                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">{s.suggested_rank}</Badge>
                                    <p className="text-sm text-muted-foreground mt-2 italic">"{s.reason}"</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">Proposed by {s.suggested_by}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleReviewPromotion(s.id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700 gap-2 font-bold">
                                        <CheckCircle2 className="h-4 w-4" /> Approve
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleReviewPromotion(s.id, 'Rejected')} className="gap-2 font-bold">
                                        <XCircle className="h-4 w-4" /> Deny
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {managerData?.promotionSuggestions.filter(s => s.status === 'Pending').length === 0 && (
                            <div className="py-20 text-center text-muted-foreground font-medium italic">All promotion requests processed.</div>
                        )}
                    </div>
                  </ScrollArea>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
           <BusinessManagement />
           <Card className="border-blue-500/20 bg-blue-500/5 shadow-xl">
              <CardHeader className="bg-blue-500/10 border-b border-blue-500/20">
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                      <Lightbulb className="h-5 w-5" />
                      Strategic Plan Approval
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[400px] mt-4">
                    <div className="space-y-4">
                        {managerData?.managerPlans.filter(p => p.status === 'Pending').map(p => (
                             <div key={p.id} className="p-4 bg-background/50 rounded-xl border border-white/5 space-y-4">
                                <div>
                                    <h4 className="font-bold text-lg">{p.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{p.content}</p>
                                    <p className="text-[10px] text-muted-foreground/60 uppercase font-black mt-3">Author: {p.author}</p>
                                </div>
                                <div className="flex gap-2 border-t border-white/5 pt-3">
                                    <Button size="sm" variant="outline" onClick={() => handleReviewPlan(p.id, 'Approved')} className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Approve Plan</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleReviewPlan(p.id, 'Rejected')} className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">Deny Plan</Button>
                                </div>
                             </div>
                        ))}
                        {managerData?.managerPlans.filter(p => p.status === 'Pending').length === 0 && (
                            <div className="py-20 text-center text-muted-foreground italic">No management plans awaiting review.</div>
                        )}
                    </div>
                  </ScrollArea>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-primary/10 bg-card/40">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Recent Job Completions
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                      <Table>
                          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Value</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {orders.slice(0, 10).map(o => (
                                  <TableRow key={o.id}>
                                      <TableCell className="font-bold">{o.completed_by}</TableCell>
                                      <TableCell className="text-emerald-500 font-black">${Number(o.total_price).toLocaleString()}</TableCell>
                                      <TableCell className="text-right text-[10px] text-muted-foreground">{format(new Date(o.created_at), 'MMM dd HH:mm')}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5 shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                      <UserX className="h-5 w-5 text-destructive" />
                      Zero-Yield Staff (Inactive)
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {inactivePersonnel.slice(0, 12).map(p => (
                          <div key={p.id} className="p-3 bg-background/60 rounded-xl border border-destructive/10 text-center">
                              <p className="font-black text-sm">{p.name}</p>
                              <p className="text-[8px] text-muted-foreground uppercase mt-1">{p.rank}</p>
                          </div>
                      ))}
                      {inactivePersonnel.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground text-sm italic">All staff are actively yielding orders.</p>}
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
          <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-500">
                      <TrendingUp className="h-5 w-5" />
                      Global Income
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                        {recentIncome.map((i, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-background/40 rounded-lg border border-white/5">
                                <span className="text-xs font-bold truncate max-w-[150px]">{i.desc}</span>
                                <span className="text-emerald-500 font-black text-xs">+${i.amt.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
              </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5 shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                      <ReceiptText className="h-5 w-5" />
                      Global Outgoings
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                        {recentExpenses.map((e, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-background/40 rounded-lg border border-white/5">
                                <span className="text-xs font-bold truncate max-w-[150px]">{e.desc}</span>
                                <span className="text-red-400 font-black text-xs">-${e.amt.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
              </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/10 shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                      <ShieldAlert className="h-5 w-5" />
                      High-Alert Incidents
                  </CardTitle>
              </CardHeader>
              <CardContent>
                   <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                          {securityIncidents.slice(0, 8).map(si => (
                              <div key={si.id} className="p-2 bg-black/30 rounded-lg border border-destructive/10">
                                  <h4 className="font-bold text-[10px] text-destructive truncate">{si.title}</h4>
                                  <p className="text-[8px] text-muted-foreground">{si.location} • {format(new Date(si.created_at), 'MMM dd')}</p>
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
    </div>
  );
}
