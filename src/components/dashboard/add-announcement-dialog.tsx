
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
import { Loader2, PlusCircle, Megaphone } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

const formSchema = z.object({
  content: z.string().min(10, "Announcement must be at least 10 characters.").max(500, "Announcement cannot exceed 500 characters."),
  isUrgent: z.boolean().default(false),
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
    fetchUser();
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      isUrgent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUserId) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify the current user. Please log in again." });
        return;
    }
    setIsLoading(true);
    const result = await addAnnouncement({ ...values, userId: currentUserId });
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
        <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4"/>
            New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>
            This will be displayed to all users on the dashboard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[150px]" placeholder="Type your announcement here..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isUrgent"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="is-urgent" className="flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-destructive" />
                                    Urgent Announcement
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Urgent announcements are displayed in red.
                                </p>
                            </div>
                            <FormControl>
                                <Switch
                                    id="is-urgent"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Post Announcement"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
