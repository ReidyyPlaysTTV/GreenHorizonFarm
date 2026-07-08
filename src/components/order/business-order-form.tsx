
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShoppingBasket, Plus, Trash2, CheckCircle2, Building2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getManagerData } from "@/lib/actions/manager-actions";
import { submitBusinessOrder } from "@/lib/actions/order-actions";
import type { FarmProduct } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const formSchema = z.object({
  business_name: z.string().min(1, "Company name is required."),
  contact_info: z.string().min(1, "Discord or Phone number is required."),
  items: z.array(z.object({
      product_id: z.string().min(1, "Select product"),
      product_name: z.string(),
      quantity: z.coerce.number().min(1),
      price_at_sale: z.number()
  })).min(1, "Must add at least one item.")
});

export function BusinessOrderForm() {
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getManagerData().then(data => setProducts(data.farmProducts));
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { business_name: "", contact_info: "", items: [] }
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const res = await submitBusinessOrder(values);
    if (res.success) {
        setIsSuccess(true);
        toast({ title: "Order Sent!", description: "Green Horizon staff will contact you shortly." });
    } else {
        toast({ variant: "destructive", title: "Error", description: res.message });
    }
    setIsSubmitting(false);
  }

  if (isSuccess) {
      return (
          <div className="text-center space-y-6 py-12">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-white">Order Received!</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Your supply request has been broadcast to our farmers. We will reach out to fulfill your order soon.</p>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="mt-8">Return Home</Button>
          </div>
      );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="business_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Company Name</FormLabel>
                <FormControl><Input placeholder="e.g. Galaxy Nightclub" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="contact_info"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Detail (Phone/Discord)</FormLabel>
                <FormControl><Input placeholder="How can we reach you?" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Product Requisition</h3>
                <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl" onClick={() => append({ product_id: "", product_name: "", quantity: 1, price_at_sale: 0 })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Product
                </Button>
            </div>
            
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5 animate-in fade-in zoom-in duration-300">
                        <div className="flex-1">
                            <Select onValueChange={(val) => {
                                const p = products.find(x => x.id === val);
                                if (p) {
                                    form.setValue(`items.${index}.product_id`, p.id);
                                    form.setValue(`items.${index}.product_name`, p.name);
                                    form.setValue(`items.${index}.price_at_sale`, p.price);
                                }
                            }}>
                                <FormControl><SelectTrigger className="bg-transparent"><SelectValue placeholder="Select Supply" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-24">
                            <Input type="number" placeholder="Qty" {...form.register(`items.${index}.quantity`)} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Cart is Empty</p>
                    </div>
                )}
            </div>
        </div>

        <Alert className="bg-primary/5 border-primary/20">
            <ShoppingBasket className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-black uppercase tracking-widest">Supply Notice</AlertTitle>
            <AlertDescription className="text-[10px] text-muted-foreground">
                Prices shown are reference rates. High volume orders may be eligible for management discounts. Logistics delivery fees will be calculated upon contact.
            </AlertDescription>
        </Alert>

        <Button type="submit" disabled={isSubmitting || fields.length === 0} className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Transmit Supply Request"}
        </Button>
      </form>
    </Form>
  );
}
