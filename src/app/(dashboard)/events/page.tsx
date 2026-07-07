
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, PartyPopper, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EventsPortal() {
  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Events Portal</h1>
        <p className="text-muted-foreground mt-1 text-lg">Community engagement and market events.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Next Event</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">Farmers Market</div>
            <p className="text-xs text-muted-foreground mt-1">Saturday, 10:00 AM</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              <CardTitle>Planning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">3 Projects</Badge>
            <p className="text-xs text-muted-foreground mt-1">In design phase</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <CardTitle>Supplies</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">92%</div>
            <p className="text-xs text-muted-foreground mt-1">Inventory check</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Event Calendar</CardTitle>
          <CardDescription>Manage the community event schedule and logistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No upcoming events scheduled.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
