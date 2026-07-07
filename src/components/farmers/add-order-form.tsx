
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, ShoppingCart } from "lucide-react";
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
import { submitDetailedOrder } from "@/lib/actions";

const formSchema = z.object({
  business_name: z.string().min(1, "Business name is required."),
  sugarcane: z.coerce.number().min(0),
  wheat: z.coerce.number().min(0),
  fruits: z.coerce.number().min(0),
  vegs: z.coerce.number().min(0),
  normal_meat: z.coerce.number().min(0),
  premium_meat: z.coerce.number().min(0),
  total_price: z.coerce.number().min(0),
  logistics_used: z.boolean().default(false),
  employee_cut_value: z.coerce.number().min(0),
  employee_cut_percentage: z.coerce.number().min(0).max(100),
});

export function AddOrderForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: "",
      sugarcane: 0,
      wheat: 0,
      fruits: 0,
      vegs: 0,
      normal_meat: 0,
      premium_meat: 0,
      total_price: 0,
      logistics_used: false,
      employee_cut_value: 0,
      employee_cut_percentage: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await submitDetailedOrder({ ...values, user: currentUser });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            New Order Completion
          </DialogTitle>
          <DialogDescription>
            Enter the details of the produce and payment for this transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vanilla Unicorn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="sugarcane"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sugarcane</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="wheat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wheat</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="fruits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fruits</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vegs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vegs</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="normal_meat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Normal Meat</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="premium_meat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Meat</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                <FormField
                    control={form.control}
                    name="total_price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Total Order Price ($)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="employee_cut_value"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Cut ($)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="employee_cut_percentage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Percentage (%)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="logistics_used"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Logistics Used?</FormLabel>
                            <FormDescription>
                                Check this if farm transport/delivery was utilized.
                            </FormDescription>
                        </div>
                        </FormItem>
                    )}
                />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Record Completion"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
