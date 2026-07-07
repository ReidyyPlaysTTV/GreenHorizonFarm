
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sprout, Wheat, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FarmersPortal() {
  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Farmers Portal</h1>
        <p className="text-muted-foreground mt-1 text-lg">Field operations and harvest tracking.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-primary" />
              <CardTitle>Active Plots</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for harvest in 2h</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <CardTitle>Irrigation Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className="bg-blue-500/20 text-blue-400 border-none">Optimal</Badge>
            <p className="text-xs text-muted-foreground mt-1">All pumps operational</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-500" />
              <CardTitle>Yield Goal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">84%</div>
            <p className="text-xs text-muted-foreground mt-1">Season progress</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Harvest Schedule</CardTitle>
          <CardDescription>Upcoming crop rotations and processing tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No active harvest alerts.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
