
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardCheck, TrendingUp, AlertCircle, ArrowUp, UserPlus, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/layout/refresh-button";
import { getDetailedOrders, getRecentActivity, getAnnouncements } from "@/lib/actions";
import type { DetailedFarmOrder, PersonnelEvent, Announcement } from "@/lib/types";
import { subDays, isAfter, startOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Announcements } from "@/components/dashboard/announcements";

export default function FarmDashboard() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [activity, setActivity] = useState<PersonnelEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [ordersData, activityData, annData] = await Promise.all([
            getDetailedOrders(),
            getRecentActivity(),
            getAnnouncements()
        ]);
        setOrders(ordersData);
        setActivity(activityData);
        setAnnouncements(annData);
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
            <h1 className="text-6xl font-black tracking-tighter text-primary flex items-center gap-4">
                <Zap className="h-12 w-12 fill-primary animate-pulse" />
                Green Horizon Hub
            </h1>
            <p className="text-muted-foreground mt-2 text-xl font-medium">Real-time agricultural management and logistics.</p>
        </div>
        <div className="flex items-center gap-3">
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-8">
             <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm group hover:border-primary/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Monthly Revenue</CardTitle>
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black tabular-nums">${stats.revenue30d.toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">30 Day Rolling Yield</p>
                </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm group hover:border-primary/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Order Volume</CardTitle>
                    <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black tabular-nums">{stats.ordersThisWeek}</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Submissions Since Monday</p>
                </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 bg-card/20 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Recent Production Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Zap className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-tight">{order.business_name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Staff: {order.completed_by}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-emerald-500 tracking-tighter">${Number(order.total_price).toLocaleString()}</p>
                                    <p className="text-[8px] text-muted-foreground mt-1 uppercase font-black">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-3xl opacity-20">
                                <p className="font-black uppercase tracking-widest text-sm">No Recent Data</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
            <Announcements initialAnnouncements={announcements} />
            
            <div className="grid gap-6">
                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                            <ArrowUp className="h-3 w-3" />
                            Career Advancements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentPromotions.map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl border border-blue-500/10">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">{event.personnel_name}</p>
                                    <p className="text-[10px] text-blue-300 opacity-80">{event.description}</p>
                                </div>
                                <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400">PROMOTE</Badge>
                            </div>
                        ))}
                        {recentPromotions.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4 italic">No recent rank updates.</p>}
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                            <UserPlus className="h-3 w-3" />
                            New Personnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentHires.map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">{event.personnel_name}</p>
                                    <p className="text-[10px] text-emerald-300 opacity-80">Joined the Division</p>
                                </div>
                                <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400">HIRE</Badge>
                            </div>
                        ))}
                        {recentHires.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4 italic">No recent onboarding.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
