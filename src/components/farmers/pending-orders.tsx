
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Phone, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { getPendingBusinessOrders } from "@/lib/actions/order-actions";
import type { BusinessOrder } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";
import { AddOrderForm } from "./add-order-form";

export function PendingOrders() {
    const [orders, setOrders] = useState<BusinessOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        const data = await getPendingBusinessOrders();
        setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    Pending Business Requests
                </h2>
                <Badge variant="outline" className="font-bold">{orders.length} ACTIVE</Badge>
            </div>

            {orders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map((order) => (
                        <Card key={order.id} className="border-primary/10 bg-card/40 backdrop-blur-sm group hover:border-primary/40 transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(order.created_at, { addSuffix: true })}
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px]">PENDING</Badge>
                                </div>
                                <CardTitle className="text-xl font-black tracking-tight">{order.business_name}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5 text-[10px] font-bold">
                                    <Phone className="h-3 w-3" /> {order.contact_info}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg text-xs">
                                            <span className="font-bold">{item.product_name}</span>
                                            <span className="text-primary font-black">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <AddOrderForm businessOrder={order}>
                                    <Button className="w-full h-10 font-bold gap-2 group">
                                        Claim & Fulfill Order
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </AddOrderForm>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl opacity-40 grayscale grayscale-100">
                    <Package className="h-12 w-12 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">No Pending Requests</p>
                </div>
            )}
        </div>
    );
}
