
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, BookOpen, PlusCircle } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addFarmProcedure, getUsers } from "@/lib/actions";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  content: z.string().min(10, "Provide clear instructions."),
  image_url: z.string().url("Please enter a valid FiveManage/Image URL.").optional().or(z.literal('')),
});

export function AddProcedureDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<{name: string, rank: string, username: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAuthorData = async () => {
        if (typeof window !== 'undefined') {
            const username = localStorage.getItem('loggedInUser');
            if (username) {
                const users = await getUsers();
                const foundUser = users.find(u => u.username === username);
                setCurrentUserData({
                    name: foundUser?.username || "Staff",
                    rank: foundUser?.personnel?.rank || "Management",
                    username: username
                });
            }
        }
    };
    if (isOpen) fetchAuthorData();
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      image_url: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUserData) return;
    setIsLoading(true);
    const result = await addFarmProcedure({ 
        ...values, 
        author_name: currentUserData.name,
        author_rank: currentUserData.rank,
        user: currentUserData.username
    });
    if (result.success) {
      toast({ title: "Guideline Published", description: "The farm procedure is now visible to all staff." });
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
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
          <PlusCircle className="h-4 w-4" />
          Add Farm Procedure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <BookOpen className="h-6 w-6 text-primary" />
            Publish New Procedure
          </DialogTitle>
          <DialogDescription>
            Document essential farm guidelines and standard operating procedures.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedure Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Harvesting Safety Protocol" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Reference URL (FiveManage)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://r2.fivemanage.com/..." {...field} />
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
                  <FormLabel>Guideline Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Step-by-step instructions or rules..." className="min-h-[150px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="p-3 bg-muted/40 rounded-lg border border-white/5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Publishing As</p>
                <p className="text-sm font-bold">{currentUserData?.name} <span className="text-primary opacity-60">•</span> {currentUserData?.rank}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Publish Guideline"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
