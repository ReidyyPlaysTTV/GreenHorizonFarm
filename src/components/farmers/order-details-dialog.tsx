
"use client";

import { useState } from "react";
import type { DetailedFarmOrder } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getProductEmoji } from "@/lib/order-utils";
import { format } from "date-fns";
import { User, Phone, CreditCard, Building2, ClipboardList, Receipt, Users, ShieldCheck, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markPayoutAsPaid } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderDetailsDialogProps {
  order: DetailedFarmOrder;
  children: React.ReactNode;
}

export function OrderDetailsDialog({ order, children }: OrderDetailsDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const companyShare = Number(order.total_price) - Number(order.employee_cut_value);

  const handlePay = async (payoutId: string) => {
    setIsProcessing(prev => ({ ...prev, [payoutId]: true }));
    const user = localStorage.getItem('loggedInUser') || "System";
    const res = await markPayoutAsPaid(payoutId, user);
    if (res.success) {
        toast({ title: "Payout Processed", description: "Ledger updated and member marked as paid." });
    }
    setIsProcessing(prev => ({ ...prev, [payoutId]: false }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-card border-white/5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter">Operation Manifest</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Record ID: {order.id}
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Section 1: Client & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <Building2 className="h-3 w-3" /> Requisition Client
                </Label>
                <p className="text-xl font-black">{order.business_name}</p>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] uppercase font-black">
                    {order.status}
                </Badge>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-right">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center justify-end gap-2">
                    <Clock className="h-3 w-3" /> Fulfilled On
                </Label>
                <p className="text-xl font-black">
                    {order.completed_at ? format(new Date(order.completed_at), 'HH:mm') : '---'}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {order.completed_at ? format(new Date(order.completed_at), 'MMMM dd, yyyy') : 'No Date'}
                </p>
            </div>
          </div>

          {/* Section 2: Full Team Disbursement Registry */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Personnel Disbursement Registry
            </h3>
            <div className="rounded-2xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase">Staff Member</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Credentials</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Share Owed</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.payouts?.map((payout) => (
                            <TableRow key={payout.id} className="bg-black/20 hover:bg-white/5">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm">{payout.personnel_name}</span>
                                        <span className="text-[9px] uppercase font-bold text-primary/60">
                                            {payout.personnel_name === order.completed_by ? 'Lead Farmer' : 'Collaborator'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
                                            <Phone className="h-2.5 w-2.5" /> {payout.phone || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                            <CreditCard className="h-2.5 w-2.5" /> {payout.bank || 'N/A'}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-emerald-500">${Number(payout.amount).toLocaleString()}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {payout.status === 'Paid' ? (
                                        <Badge className="bg-emerald-600 text-[8px] font-black uppercase py-1">PAID</Badge>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            onClick={() => handlePay(payout.id)}
                                            disabled={isProcessing[payout.id]}
                                            className="h-7 text-[8px] font-black uppercase bg-primary hover:bg-primary/90"
                                        >
                                            {isProcessing[payout.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            Pay Now
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             {/* Section 3: Financial Summary */}
            <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Ledger Summary
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Gross Yield</p>
                        <p className="text-2xl font-black tracking-tighter text-white">${Number(order.total_price).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-orange-400 uppercase mb-1">GH Treasury</p>
                        <p className="text-2xl font-black tracking-tighter text-orange-400">${companyShare.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Section 4: Supply manifest */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Harvest Manifest
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {order.items_sold.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{getProductEmoji(item.product_name)}</span>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">{item.product_name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-emerald-500">${(item.price_at_sale * item.quantity).toLocaleString()}</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase">Unit: ${item.price_at_sale}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
