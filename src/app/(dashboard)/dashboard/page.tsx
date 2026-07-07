
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ClipboardCheck, TrendingUp, Sprout, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/layout/refresh-button";

export default function FarmDashboard() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Green Horizon Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-lg">Central Operations Management for the Farm.</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-4 py-1 text-sm bg-primary/5 text-primary border-primary/20">
                Season: Spring Harvest
            </Badge>
            <RefreshButton />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Staff</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 hired this week</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Orders Completed</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">148</div>
            <p className="text-xs text-muted-foreground mt-1">Goal: 200 for harvest</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Farm Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">$42,500</div>
            <p className="text-xs text-muted-foreground mt-1">12% growth over last week</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Missions</CardTitle>
            <Sprout className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">3</div>
            <p className="text-xs text-muted-foreground mt-1">Harvesting Wheat, Potatoes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 border-primary/10">
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest task completions from the field.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {[
                        { item: "50x Wheat Bundle", user: "John_Farmer", time: "2m ago", status: "Success" },
                        { item: "20x Organic Carrots", user: "Harvest_Lead", time: "15m ago", status: "Success" },
                        { item: "Truck Delivery: City Market", user: "Logistics_Guy", time: "1h ago", status: "Success" },
                    ].map((order, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <ClipboardCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{order.item}</p>
                                    <p className="text-xs text-muted-foreground">Completed by {order.user}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge className="bg-green-600/20 text-green-500 hover:bg-green-600/30 border-none">{order.status}</Badge>
                                <p className="text-[10px] text-muted-foreground mt-1">{order.time}</p>
                            </div>
                        </div>
                    ))}
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
    </div>
  );
}
