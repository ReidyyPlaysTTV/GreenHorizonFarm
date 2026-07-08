
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sprout, Truck, DollarSign, Clock, Tag, Users, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AddOrderForm } from "@/components/farmers/add-order-form";
import { getDetailedOrders, getExpiredBusinessOrders, getActiveOrders, completeDetailedOrder, cancelDetailedOrder } from "@/lib/actions";
import type { DetailedFarmOrder, BusinessOrder } from "@/lib/types";
import { formatDistanceToNow, subDays, isAfter, format } from "date-fns";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PendingOrders } from "@/components/farmers/pending-orders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
          toast({ title: "Operation Completed", description: "Billed and recorded in ledger." });
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

      {/* Active Operations Section */}
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
                          <CardDescription className="text-[10px] uppercase font-bold text-orange-200/60">Started by {ao.completed_by}</CardDescription>
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
                          <div className="flex gap-2">
                              <Button 
                                onClick={() => handleFinalize(ao.id)} 
                                disabled={isProcessing[ao.id]}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold h-10 gap-2"
                              >
                                  {isProcessing[ao.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  Finalize & Bill
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
                    <CardDescription>A list of recently fulfilled orders and staff splits.</CardDescription>
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
                                <TableHead>Client</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Business (40%)</TableHead>
                                <TableHead>Staff Pool (60%)</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead className="text-right">Timeline</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {orders.map((o) => (
                                <TableRow key={o.id}>
                                <TableCell className="font-black text-primary">{o.business_name}</TableCell>
                                <TableCell className="text-[10px] text-muted-foreground max-w-[200px]">
                                    <div className="flex flex-wrap gap-1">
                                        {(o.items_sold || []).map((item, idx) => (
                                            <Badge key={idx} variant="outline" className="text-[8px] bg-muted/20">
                                                {item.quantity}x {item.product_name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="font-black text-emerald-500">${Number(o.total_price).toLocaleString()}</TableCell>
                                <TableCell className="text-muted-foreground font-medium">${(Number(o.total_price) * 0.4).toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-black text-emerald-400">${Number(o.employee_cut_value).toLocaleString()}</span>
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-60">Total Split</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3 w-3 opacity-40" />
                                        <div className="text-[10px] font-bold">
                                            {o.completed_by} {o.collaborators.length > 0 && `+ ${o.collaborators.length} others`}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase text-primary">Start: {format(new Date(o.created_at), 'HH:mm')}</span>
                                        <span className="text-[10px] font-black uppercase text-emerald-500">Done: {o.completed_at ? format(new Date(o.completed_at), 'HH:mm') : '---'}</span>
                                        <span className="text-[8px] text-muted-foreground font-bold">{format(new Date(o.created_at), 'MMM dd')}</span>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))}
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

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Lost Opportunities (Timed Out)
                    </CardTitle>
                    <CardDescription>Business orders that were not fulfilled within the 5-hour requirement.</CardDescription>
                </CardHeader>
                <CardContent>
                    {expiredOrders.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Requested Items</TableHead>
                                    <TableHead>Estimated Loss</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Original Request</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expiredOrders.map((eo) => {
                                    const loss = eo.items.reduce((acc, i) => acc + (i.quantity * i.price_at_sale), 0);
                                    return (
                                        <TableRow key={eo.id}>
                                            <TableCell className="font-bold text-destructive/80">{eo.business_name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {eo.items.map((item, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-[8px] opacity-60">
                                                            {item.quantity}x {item.product_name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-black text-destructive">-${loss.toLocaleString()}</TableCell>
                                            <TableCell className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground italic">
                                                not completed in required time
                                            </TableCell>
                                            <TableCell className="text-right text-[10px] text-muted-foreground">
                                                {format(new Date(eo.created_at), 'MM/dd HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                         </Table>
                    ) : (
                        <div className="text-center py-10 opacity-20">
                            <p className="font-black text-xs uppercase tracking-widest">No recently failed orders</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
