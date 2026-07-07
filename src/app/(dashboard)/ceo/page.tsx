
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, TrendingUp, Target, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CEOPortal() {
  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8 text-primary-foreground bg-primary/5 rounded-3xl border border-primary/10 m-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-primary">CEO Executive Portal</h1>
          <p className="text-muted-foreground mt-2 text-xl font-medium">Strategic control and high-level business oversight.</p>
        </div>
        <ShieldCheck className="h-16 w-16 text-primary opacity-20" />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">Business Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">$1,240,000</div>
            <Badge className="mt-2 bg-emerald-500/20 text-emerald-400">+12% Year Over Year</Badge>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">Market Dominance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">Level 4</div>
            <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-wider">Top Tier Producer</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">Strategic Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">3/4</div>
            <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-wider">Quarterly milestones met</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Division Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border border-dashed rounded-xl">
             <p className="text-muted-foreground font-medium">High-level analytics processing...</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Executive Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-muted/40 rounded-xl border-l-4 border-primary">
                <p className="font-bold text-sm">Expansion Phase 3</p>
                <p className="text-xs text-muted-foreground mt-1">Acquisition of north-side processing facility.</p>
             </div>
             <div className="p-4 bg-muted/40 rounded-xl border-l-4 border-muted">
                <p className="font-bold text-sm">Supply Chain Optimization</p>
                <p className="text-xs text-muted-foreground mt-1">Refining logistics for better delivery times.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
