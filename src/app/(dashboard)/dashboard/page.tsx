
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardCheck, TrendingUp, AlertCircle, Loader2, ArrowUp, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/layout/refresh-button";
import { getDetailedOrders, getRecentActivity } from "@/lib/actions";
import type { DetailedFarmOrder, PersonnelEvent } from "@/lib/types";
import { subDays, isAfter, startOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function FarmDashboard() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [activity, setActivity] = useState<PersonnelEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [ordersData, activityData] = await Promise.all([
            getDetailedOrders(),
            getRecentActivity()
        ]);
        setOrders(ordersData);
        setActivity(activityData);
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const startOfThisWeek = startOfWeek(new Date());

    const revenue30d = orders
      .filter(o => isAfter(new Date(o.created_at), thirtyDaysAgo))
      .reduce((acc, o) => acc + Number(o.total_price), 0);

    const ordersThisWeek = orders
      .filter(o => isAfter(new Date(o.created_at), startOfThisWeek))
      .length;

    return { revenue30d, ordersThisWeek };
  }, [orders]);

  const recentPromotions = useMemo(() => 
    activity.filter(e => e.event_type === 'Promoted').slice(0, 3)
  , [activity]);

  const recentHires = useMemo(() => 
    activity.filter(e => e.event_type === 'Hired' || e.event_type === 'Rehired').slice(0, 3)
  , [activity]);

  if (loading) {
    return (
        <div className="container mx-auto p-6 md:p-10 space-y-8">
             <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-10" />
             </div>
             <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
             </div>
             <div className="grid gap-8 md:grid-cols-7">
                <Skeleton className="md:col-span-4 h-96 w-full" />
                <Skeleton className="md:col-span-3 h-96 w-full" />
             </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Green Horizon Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-lg">Central Operations Management for the Farm.</p>
        </div>
        <div className="flex items-center gap-3">
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 shadow-lg shadow-primary/5 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Revenue (30d)</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">${stats.revenue30d.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross sales from produce & meat logs</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg shadow-primary/5 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Orders Completed (This Week)</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.ordersThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Task logs submitted since Monday</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 border-primary/10">
            <CardHeader>
                <CardTitle>Recent Orders Completed</CardTitle>
                <CardDescription>Latest task completions from the ledger.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <ClipboardCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{order.business_name}</p>
                                    <p className="text-xs text-muted-foreground">Completed by {order.completed_by}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-emerald-500">${Number(order.total_price).toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl">
                            <p className="text-muted-foreground font-medium">No orders recorded yet.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-3 border-destructive/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Urgent Farm Alerts
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-lg">
                    <p className="text-sm font-bold">Water Pump Maintenance Required</p>
                    <p className="text-xs text-muted-foreground mt-1">Logistics division needs to assign a technician by EOD.</p>
                </div>
                 <div className="p-4 border-l-4 border-yellow-500 bg-yellow-500/10 rounded-r-lg">
                    <p className="text-sm font-bold">City Market Price Update</p>
                    <p className="text-xs text-muted-foreground mt-1">Carrot prices are up 15%. Direct all sales there.</p>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-primary/10 bg-card/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-blue-400" />
                    Recent Promotions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {recentPromotions.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <ArrowUp className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{event.personnel_name}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                             {new Date(event.date).toLocaleDateString()}
                        </p>
                    </div>
                ))}
                {recentPromotions.length === 0 && (
                     <p className="text-sm text-muted-foreground py-4 text-center">No recent promotions logged.</p>
                )}
            </CardContent>
        </Card>

        <Card className="border-primary/10 bg-card/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-400" />
                    Recent Hires
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {recentHires.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{event.personnel_name}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                         <p className="text-[10px] text-muted-foreground">
                             {new Date(event.date).toLocaleDateString()}
                        </p>
                    </div>
                ))}
                {recentHires.length === 0 && (
                     <p className="text-sm text-muted-foreground py-4 text-center">No recent hires logged.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
