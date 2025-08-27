
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addBlacklistedPersonnel } from "@/lib/actions";
import type { ArchivedPersonnel } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldX } from "lucide-react";

const formSchema = z.object({
  reason: z.string().min(10, "A detailed reason is required."),
});

interface BlacklistDialogProps {
    personnel: ArchivedPersonnel;
}

export function BlacklistDialog({ personnel }: BlacklistDialogProps) {
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
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await addBlacklistedPersonnel({ 
        name: personnel.name, 
        discordUsername: personnel.discordUsername,
        reason: values.reason, 
        user: currentUser 
    });
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
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
        <Button variant="destructive" size="sm" className="gap-1">
            <ShieldX className="h-4 w-4" />
            Blacklist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blacklist {personnel.name}</DialogTitle>
          <DialogDescription>
            This action will permanently add this individual to the blacklist.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div>
                    <FormLabel>Name</FormLabel>
                    <Input value={personnel.name} disabled className="mt-2" />
                </div>
                 <div>
                    <FormLabel>Discord</FormLabel>
                    <Input value={personnel.discordUsername || 'N/A'} disabled className="mt-2" />
                </div>
                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Blacklist</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Provide a reason for this blacklist..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Add to Blacklist"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
