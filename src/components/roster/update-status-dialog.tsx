"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { updatePersonnelStatus } from "@/lib/actions";
import type { Personnel, PersonnelStatus } from "@/lib/types";
import { format } from "date-fns";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShieldHalf, CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFormSchema = z.object({
    status: z.enum(['Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended']),
    loaUntil: z.date().optional().nullable(),
}).refine(data => data.status !== 'LOA' || !!data.loaUntil, {
    message: "An end date is required for LOA.",
    path: ["loaUntil"],
});

const statusOptions: PersonnelStatus[] = ['Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended'];

interface UpdateStatusDialogProps {
    personnel: Personnel;
    currentUser: string;
    children?: React.ReactNode;
    onSuccess?: () => void;
}

export function UpdateStatusDialog({ personnel, currentUser, children, onSuccess }: UpdateStatusDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof statusFormSchema>>({
        resolver: zodResolver(statusFormSchema),
        defaultValues: {
            status: personnel.status,
            loaUntil: personnel.loa_until ? new Date(personnel.loa_until) : null,
        },
    });

    const watchedStatus = form.watch('status');

    const handleStatusSubmit = async (values: z.infer<typeof statusFormSchema>) => {
        setIsUpdating(true);
        const result = await updatePersonnelStatus({
            personnelId: personnel.id,
            status: values.status,
            loaUntil: values.status === 'LOA' ? values.loaUntil : null,
            user: currentUser,
        });

        if (result.success) {
            toast({ title: "Status Updated", description: `Availability set to ${values.status}.` });
            setIsOpen(false);
            onSuccess?.();
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: result.message });
        }
        setIsUpdating(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10">
                        <ShieldHalf className="h-4 w-4" /> Update Availability
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass-card">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Update Availability: {personnel.name}</DialogTitle>
                    <DialogDescription>Set your current status on the active roster.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleStatusSubmit)} className="space-y-4">
                        <FormField control={form.control} name="status" render={({field}) => (
                            <FormItem>
                                <FormLabel>Current Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>

                        {watchedStatus === 'LOA' && (
                            <FormField
                                control={form.control}
                                name="loaUntil"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>LOA Expected Return</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-white/5 border-white/10",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ?? undefined}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isUpdating} className="font-black uppercase tracking-widest">
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : "Commit Update"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
