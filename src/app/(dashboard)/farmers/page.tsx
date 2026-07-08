
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sprout, Truck, DollarSign, Clock, Tag, Users, AlertTriangle } from "lucide-react";
import { AddOrderForm } from "@/components/farmers/add-order-form";
import { getDetailedOrders, getExpiredBusinessOrders } from "@/lib/actions";
import type { DetailedFarmOrder, BusinessOrder } from "@/lib/types";
import { formatDistanceToNow, subDays, isAfter, format } from "date-fns";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PendingOrders } from "@/components/farmers/pending-orders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FarmersPortal() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [expiredOrders, setExpiredOrders] = useState<BusinessOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [ordersData, expiredData] = await Promise.all([
        getDetailedOrders(),
        getExpiredBusinessOrders()
    ]);
    setOrders(ordersData);
    setExpiredOrders(expiredData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <AddOrderForm />
            <RefreshButton onRefresh={fetchData} />
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
              <PendingOrders />
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
                                <TableHead className="text-right">Date</TableHead>
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
                                <TableCell className="text-right text-[10px] font-black uppercase opacity-60">
                                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
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
                    <CardDescription>Business orders that were not fulfilled within the 3-hour requirement.</CardDescription>
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
