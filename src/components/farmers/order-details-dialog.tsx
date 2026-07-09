"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, CreditCard, Building2, ClipboardList, Receipt, Users, ShieldCheck, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface OrderDetailsDialogProps {
  order: DetailedFarmOrder;
  children: React.ReactNode;
}

export function OrderDetailsDialog({ order, children }: OrderDetailsDialogProps) {
  const leadInfo = (order as any).lead_info || {};
  const team = [order.completed_by, ...(order.collaborators || [])];
  const totalWorkers = team.length;
  const cutPerPerson = Number(order.employee_cut_value) / totalWorkers;
  const companyShare = Number(order.total_price) - Number(order.employee_cut_value);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-white/5 max-h-[90vh] overflow-y-auto">
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

          {/* Section 2: Financial Breakdown */}
          <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Financial Ledger
                </h3>
                <div className="text-[10px] font-black text-muted-foreground uppercase bg-white/5 px-3 py-1 rounded-full">
                    {order.employee_cut_percentage}% Staff Cut Applied
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-6">
                <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Gross Yield</p>
                    <p className="text-3xl font-black tracking-tighter text-white">${Number(order.total_price).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Staff Pool</p>
                    <p className="text-3xl font-black tracking-tighter text-emerald-500">${Number(order.employee_cut_value).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-orange-400 uppercase mb-1">GH Treasury</p>
                    <p className="text-3xl font-black tracking-tighter text-orange-400">${companyShare.toLocaleString()}</p>
                </div>
             </div>

             <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Individual Payout ({totalWorkers} ways)</span>
                </div>
                <span className="text-emerald-400 font-black text-lg tracking-tighter">${cutPerPerson.toLocaleString()}</span>
             </div>
          </div>

          {/* Section 3: Lead Farmer Dossier */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Lead Personnel Dossier
            </h3>
            <div className="p-5 rounded-3xl bg-muted/20 border border-white/5 flex items-center gap-6">
                <Avatar className="h-16 w-14 rounded-2xl ring-2 ring-primary/20">
                    <AvatarImage src={leadInfo.avatar} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">{order.completed_by[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase text-primary mb-1">Full Name</p>
                        <p className="text-lg font-black tracking-tight">{order.completed_by}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Support Team</p>
                        <p className="text-xs font-bold text-muted-foreground">
                            {order.collaborators.length > 0 ? order.collaborators.join(', ') : 'No Collaborators'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                        <Phone className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-mono">{leadInfo.phone || 'NO PHONE'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-mono">{leadInfo.bank || 'NO ACCOUNT'}</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Section 4: Supply manifest */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Harvest Manifest
            </h3>
            <div className="grid grid-cols-2 gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
