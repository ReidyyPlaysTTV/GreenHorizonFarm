
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ReceiptText, ArrowUpCircle, ArrowDownCircle, Loader2, Users, Phone, CreditCard, Wallet, Receipt } from "lucide-react";
import { RefreshButton } from "@/components/layout/refresh-button";
import { getDetailedOrders, getFarmEvents, getFarmTransactions, getBaseBalance, getPayrollSummary } from "@/lib/actions";
import type { DetailedFarmOrder, FarmEvent, FarmTransaction } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AddExpenditureDialog } from "@/components/finances/add-expenditure-dialog";
import { MoneyOutDialog } from "@/components/finances/money-out-dialog";
import { EditBalanceDialog } from "@/components/finances/edit-balance-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FinancesPortal() {
  const [orders, setOrders] = useState<DetailedFarmOrder[]>([]);
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [transactions, setTransactions] = useState<FarmTransaction[]>([]);
  const [payroll, setPayroll] = useState<{name: string, earned: number, phone: string, bank: string, rank: string}[]>([]);
  const [baseBalance, setBaseBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [ordersData, eventsData, transData, baseBal, payrollData] = await Promise.all([
            getDetailedOrders(),
            getFarmEvents(),
            getFarmTransactions(),
            getBaseBalance(),
            getPayrollSummary()
        ]);
        setOrders(ordersData);
        setEvents(eventsData.filter(e => e.status === 'Completed'));
        setTransactions(transData);
        setBaseBalance(baseBal);
        setPayroll(payrollData);
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
          <h1 className="text-5xl font-black tracking-tighter text-primary">Accounting Node</h1>
          <p className="text-muted-foreground mt-1 text-xl font-medium">Global ledger and staff payout coordination.</p>
        </div>
        <div className="flex items-center gap-3">
            <AddExpenditureDialog />
            <MoneyOutDialog />
            <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Liquidity</CardTitle>
            </div>
            {!loading && <EditBalanceDialog currentBalance={baseBalance} />}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-32" /> : (
                <div className="text-4xl font-black text-foreground tabular-nums">${financialStats.currentBalance.toLocaleString()}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Available Reserve</p>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-400">Total Yield</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-10 w-32" /> : (
                <div className="text-3xl font-black text-emerald-500 tabular-nums">${financialStats.totalIncome.toLocaleString()}</div>
             )}
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Gross Revenue</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-destructive" />
              <CardTitle className="text-xs font-black uppercase tracking-widest text-destructive">Accumulated Debt</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-10 w-32" /> : (
                <div className="text-3xl font-black text-destructive tabular-nums">${financialStats.totalExpenses.toLocaleString()}</div>
             )}
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Staff Cuts + Bills</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger" className="space-y-6">
        <TabsList className="bg-muted/20 border border-white/5 h-12 p-1 rounded-2xl">
            <TabsTrigger value="ledger" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">Consolidated Ledger</TabsTrigger>
            <TabsTrigger value="payroll" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">Staff Payroll Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-primary" />
                        Operation & Expense Stream
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                    </div>
                ) : ledger.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow>
                                <TableHead className="py-4 font-black uppercase text-[10px]">Timestamp</TableHead>
                                <TableHead className="py-4 font-black uppercase text-[10px]">Description</TableHead>
                                <TableHead className="py-4 font-black uppercase text-[10px]">Category</TableHead>
                                <TableHead className="py-4 font-black uppercase text-[10px] text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ledger.map((entry, i) => (
                                <TableRow key={i} className="hover:bg-white/5 border-white/5 transition-colors">
                                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">{format(entry.date, 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="font-bold text-sm tracking-tight">{entry.desc}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[9px] uppercase font-black px-2 py-0.5 border-white/10">
                                            {entry.cat}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={entry.type === 'Income' ? 'text-right text-emerald-500 font-black' : 'text-right text-red-500 font-black'}>
                                        {entry.type === 'Income' ? '+' : '-'}${entry.amount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex items-center justify-center h-60 border-2 border-dashed rounded-3xl opacity-20 mx-8 my-8">
                        <p className="text-sm font-black uppercase tracking-[0.3em]">No Financial Footprint Found</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="payroll">
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <Users className="h-4 w-4 text-primary" />
                        Staff Disbursement Registry
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/60">Calculated earnings and contact credentials for active personnel.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="max-h-[600px]">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow>
                                    <TableHead className="py-4 font-black uppercase text-[10px]">Personnel Name</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px]">Contact Info</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px]">Payroll Bank Account</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px] text-right">Accumulated Shares</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.map((staff, i) => (
                                    <TableRow key={i} className="hover:bg-white/5 border-white/5 group transition-all">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-black text-lg tracking-tight text-white">{staff.name}</span>
                                                <span className="text-[9px] font-black uppercase text-primary/60">{staff.rank}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400/80">
                                                <Phone className="h-3 w-3" />
                                                {staff.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-black/20 p-2 rounded-lg border border-white/5 w-fit">
                                                <CreditCard className="h-3 w-3 text-emerald-500/50" />
                                                {staff.bank}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl font-black text-emerald-500 tracking-tighter">${Math.floor(staff.earned).toLocaleString()}</span>
                                                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">Gross Since Roster Joining</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payroll.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic">No staff earnings detected yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
