
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShoppingBasket, Plus, Trash2, CheckCircle2, Building2, Receipt, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getManagerData } from "@/lib/actions/manager-actions";
import { submitBusinessOrder } from "@/lib/actions/order-actions";
import { getBusinesses } from "@/lib/actions/business-actions";
import type { FarmProduct, Business } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const formSchema = z.object({
  selection_type: z.enum(["registered", "manual"]).default("registered"),
  business_name: z.string().min(1, "Company name is required."),
  items: z.array(z.object({
      product_id: z.string().min(1, "Select product"),
      product_name: z.string(),
      quantity: z.coerce.number().min(1, "Min quantity is 1"),
      price_at_sale: z.number()
  })).min(1, "Must add at least one item.")
});

export function BusinessOrderForm() {
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getManagerData().then(data => setProducts(data.farmProducts || []));
    getBusinesses().then(setBusinesses);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        selection_type: "registered",
        business_name: "", 
        items: [] 
    }
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const selectionType = useWatch({ control: form.control, name: "selection_type" });
  
  const estimatedTotal = useMemo(() => {
    return (watchedItems || []).reduce((acc, item) => {
        const q = Number(item.quantity) || 0;
        const p = Number(item.price_at_sale) || 0;
        return acc + (q * p);
    }, 0);
  }, [watchedItems]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const res = await submitBusinessOrder(values);
        if (res.success) {
            setIsSuccess(true);
            toast({ title: "Order Sent!", description: "Green Horizon staff will contact you shortly." });
        } else {
            toast({ variant: "destructive", title: "Transmission Failed", description: res.message });
        }
    } catch (e) {
        toast({ variant: "destructive", title: "System Error", description: "Could not transmit order to logistics network." });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isSuccess) {
      return (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 border-4 border-primary/20">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">ORDER TRANSMITTED</h2>
              <p className="text-muted-foreground max-w-sm mx-auto font-medium">Your supply request has been broadcast to our farmers. A staff member will reach out to fulfill your order soon.</p>
              <div className="pt-8">
                <Button variant="outline" onClick={() => window.location.href = '/'} className="h-12 px-8 rounded-xl font-bold border-primary/20 hover:bg-primary/10">
                    Return to Portal Entrance
                </Button>
              </div>
          </div>
      );
  }

  const hasValidationErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <div className="grid gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
            <div className="flex flex-col gap-6">
                <FormField
                    control={form.control}
                    name="selection_type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-primary">Selection Mode</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue('business_name', '');
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-12 bg-background/50 border-white/10">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="registered">Registered Partner Business</SelectItem>
                                    <SelectItem value="manual">Manual Entry / New Client</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                {selectionType === 'registered' ? (
                    <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                    <Building2 className="h-4 w-4" /> Partner List
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 bg-background/50 border-white/10">
                                            <SelectValue placeholder="Select your company" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {businesses.map(b => (
                                            <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                    <Building2 className="h-4 w-4" /> Manual Business Name
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your company name..." {...field} className="h-12 bg-background/50 border-white/10" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShoppingBasket className="h-4 w-4" />
                    Product Requisition
                </h3>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-9 rounded-xl border-primary/20 hover:bg-primary/10" 
                    onClick={() => append({ product_id: "", product_name: "", quantity: 1, price_at_sale: 0 })}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Supply Item
                </Button>
            </div>
            
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-center bg-white/5 p-5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-1">
                            <FormField
                                control={form.control}
                                name={`items.${index}.product_id`}
                                render={({ field: selectField }) => (
                                    <FormItem className="space-y-0">
                                        <Select onValueChange={(val) => {
                                            const p = products.find(x => x.id === val);
                                            if (p) {
                                                selectField.onChange(val);
                                                form.setValue(`items.${index}.product_id`, p.id);
                                                form.setValue(`items.${index}.product_name`, p.name);
                                                form.setValue(`items.${index}.price_at_sale`, Number(p.price));
                                            }
                                        }} value={selectField.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-transparent border-white/10 h-11">
                                                    <SelectValue placeholder="Select Supply" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-28">
                            <Input 
                                type="number" 
                                placeholder="Qty" 
                                {...form.register(`items.${index}.quantity`)} 
                                className="h-11 bg-background/30 text-center font-bold"
                            />
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 h-11 w-11 rounded-xl" 
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-[2rem] opacity-20 bg-white/5">
                        <p className="text-xs font-black uppercase tracking-[0.3em]">REQUISITION CART EMPTY</p>
                    </div>
                )}
            </div>
        </div>

        <div className="p-8 bg-primary/10 rounded-[2rem] border border-primary/20 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Receipt className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estimated Requisition Total</p>
                    <p className="text-4xl font-black text-primary tracking-tighter">${estimatedTotal.toLocaleString()}</p>
                </div>
            </div>
            <div className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 max-w-[180px] leading-relaxed">
                Billing finalized upon secure delivery by GH Logistics.
            </div>
        </div>

        {hasValidationErrors && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-in slide-in-from-bottom-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Order Incomplete</AlertTitle>
                <AlertDescription className="text-xs font-bold uppercase">
                    Please ensure you have selected a business and added products with valid quantities to all rows.
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-4">
            <Alert className="bg-primary/5 border-primary/20 rounded-2xl py-4">
                <ShoppingBasket className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-black uppercase tracking-widest text-primary">Pricing Policy</AlertTitle>
                <AlertDescription className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    All prices are reference rates. High volume corporate orders may be eligible for significant management discounts. 
                    Standard delivery fees are calculated upon arrival at the requisition point.
                </AlertDescription>
            </Alert>

            <Alert variant="warning" className="border-orange-500/20 bg-orange-500/5 rounded-2xl py-4">
                <Clock className="h-4 w-4 text-orange-500" />
                <AlertTitle className="text-xs font-black uppercase tracking-widest text-orange-500">Logistics Response Window</AlertTitle>
                <AlertDescription className="text-[10px] text-orange-200/60 font-medium leading-relaxed">
                    If an order has not been claimed or fulfilled within **3 hours**, it indicates a capacity limit in our current network. 
                    Please monitor the Roster status if delay persists.
                </AlertDescription>
            </Alert>
        </div>

        <Button 
            type="submit" 
            disabled={isSubmitting || (watchedItems || []).length === 0} 
            className="w-full h-20 rounded-[2rem] text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group"
        >
            {isSubmitting ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    TRANSMITTING REQUISITION...
                </div>
            ) : (
                "TRANSMIT SUPPLY REQUEST"
            )}
        </Button>
      </form>
    </Form>
  );
}
