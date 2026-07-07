
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, Users, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManagerPortal() {
  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Manager Portal</h1>
        <p className="text-muted-foreground mt-1 text-lg">Operations oversight and staff management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Staff Active</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-1">Currently on duty</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <CardTitle>Task Completion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">14/20</div>
            <p className="text-xs text-muted-foreground mt-1">Daily goals</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <CardTitle>Efficiency</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">94%</div>
            <p className="text-xs text-muted-foreground mt-1">Ops rating</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Division Oversight</CardTitle>
          <CardDescription>Review performance metrics across all farm divisions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {["Harvesting", "Processing", "Logistics", "Sales"].map(div => (
              <div key={div} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <span className="font-bold">{div}</span>
                <Badge variant="outline" className="border-primary/20">Performing Well</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
