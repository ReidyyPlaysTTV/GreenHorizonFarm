
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addPromotionSuggestion } from "@/lib/actions/manager-actions";
import { getPersonnel, getRanks } from "@/lib/actions";
import type { Personnel, Rank } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp } from "lucide-react";

const formSchema = z.object({
  personnel_name: z.string().min(1),
  suggested_rank: z.string().min(1),
  reason: z.string().min(10, "Detailed justification is required."),
});

export function AddPromotionSuggestionDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<Personnel[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    if (isOpen) {
        getPersonnel().then(setStaff);
        getRanks().then(setRanks);
    }
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { personnel_name: "", suggested_rank: "", reason: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await addPromotionSuggestion({ ...values, suggested_by: currentUser });
    if (result.success) {
      toast({ title: "Suggestion Submitted", description: "Leadership will review the promotion request." });
      setIsOpen(false);
      form.reset();
    } else {
       toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Suggest Promotion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promotion Recommendation</DialogTitle>
          <DialogDescription>Submit a formal recommendation for staff advancement.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="personnel_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nominee</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select candidate" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {staff.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="suggested_rank"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Rank</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Target position" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {ranks.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Justification</FormLabel>
                            <FormControl><Textarea placeholder="Explain why this person deserves a promotion (notable accomplishments, work ethic, etc.)" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Submit Suggestion"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
