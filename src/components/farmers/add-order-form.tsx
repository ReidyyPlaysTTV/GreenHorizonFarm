
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, ShoppingCart, Trash2, Tag, Percent } from "lucide-react";
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
import { submitDetailedOrder } from "@/lib/actions";
import { getManagerData } from "@/lib/actions/manager-actions";
import type { FarmProduct } from "@/lib/types";

const formSchema = z.object({
  business_name: z.string().min(1, "Business name is required."),
  items: z.array(z.object({
      product_id: z.string().min(1, "Select a product"),
      product_name: z.string(),
      quantity: z.coerce.number().min(1),
      price_at_sale: z.coerce.number().min(0),
  })).min(1, "At least one item must be added."),
  discount_amount: z.coerce.number().min(0),
  total_price: z.coerce.number().min(0),
  logistics_used: z.boolean().default(false),
  employee_cut_value: z.coerce.number().min(0),
  employee_cut_percentage: z.coerce.number().min(0).max(100),
});

export function AddOrderForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
    if (isOpen) {
        getManagerData().then(data => setProducts(data.farmProducts));
    }
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: "",
      items: [],
      discount_amount: 0,
      total_price: 0,
      logistics_used: false,
      employee_cut_value: 0,
      employee_cut_percentage: 15, // Default 15% cut
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount_amount");
  const watchedCutPercentage = form.watch("employee_cut_percentage");

  // Calculate suggested totals
  const subtotal = useMemo(() => {
    return (watchedItems || []).reduce((acc, item) => acc + (item.quantity * item.price_at_sale), 0);
  }, [watchedItems]);

  const suggestedTotal = Math.max(0, subtotal - (watchedDiscount || 0));

  useEffect(() => {
    form.setValue("total_price", suggestedTotal);
  }, [suggestedTotal, form]);

  useEffect(() => {
    const total = form.getValues("total_price");
    const cut = (total * (watchedCutPercentage || 0)) / 100;
    form.setValue("employee_cut_value", Number(cut.toFixed(2)));
  }, [watchedCutPercentage, form.watch("total_price"), form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await submitDetailedOrder({ 
        ...values, 
        items_sold: values.items,
        user: currentUser 
    });
    if (result.success) {
      toast({
        title: "Order Submitted",
        description: "Your farm order has been recorded successfully.",
      });
      setIsOpen(false);
      form.reset();
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 h-16 text-lg font-bold rounded-2xl">
          <PlusCircle className="h-6 w-6" />
          Submit Completed Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            New Order Completion
          </DialogTitle>
          <DialogDescription>
            Select products from the catalog, add quantities, and record the sale.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client / Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vanilla Unicorn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <FormLabel className="text-lg">Items Sold</FormLabel>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => append({ product_id: "", product_name: "", quantity: 1, price_at_sale: 0 })}
                    >
                        <PlusCircle className="h-4 w-4" /> Add Product
                    </Button>
                </div>
                
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end bg-muted/20 p-4 rounded-xl border border-white/5">
                        <div className="flex-1 space-y-2">
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Product</FormLabel>
                            <Select 
                                onValueChange={(val) => {
                                    const prod = products.find(p => p.id === val);
                                    if (prod) {
                                        form.setValue(`items.${index}.product_id`, prod.id);
                                        form.setValue(`items.${index}.product_name`, prod.name);
                                        form.setValue(`items.${index}.price_at_sale`, prod.price);
                                    }
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-24 space-y-2">
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Qty</FormLabel>
                            <FormControl>
                                <Input type="number" {...form.register(`items.${index}.quantity`)} />
                            </FormControl>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {fields.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">No items added to this order yet.</p>}
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl space-y-6 border border-primary/10">
                <div className="grid grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="discount_amount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-primary" />
                                Business Discount ($)
                            </FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormDescription className="text-[10px]">Large order or loyalty discount.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="total_price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-black text-primary">Final Order Total ($)</FormLabel>
                            <FormControl><Input className="text-lg font-bold border-primary/30" type="number" step="0.01" {...field} /></FormControl>
                            <FormDescription className="text-[10px]">Suggested: ${suggestedTotal.toLocaleString()}</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-4">
                    <FormField
                        control={form.control}
                        name="employee_cut_percentage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-emerald-400" />
                                Employee Cut (%)
                            </FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="employee_cut_value"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cut Value ($)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} disabled /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="logistics_used"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-background/50">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Logistics / Transport Used?</FormLabel>
                            <FormDescription className="text-[10px]">
                                Check this if farm transport was used for delivery.
                            </FormDescription>
                        </div>
                        </FormItem>
                    )}
                />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading || fields.length === 0} className="bg-primary hover:bg-primary/90 font-bold h-12 px-8">
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Record Farm Order"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
