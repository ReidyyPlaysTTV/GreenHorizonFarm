
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Eye, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecurityPortal() {
  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Security Portal</h1>
        <p className="text-muted-foreground mt-1 text-lg">Farm perimeter and asset protection.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>Surveillance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">Active</div>
            <p className="text-xs text-muted-foreground mt-1">8/8 Cameras Online</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Gate Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-primary border-primary/20">Closed & Locked</Badge>
            <p className="text-xs text-muted-foreground mt-1">Main Entrance Secured</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Incident Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">0</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Visitor Logs</CardTitle>
          <CardDescription>Records of all personnel and vehicles entering farm grounds.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No recent visitors logged.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
