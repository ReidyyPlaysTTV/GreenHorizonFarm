
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, PartyPopper, DollarSign, Clock, MoreVertical, Pencil, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/layout/refresh-button";
import { EventDialog } from "@/components/events/event-dialog";
import { getFarmEvents, cancelFarmEvent, deleteFarmEvent, completeFarmEvent } from "@/lib/actions";
import type { FarmEvent } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function EventsPortal() {
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    const data = await getFarmEvents();
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
    fetchEvents();
  }, []);

  const handleCancel = async (id: string) => {
    const res = await cancelFarmEvent(id, currentUser);
    if (res.success) {
        toast({ title: "Event Cancelled" });
        fetchEvents();
    }
  }

  const handleComplete = async (id: string) => {
    const res = await completeFarmEvent(id, currentUser);
    if (res.success) {
        toast({ title: "Event Completed!" });
        fetchEvents();
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteFarmEvent(id, currentUser);
    if (res.success) {
        toast({ title: "Event Deleted" });
        fetchEvents();
    }
  }

  const activeEvents = events.filter(e => e.status === 'Scheduled');
  const nextEvent = activeEvents[0];
  const totalProjectedRevenue = activeEvents.reduce((acc, e) => acc + Number(e.revenue), 0);

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Events Portal</h1>
            <p className="text-muted-foreground mt-1 text-lg">Community engagement and market events management.</p>
        </div>
        <div className="flex items-center gap-3">
            <EventDialog />
            <RefreshButton onRefresh={fetchEvents} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Next Event</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
                <>
                    <div className="text-xl font-bold text-foreground truncate">{nextEvent.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {format(nextEvent.event_date, "EEEE, h:mm a")}
                    </p>
                </>
            ) : (
                <div className="text-xl font-bold text-muted-foreground/40">None Scheduled</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{activeEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed project pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 shadow-lg bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-400">Projected Yield</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">${totalProjectedRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Expected gross from upcoming events</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Event Calendar & Roadmap</CardTitle>
          <CardDescription>Manage the community event schedule and logistics.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
            ) : events.length > 0 ? (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event.id} className={cn(
                            "group p-5 rounded-2xl border transition-all hover:border-primary/30 relative overflow-hidden",
                            event.status === 'Cancelled' ? 'bg-destructive/5 border-destructive/10' : 
                            event.status === 'Completed' ? 'bg-emerald-500/5 border-emerald-500/10' :
                            'bg-muted/10 border-white/5'
                        )}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className={cn(
                                            "font-bold text-xl",
                                            event.status === 'Completed' && "text-emerald-400 line-through opacity-60"
                                        )}>{event.title}</h3>
                                        <Badge variant={event.status === 'Scheduled' ? 'secondary' : (event.status === 'Completed' ? 'default' : 'destructive')}>
                                            {event.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                            {format(event.event_date, "PPP")}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                            {format(event.event_date, "p")}
                                        </div>
                                        <div className="flex items-center gap-1.5 font-bold text-emerald-500">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            ${Number(event.revenue).toLocaleString()} projected
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-4 italic line-clamp-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                        "{event.description}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {event.status === 'Scheduled' && (
                                        <div className="flex items-center gap-2 mr-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                            <Checkbox 
                                                id={`complete-${event.id}`} 
                                                onCheckedChange={(checked) => {
                                                    if (checked) handleComplete(event.id);
                                                }}
                                                className="h-5 w-5 border-emerald-500/50 data-[state=checked]:bg-emerald-500"
                                            />
                                            <label htmlFor={`complete-${event.id}`} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 cursor-pointer">
                                                Mark Completed
                                            </label>
                                        </div>
                                    )}

                                    <EventDialog event={event}>
                                        <Button variant="outline" size="sm" className="gap-2 border-primary/20">
                                            <Pencil className="h-4 w-4" /> Edit
                                        </Button>
                                    </EventDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {event.status === 'Scheduled' && (
                                                <>
                                                    <DropdownMenuItem onClick={() => handleComplete(event.id)} className="text-emerald-500">
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Event
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCancel(event.id)} className="text-orange-500">
                                                        <Ban className="mr-2 h-4 w-4" /> Cancel Event
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl">
                    <Calendar className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground font-medium">No events scheduled.</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Click the schedule button to start planning.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
