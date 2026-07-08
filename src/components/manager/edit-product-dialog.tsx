"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { updateFarmProduct, deleteFarmProduct } from "@/lib/actions/manager-actions";
import type { FarmProduct } from "@/lib/types";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  category: z.string().min(1, "Category is required."),
  price: z.coerce.number().min(0),
});

interface EditProductDialogProps {
    product: FarmProduct;
    children?: React.ReactNode;
}

export function EditProductDialog({ product, children }: EditProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') setCurrentUser(localStorage.getItem('loggedInUser') || "System");
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        name: product.name, 
        category: product.category, 
        price: Number(product.price) 
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await updateFarmProduct(product.id, values, currentUser);
    if (result.success) {
      toast({ title: "Product Updated", description: `${values.name} has been updated.` });
      setIsOpen(false);
    } else {
       toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsLoading(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteFarmProduct(product.id, currentUser);
    if (result.success) {
        toast({ title: "Product Removed" });
        setIsOpen(false);
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsDeleting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                <Pencil className="h-4 w-4" />
            </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Catalog Item</DialogTitle>
          <DialogDescription>Modify supply details and adjust pricing across the network.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Organic Carrots" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Produce">Produce</SelectItem>
                                    <SelectItem value="Meat">Meat</SelectItem>
                                    <SelectItem value="Logistics">Logistics/Service</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reference Price ($)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="gap-2 sm:gap-0">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" size="icon" className="mr-auto">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Permanently remove {product.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This item will no longer be available for business orders or staff logs.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                                    {isDeleting ? <Loader2 className="animate-spin" /> : "Delete Forever"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
