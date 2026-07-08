
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, ShoppingCart, Trash2, Tag, Percent, Users, UserPlus, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitDetailedOrder, getPersonnel, getBusinesses } from "@/lib/actions";
import { getManagerData } from "@/lib/actions/manager-actions";
import type { FarmProduct, Personnel, BusinessOrder, Business } from "@/lib/types";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  business_name: z.string().min(1, "Client name is required."),
  items: z.array(z.object({
      product_id: z.string().min(1, "Select a product"),
      product_name: z.string(),
      quantity: z.coerce.number().min(1),
      price_at_sale: z.coerce.number().min(0),
  })).min(1, "At least one item must be added."),
  discount_amount: z.coerce.number().min(0).max(100, "Discount cannot exceed 100%"),
  total_price: z.coerce.number().min(0),
  logistics_used: z.boolean().default(false),
  employee_cut_value: z.coerce.number().min(0),
  employee_cut_percentage: z.coerce.number().min(0).max(100),
  collaborators: z.array(z.string()).default([]),
});

interface AddOrderFormProps {
    businessOrder?: BusinessOrder;
}

export function AddOrderForm({ businessOrder }: AddOrderFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [roster, setRoster] = useState<Personnel[]>([]);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
    if (isOpen || businessOrder) {
        getManagerData().then(data => setProducts(data.farmProducts));
        getPersonnel().then(setRoster);
        getBusinesses().then(setBusinesses);
    }
  }, [isOpen, businessOrder]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: businessOrder?.business_name || "Local Farmer",
      items: businessOrder?.items || [],
      discount_amount: 0,
      total_price: 0,
      logistics_used: false,
      employee_cut_value: 0,
      employee_cut_percentage: 60, // Business 40, Employee 60
      collaborators: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Use deep watching for real-time calculations
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedDiscount = useWatch({ control: form.control, name: "discount_amount" });
  const watchedCutPercentage = useWatch({ control: form.control, name: "employee_cut_percentage" });
  const watchedCollaborators = useWatch({ control: form.control, name: "collaborators" });
  const watchedBusiness = useWatch({ control: form.control, name: "business_name" });
  const watchedTotalPrice = useWatch({ control: form.control, name: "total_price" });

  const selectedBusinessData = useMemo(() => 
    businesses.find(b => b.name === watchedBusiness)
  , [businesses, watchedBusiness]);

  const subtotal = useMemo(() => {
    return (watchedItems || []).reduce((acc, item) => {
        const q = Number(item.quantity) || 0;
        const p = Number(item.price_at_sale) || 0;
        return acc + (q * p);
    }, 0);
  }, [watchedItems]);

  const suggestedTotal = useMemo(() => {
      const discountPercentage = Number(watchedDiscount) || 0;
      const discountDecimal = discountPercentage / 100;
      return Math.max(0, subtotal * (1 - discountDecimal));
  }, [subtotal, watchedDiscount]);

  useEffect(() => {
    form.setValue("total_price", Number(suggestedTotal.toFixed(2)));
  }, [suggestedTotal, form]);

  useEffect(() => {
    const cut = (Number(watchedTotalPrice) * (Number(watchedCutPercentage) || 0)) / 100;
    form.setValue("employee_cut_value", Number(cut.toFixed(2)));
  }, [watchedCutPercentage, watchedTotalPrice, form]);

  const totalWorkers = (watchedCollaborators || []).length + 1;
  const cutPerPerson = (Number(form.getValues("employee_cut_value")) || 0) / totalWorkers;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await submitDetailedOrder({ 
        ...values, 
        items_sold: values.items,
        user: currentUser,
        businessOrderId: businessOrder?.id
    });
    if (result.success) {
      toast({ title: "Order Submitted", description: "Ledger updated with worker splits." });
      setIsOpen(false);
      form.reset();
    } else {
       toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen || !!businessOrder} onOpenChange={(v) => !businessOrder && setIsOpen(v)}>
      <DialogTrigger asChild>
        {!businessOrder && (
            <Button size="lg" className="gap-2 h-16 text-lg font-bold rounded-2xl">
                <PlusCircle className="h-6 w-6" />
                Record Personal Sale
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            {businessOrder ? `Fulfilling Order: ${businessOrder.business_name}` : 'Submit New Order'}
          </DialogTitle>
          <DialogDescription>
            {businessOrder ? 'Process this pending business request.' : 'Record a farm sale and split commission with partners.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Order Details */}
                <div className="space-y-6">
                    <div className="grid gap-4">
                        <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Client Selection</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Local Farmer">Local Farmer (Public)</SelectItem>
                                    {businesses.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                                    <SelectItem value="Manual Entry">Manual Entry / Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {watchedBusiness === 'Manual Entry' && (
                            <FormField
                                control={form.control}
                                name="business_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl><Input placeholder="Enter client name..." onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {selectedBusinessData && (
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Partner Billing Info</p>
                                    <p className="text-sm font-bold text-primary">Account: {selectedBusinessData.bank_account || 'NONE ON FILE'}</p>
                                </div>
                                <Badge variant="outline" className="text-[9px]">REGISTERED</Badge>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground">Order Items</FormLabel>
                            <Button type="button" variant="ghost" size="sm" onClick={() => append({ product_id: "", product_name: "", quantity: 1, price_at_sale: 0 })}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Add
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-center bg-muted/20 p-3 rounded-xl border border-white/5">
                                    <div className="flex-1">
                                        <Select 
                                            onValueChange={(val) => {
                                                const prod = products.find(p => p.id === val);
                                                if (prod) {
                                                    form.setValue(`items.${index}.product_id`, prod.id);
                                                    form.setValue(`items.${index}.product_name`, prod.name);
                                                    form.setValue(`items.${index}.price_at_sale`, prod.price);
                                                }
                                            }}
                                            defaultValue={field.product_id}
                                        >
                                            <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input className="w-16 h-8 text-center text-xs" type="number" {...form.register(`items.${index}.quantity`)} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Staff Splits */}
                <div className="space-y-6 border-l border-white/5 pl-8">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <FormLabel className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Users className="h-4 w-4" /> Personnel Involved
                            </FormLabel>
                            <Badge variant="secondary" className="bg-primary/20 text-primary">{totalWorkers} Staff</Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                                <span className="text-xs font-bold">{currentUser} (Lead)</span>
                                <Badge variant="outline" className="text-[9px]">OWNER</Badge>
                            </div>
                            
                            {(watchedCollaborators || []).map((name, i) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-white/5 flex items-center justify-between">
                                    <span className="text-xs">{name}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                                        const newCollabs = watchedCollaborators.filter((_, idx) => idx !== i);
                                        form.setValue('collaborators', newCollabs);
                                    }}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            ))}

                            <div className="pt-2">
                                <Select onValueChange={(val) => {
                                    if (val && !watchedCollaborators?.includes(val) && val !== currentUser) {
                                        form.setValue('collaborators', [...(watchedCollaborators || []), val]);
                                    }
                                }}>
                                    <SelectTrigger className="h-9 text-xs border-dashed">
                                        <div className="flex items-center gap-2"><UserPlus className="h-3.5 w-3.5" /> <span>Add Worker to Order</span></div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roster.filter(p => p.name !== currentUser).map(p => <SelectItem key={p.id} value={p.name}>{p.name} ({p.rank})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-muted-foreground uppercase">Commission Structure</span>
                            <span className="font-black text-emerald-500">60% STAFF SPLIT</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-black/20 rounded-xl">
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Staff Pool</p>
                                <p className="text-lg font-black text-emerald-500">${(Number(form.watch('employee_cut_value')) || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-3 bg-black/20 rounded-xl">
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Per Person</p>
                                <p className="text-lg font-black text-emerald-500">${cutPerPerson.toFixed(2)}</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-center text-muted-foreground italic">Business receives 40% (${(suggestedTotal * 0.4).toLocaleString()}) automatically.</p>
                    </div>
                </div>
            </div>

            <div className="bg-muted/10 p-6 rounded-3xl space-y-6 border border-white/5">
                <div className="grid grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="discount_amount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-orange-500" />
                                Applied Discount (%)
                            </FormLabel>
                            <FormControl><Input type="number" step="1" min="0" max="100" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="total_price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-black text-primary">Final Customer Total ($)</FormLabel>
                            <FormControl><Input className="text-2xl h-12 font-black border-primary/30" type="number" step="0.01" {...field} /></FormControl>
                            <FormDescription className="text-[10px]">Reference Subtotal: ${subtotal.toLocaleString()}</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            <DialogFooter className="pt-4 gap-4">
              <Button type="button" variant="outline" onClick={() => {
                  if(businessOrder) window.location.reload(); // Quick fix for managed close
                  setIsOpen(false);
              }}>Cancel</Button>
              <Button type="submit" disabled={isLoading || fields.length === 0} className="bg-primary hover:bg-primary/90 font-black h-12 px-12 rounded-xl text-lg">
                {isLoading ? <Loader2 className="animate-spin" /> : "Complete Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
