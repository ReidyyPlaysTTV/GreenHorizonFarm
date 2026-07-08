
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addAnnouncement, getUsers } from "@/lib/actions";

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
import { Loader2, Megaphone } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

const formSchema = z.object({
  content: z.string().min(1, "Announcement must have content."),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
});

export function AddAnnouncementDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
        if (typeof window !== 'undefined') {
            const loggedInUsername = localStorage.getItem('loggedInUser');
            if(loggedInUsername) {
                const users = await getUsers();
                const currentUser = users.find(u => u.username === loggedInUsername);
                if (currentUser) {
                    setCurrentUserId(currentUser.id);
                }
            }
        }
    };
    if (isOpen) fetchUser();
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      priority: 'medium',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUserId) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify the current user." });
        return;
    }
    setIsLoading(true);
    const result = await addAnnouncement({ ...values, userId: currentUserId });
    if (result.success) {
      toast({ title: "Success", description: "Announcement posted." });
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
        <Button className="gap-2 font-black uppercase tracking-tighter shadow-lg">
            <Megaphone className="h-4 w-4"/>
            Post Announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Broadcast to the Farm</DialogTitle>
          <DialogDescription>
            This message will appear on the global dashboard for all staff.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Alert Priority Level</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="high" className="text-destructive border-destructive" /></FormControl>
                                <Label className="font-bold text-destructive">Urgent (Red)</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="medium" className="text-yellow-500 border-yellow-500" /></FormControl>
                                <Label className="font-bold text-yellow-500">Caution (Amber)</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="low" className="text-emerald-500 border-emerald-500" /></FormControl>
                                <Label className="font-bold text-emerald-500">Info (Green)</Label>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Announcement Message</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[120px] bg-muted/20" placeholder="Type instructions or updates here..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Broadcast Now"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
