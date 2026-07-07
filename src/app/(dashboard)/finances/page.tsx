
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FinancesPortal() {
  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Finances Portal</h1>
        <p className="text-muted-foreground mt-1 text-lg">Farm accounting and ledger management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">$142,500</div>
            <p className="text-xs text-muted-foreground mt-1">Available capital</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              <CardTitle>Expenses</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">$12,400</div>
            <p className="text-xs text-muted-foreground mt-1">Trailing 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <CardTitle>Profit Margin</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">22%</div>
            <p className="text-xs text-muted-foreground mt-1">+4% from last quarter</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Financial Ledger</CardTitle>
          <CardDescription>Detailed transaction history for the Green Horizon farm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No recent transactions recorded.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
