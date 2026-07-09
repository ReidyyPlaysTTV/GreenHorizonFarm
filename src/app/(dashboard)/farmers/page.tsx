
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sprout, Truck, DollarSign, Clock, Tag, Users, AlertTriangle, CheckCircle2, XCircle, Loader2, Wallet, Eye, Phone, CreditCard, User, Hash, AlertCircle } from "lucide-react";
import { AddOrderForm } from "@/components/farmers/add-order-form";
import { getDetailedOrders, getExpiredBusinessOrders, getActiveOrders, completeDetailedOrder, cancelDetailedOrder } from "@/lib/actions";
import type { DetailedFarmOrder, BusinessOrder } from "@/lib/types";
import { formatDistanceToNow, subDays, isAfter, format } from "date-fns";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingOrders } from "@/components/farmers/pending-orders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailsDialog } from "@/components/farmers/order-details-dialog";

export default function FarmersPortal() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DetailedFarmOrder[]>([]);
  const [expiredOrders, setExpiredOrders] = useState<BusinessOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [ordersData, expiredData, activeData] = await Promise.all([
        getDetailedOrders(),
        getExpiredBusinessOrders(),
        getActiveOrders()
    ]);
    setOrders(ordersData);
    setExpiredOrders(expiredData);
    setActiveOrders(activeData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFinalize = async (id: string) => {
      setIsProcessing(prev => ({ ...prev, [id]: true }));
      const user = localStorage.getItem('loggedInUser') || "System";
      const res = await completeDetailedOrder(id, user);
      if (res.success) {
          toast({ title: "Operation Completed", description: "Ledger updated and security alert cleared." });
          fetchData();
      }
      setIsProcessing(prev => ({ ...prev, [id]: false }));
  };

  const handleAbort = async (id: string) => {
      if (!confirm("Are you sure you want to abort this operation?")) return;
      const user = localStorage.getItem('loggedInUser') || "System";
      await cancelDetailedOrder(id, user);
      fetchData();
  };

  const stats = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentOrders = orders.filter(o => isAfter(new Date(o.created_at), sevenDaysAgo));
    const totalItems = orders.reduce((acc, o) => acc + (o.items_sold || []).reduce((sum, item) => sum + item.quantity, 0), 0);
    
    const farmProfit7d = recentOrders.reduce((acc, o) => {
        const total = Number(o.total_price);
        const cut = Number(o.employee_cut_value);
        return acc + (total - cut);
    }, 0);

    return {
        totalItems,
        farmProfit7d,
        submissionCount: orders.length
    };
  }, [orders]);

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-primary">Farmers Portal</h1>
          <p className="text-muted-foreground mt-2 text-xl font-medium">Logistics control and production yield center.</p>
        </div>
        <div className="flex items-center gap-3">
            <AddOrderForm onOrderStarted={fetchData} />
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-widest text-orange-500 flex items-center gap-3">
              <Truck className="h-5 w-5 animate-bounce" />
              Ongoing Operations
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeOrders.map(ao => (
                  <Card key={ao.id} className="border-orange-500/20 bg-orange-500/5 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2">
                          <Badge variant="outline" className="text-[8px] border-orange-500/30 text-orange-500 animate-pulse">SECURITY ALERT ACTIVE</Badge>
                      </div>
                      <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-black text-white">{ao.business_name}</CardTitle>
                          <div className="flex flex-col gap-1 mt-1">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-200/80">
                                <User className="h-3 w-3" /> Started by {ao.completed_by}
                             </div>
                             {(ao as any).lead_info?.phone && (
                                <div className="flex items-center gap-2 text-[8px] font-bold text-blue-300 opacity-60">
                                    <Phone className="h-2.5 w-2.5" /> {(ao as any).lead_info.phone}
                                </div>
                             )}
                          </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="space-y-1.5">
                              {ao.items_sold.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg">
                                      <span className="font-bold">{item.product_name}</span>
                                      <span className="font-black text-orange-400">x{item.quantity}</span>
                                  </div>
                              ))}
                          </div>
                          
                          {(ao as any).business_bank && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                                    <Wallet className="h-4 w-4 text-blue-400" />
                                    <div className="text-[10px] font-black uppercase text-blue-400">
                                        Bill Account: {(ao as any).business_bank}
                                    </div>
                                </div>
                          )}

                          <div className="flex gap-2">
                              <Button 
                                onClick={() => handleFinalize(ao.id)} 
                                disabled={isProcessing[ao.id]}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold h-10 gap-2"
                              >
                                  {isProcessing[ao.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  Finalize & Ledger
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleAbort(ao.id)}
                                className="h-10 w-10 border-destructive/20 text-destructive/60 hover:bg-destructive/10"
                              >
                                  <XCircle className="h-4 w-4" />
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              ))}
              {activeOrders.length === 0 && (
                  <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                      <p className="text-xs font-black uppercase tracking-[0.3em]">No Active Field Operations</p>
                  </div>
              )}
          </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Historical Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.submissionCount}</div>
            <p className="text-[10px] text-primary mt-2 font-bold uppercase tracking-widest">Total Orders Handled</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 shadow-lg bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Farm Yield (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-500">${stats.farmProfit7d.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Business Revenue Net</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.totalItems.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Total Units Harvested</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-8">
          <TabsList className="bg-muted/20 border border-white/5 h-12 p-1 rounded-2xl">
              <TabsTrigger value="pending" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">Incoming Requests</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">Order Ledger</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
              <PendingOrders onAccept={fetchData} />
          </TabsContent>

          <TabsContent value="history" className="space-y-8">
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-primary" />
                        Successful Operations Ledger
                    </CardTitle>
                    <CardDescription>A list of recently fulfilled orders and staff splits. Click any row for deep metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({length: 5}).map((_, i) => (
                            <Skeleton className="h-12 w-full rounded-lg" key={i} />
                        ))}
                    </div>
                ) : orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Order #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Total Value</TableHead>
                                <TableHead>Payout Status</TableHead>
                                <TableHead>Lead Personnel</TableHead>
                                <TableHead className="text-right">Timeline</TableHead>
                                <TableHead className="w-[100px] text-right">Details</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {orders.map((o) => {
                                const needsPayment = o.payouts?.some(p => p.status === 'Pending');
                                return (
                                <TableRow key={o.id} className="group hover:bg-white/5 transition-all">
                                <TableCell>
                                    <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                                        <Hash className="h-3 w-3 opacity-40" />
                                        {o.id.substring(0, 8).toUpperCase()}
                                    </div>
                                </TableCell>
                                <TableCell className="font-black text-primary">{o.business_name}</TableCell>
                                <TableCell className="font-black text-emerald-500">${Number(o.total_price).toLocaleString()}</TableCell>
                                <TableCell>
                                    {needsPayment ? (
                                        <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 gap-1.5 animate-pulse uppercase text-[9px] font-black">
                                            <AlertCircle className="h-3 w-3" />
                                            Unpaid Shares
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 uppercase text-[9px] font-black">
                                            <CheckCircle2 className="h-3 w-3" />
                                            All Paid
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3 w-3 opacity-40" />
                                        <div className="text-[10px] font-bold">
                                            {o.completed_by} {o.collaborators.length > 0 && `+ ${o.collaborators.length}`}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase text-emerald-500">Done: {o.completed_at ? format(new Date(o.completed_at), 'HH:mm') : '---'}</span>
                                        <span className="text-[8px] text-muted-foreground font-bold">{format(new Date(o.created_at), 'MMM dd')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <OrderDetailsDialog order={o}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </OrderDetailsDialog>
                                </TableCell>
                                </TableRow>
                            )})}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg text-center p-8">
                        <p className="text-muted-foreground font-medium">No historical orders found.</p>
                    </div>
                )}
                </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
