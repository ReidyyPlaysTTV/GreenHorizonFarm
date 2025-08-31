
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addChangelog, getUsers } from "@/lib/actions";
import { usePermissions } from "@/hooks/use-permissions";

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
import { Loader2, PlusCircle, GitMerge } from "lucide-react";

const formSchema = z.object({
    version: z.string().min(1, "Version is required.").refine(v => /^v?(\d+\.\d+\.\d+)$/.test(v), "Version must be in format like v1.0.0 or 1.0.0"),
    added_features: z.string().optional(),
    fixes: z.string().optional(),
    removed_features: z.string().optional(),
    other: z.string().optional(),
}).refine(data => data.added_features || data.fixes || data.removed_features || data.other, {
    message: "At least one category must have content.",
    path: ["version"],
});

export function AddChangelogDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

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
    if (isOpen) {
        fetchUser();
    }
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      version: "",
      added_features: "",
      fixes: "",
      removed_features: "",
      other: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUserId) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify the current user. Please log in again." });
        return;
    }
    setIsLoading(true);
    const result = await addChangelog({ ...values, authorId: currentUserId });
    if (result.success) {
      toast({
        title: "Success",
        description: "Changelog posted successfully.",
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
  
  if (!hasPermission('MANAGE_CHANGELOGS')) {
      return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add Changelog
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Create New Changelog</DialogTitle>
          <DialogDescription>
            Document the latest changes to the application. Use bullet points for each entry.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Version</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., v1.0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="added_features"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>✨ Added Features</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="- Added a new button..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="fixes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>🐛 Fixes</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="- Fixed a bug where..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="removed_features"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>🗑️ Removed Features</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="- Removed the old dashboard..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="other"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>📝 Other</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="- Updated documentation..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="sticky bottom-0 bg-background py-4">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Post Changelog"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
