
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ReceiptText, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { RefreshButton } from "@/components/layout/refresh-button";
import { getDetailedOrders, getFarmEvents, getFarmTransactions, getBaseBalance } from "@/lib/actions";
import type { DetailedFarmOrder, FarmEvent, FarmTransaction } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AddExpenditureDialog } from "@/components/finances/add-expenditure-dialog";
import { MoneyOutDialog } from "@/components/finances/money-out-dialog";
import { EditBalanceDialog } from "@/components/finances/edit-balance-dialog";

export default function FinancesPortal() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [transactions, setTransactions] = useState<FarmTransaction[]>([]);
  const [baseBalance, setBaseBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [ordersData, eventsData, transData, baseBal] = await Promise.all([
            getDetailedOrders(),
            getFarmEvents(),
            getFarmTransactions(),
            getBaseBalance()
        ]);
        setOrders(ordersData);
        setEvents(eventsData.filter(e => e.status === 'Completed'));
        setTransactions(transData);
        setBaseBalance(baseBal);
    } catch (error) {
        console.error("Failed to fetch financial data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const financialStats = useMemo(() => {
    const totalOrderIncome = orders.reduce((acc, o) => acc + Number(o.total_price), 0);
    const totalEventIncome = events.reduce((acc, e) => acc + Number(e.revenue), 0);
    const manualIncome = transactions.filter(t => t.category === 'Income').reduce((acc, t) => acc + Number(t.amount), 0);
    
    const totalIncome = totalOrderIncome + totalEventIncome + manualIncome;

    const totalEmployeeCuts = orders.reduce((acc, o) => acc + Number(o.employee_cut_value), 0);
    const manualExpenses = transactions.filter(t => t.category === 'Expense' || t.category === 'Expenditure').reduce((acc, t) => acc + Number(t.amount), 0);
    
    const totalExpenses = totalEmployeeCuts + manualExpenses;
    
    const currentBalance = baseBalance + totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, currentBalance };
  }, [orders, events, transactions, baseBalance]);

  const ledger = useMemo(() => {
    const entries: { date: Date, desc: string, type: 'Income' | 'Expense', amount: number, cat: string }[] = [];

    // Orders
    orders.forEach(o => {
        entries.push({ date: o.created_at, desc: `Farm Order: ${o.business_name}`, type: 'Income', amount: Number(o.total_price), cat: 'Order' });
        entries.push({ date: o.created_at, desc: `Staff Cut: ${o.completed_by} (${o.business_name})`, type: 'Expense', amount: Number(o.employee_cut_value), cat: 'Staff Cut' });
    });

    // Events
    events.forEach(e => {
        entries.push({ date: e.event_date, desc: `Event: ${e.title}`, type: 'Income', amount: Number(e.revenue), cat: 'Event' });
    });

    // Manual Transactions
    transactions.forEach(t => {
        const isInc = t.category === 'Income';
        entries.push({ date: t.transaction_date, desc: t.description, type: isInc ? 'Income' : 'Expense', amount: Number(t.amount), cat: t.category });
    });

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders, events, transactions]);

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">Finances Portal</h1>
          <p className="text-muted-foreground mt-1 text-lg">Farm accounting and real-time bank ledger.</p>
        </div>
        <div className="flex items-center gap-3">
            <AddExpenditureDialog />
            <MoneyOutDialog />
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10 shadow-lg bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Current Balance</CardTitle>
            </div>
            {!loading && <EditBalanceDialog currentBalance={baseBalance} />}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-4xl font-black text-foreground">${financialStats.currentBalance.toLocaleString()}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Available operational capital</p>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-400">Total Income</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-black text-emerald-500">${financialStats.totalIncome.toLocaleString()}</div>
             )}
            <p className="text-[10px] text-muted-foreground mt-1">Gross lifetime revenue</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-destructive" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive">Total Expenses</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-black text-destructive">${financialStats.totalExpenses.toLocaleString()}</div>
             )}
            <p className="text-[10px] text-muted-foreground mt-1">Cuts + Bills + Manual Out</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Financial Ledger</CardTitle>
          <CardDescription>Consolidated transaction history for Green Horizon.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : ledger.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ledger.map((entry, i) => (
                        <TableRow key={i}>
                            <TableCell className="text-xs text-muted-foreground">{format(entry.date, 'MM/dd/yyyy')}</TableCell>
                            <TableCell className="font-medium">{entry.desc}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold">{entry.cat}</Badge>
                            </TableCell>
                            <TableCell className={entry.type === 'Income' ? 'text-right text-emerald-500 font-bold' : 'text-right text-destructive font-bold'}>
                                {entry.type === 'Income' ? '+' : '-'}${entry.amount.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-40 border border-dashed rounded-lg">
                <p className="text-muted-foreground font-medium">No transactions recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
