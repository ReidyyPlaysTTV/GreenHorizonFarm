
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getBusinesses, addBusiness, updateBusiness, deleteBusiness } from "@/lib/actions/business-actions";
import type { Business } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, Pencil, Trash2, Building2, CreditCard } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  bank_account: z.string().optional(),
});

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const data = await getBusinesses();
    setBusinesses(data);
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    fetchData();
  }, []);

  const handleAdd = async (values: z.infer<typeof formSchema>) => {
    const res = await addBusiness(values, currentUser);
    if (res.success) {
        toast({ title: "Business Registered" });
        fetchData();
        return true;
    }
    toast({ variant: "destructive", title: "Error", description: res.message });
    return false;
  };

  const handleUpdate = async (id: string, values: z.infer<typeof formSchema>) => {
    const res = await updateBusiness(id, values, currentUser);
    if (res.success) {
        toast({ title: "Business Updated" });
        fetchData();
        return true;
    }
    toast({ variant: "destructive", title: "Error", description: res.message });
    return false;
  };

  const handleDelete = async (id: string) => {
    const res = await deleteBusiness(id, currentUser);
    if (res.success) {
        toast({ title: "Business Removed" });
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error", description: res.message });
    }
  };

  return (
    <Card className="border-primary/10 bg-black/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            Partner Businesses
          </CardTitle>
          <CardDescription>Directory of registered businesses and their bank accounts.</CardDescription>
        </div>
        <BusinessDialog onSave={handleAdd} />
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Bank Account</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {businesses.map((biz) => (
                        <TableRow key={biz.id}>
                            <TableCell className="font-bold">{biz.name}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{biz.bank_account || "NOT SET"}</TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                                <BusinessDialog business={biz} onSave={(v) => handleUpdate(biz.id, v)} />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Partner Business?</AlertDialogTitle>
                                            <AlertDialogDescription>This will delete {biz.name} from the registered directory.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(biz.id)} className="bg-destructive text-white">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                    {businesses.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No businesses registered.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessDialog({ business, onSave }: { business?: Business, onSave: (v: any) => Promise<boolean> }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: business?.name || "", bank_account: business?.bank_account || "" }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        const success = await onSave(values);
        if (success) {
            setOpen(false);
            if (!business) form.reset();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {business ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                ) : (
                    <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Register Business</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{business ? 'Edit Business' : 'Register New Partner'}</DialogTitle>
                    <DialogDescription>Add a business to the directory for easier selection and billing.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({field}) => (
                            <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Galaxy Nightclub" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="bank_account" render={({field}) => (
                            <FormItem>
                                <FormLabel>Bank Account Number</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" placeholder="e.g., GH-12345" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save Business'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
