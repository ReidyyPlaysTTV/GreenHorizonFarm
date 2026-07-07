
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sprout, Wheat, Beef, Truck, DollarSign, Clock, Tag } from "lucide-react";
import { AddOrderForm } from "@/components/farmers/add-order-form";
import { getDetailedOrders } from "@/lib/actions";
import type { DetailedFarmOrder } from "@/lib/types";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function FarmersPortal() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getDetailedOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
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

    const logisticsRate = orders.length > 0 
        ? Math.round((orders.filter(o => o.logistics_used).length / orders.length) * 100) 
        : 0;

    return {
        totalItems,
        farmProfit7d,
        logisticsRate,
        submissionCount: orders.length
    };
  }, [orders]);

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">Farmers Portal</h1>
          <p className="text-muted-foreground mt-1 text-lg">Daily yield logging and order completion tracking.</p>
        </div>
        <div className="flex items-center gap-3">
            <AddOrderForm />
            <RefreshButton onRefresh={fetchOrders} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Orders</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.submissionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total history</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 shadow-lg bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-400">Farm Income (7d)</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">${stats.farmProfit7d.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Business share after cuts</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Units Yielded</CardTitle>
            <Sprout className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Total products harvested</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logistics</CardTitle>
            <Truck className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.logisticsRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Delivery usage</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Order Ledger</CardTitle>
          <CardDescription>A list of recently completed and logged farm orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
                {Array.from({length: 5}).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
          ) : orders.length > 0 ? (
            <TooltipProvider>
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Yield Details</TableHead>
                        <TableHead>Total Paid</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Cut (%)</TableHead>
                        <TableHead>Logistics</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Date Completed</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {orders.map((o) => (
                        <TableRow key={o.id}>
                        <TableCell className="font-bold">{o.business_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[250px]">
                            <div className="flex flex-wrap gap-1">
                                {(o.items_sold || []).map((item, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[9px] bg-muted/20">
                                        {item.quantity}x {item.product_name}
                                    </Badge>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-500">${Number(o.total_price).toLocaleString()}</TableCell>
                        <TableCell>
                            {o.discount_amount > 0 ? (
                                <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                                    <Tag className="h-3 w-3" />
                                    ${Number(o.discount_amount).toLocaleString()}
                                </div>
                            ) : (
                                <span className="opacity-20 text-xs">-</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-bold">${Number(o.employee_cut_value).toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground">{o.employee_cut_percentage}%</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {o.logistics_used ? (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Yes</Badge>
                            ) : (
                            <Badge variant="outline" className="opacity-50">No</Badge>
                            )}
                        </TableCell>
                        <TableCell>{o.completed_by}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            </TooltipProvider>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg text-center p-8">
              <p className="text-muted-foreground font-medium">No orders recorded in the current ledger.</p>
              <p className="text-sm text-muted-foreground/60">Click the button above to record your first farm sale.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
