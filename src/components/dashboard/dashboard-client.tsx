
"use client";

import type { Personnel, Application, PersonnelEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Users, FileText, UserCheck, UserX, ArrowUp, ArrowDown, UserPlus, UserMinus, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { RefreshButton } from "../layout/refresh-button";

const chartConfig = {
  total: {
    label: "Personnel",
    color: "hsl(var(--primary))",
  },
};

interface DashboardClientProps {
  personnel: Personnel[];
  applications: Application[];
  recentActivity: PersonnelEvent[];
}

const eventIcons = {
    Hired: <UserPlus className="h-4 w-4 text-green-500" />,
    Fired: <UserMinus className="h-4 w-4 text-red-500" />,
    Promoted: <ArrowUp className="h-4 w-4 text-blue-500" />,
    Demoted: <ArrowDown className="h-4 w-4 text-orange-500" />,
}

const eventColors = {
    Hired: "secondary",
    Fired: "destructive",
    Promoted: "default",
    Demoted: "secondary",
} as const;

export function DashboardClient({ personnel, applications, recentActivity }: DashboardClientProps) {
  const departmentCounts = personnel.reduce((acc, p) => {
    acc[p.department] = (acc[p.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(departmentCounts).map(([name, total]) => ({ name, total }));

  const pendingApplications = applications.filter(app => app.status === "Pending").length;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the Department of Corrections Roster.</p>
        </div>
        <RefreshButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personnel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personnel.length}</div>
            <p className="text-xs text-muted-foreground">officers on active duty</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications}</div>
            <p className="text-xs text-muted-foreground">awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Apps (Month)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2</div>
            <p className="text-xs text-muted-foreground">since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fired/Resigned (Month)</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1</div>
             <p className="text-xs text-muted-foreground">since last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Strength</CardTitle>
            <CardDescription>Number of personnel in each department.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.length > 12 ? value.slice(0, 10) + '...' : value}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest personnel changes.</CardDescription>
            </CardHeader>
            <CardContent>
                {recentActivity.length > 0 ? (
                <div className="space-y-4">
                    {recentActivity.map(event => (
                        <div key={event.id} className="flex items-start gap-4">
                           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                {eventIcons[event.event_type] || <ShieldAlert className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 text-sm">
                                <p className="font-medium">{event.personnel_name}</p>
                                <p className="text-muted-foreground">{event.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(event.date, { addSuffix: true })}
                                </p>
                            </div>
                             <Badge variant={eventColors[event.event_type]} className="text-xs">{event.event_type}</Badge>
                        </div>
                    ))}
                </div>
                 ) : (
                    <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No recent activity.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
