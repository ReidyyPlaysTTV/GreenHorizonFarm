
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { rehirePersonnel } from "@/lib/actions";
import { rankOrder } from "@/lib/data";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Recycle } from "lucide-react";

const formSchema = z.object({
  rank: z.string({ required_error: "Please select a rank." }),
  discordUsername: z.string().optional(),
  callsign: z.coerce
    .number({ invalid_type_error: "Callsign must be a number." })
    .min(100, "Callsign must be between 100 and 9999.")
    .max(9999, "Callsign must be between 100 and 9999."),
});

interface RehireDialogProps {
    personnel: ArchivedPersonnel;
}

export function RehireDialog({ personnel }: RehireDialogProps) {
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
      rank: personnel.rank,
      discordUsername: personnel.discordUsername || "",
      callsign: "" as any,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await rehirePersonnel({ 
        archivedId: personnel.id,
        name: personnel.name,
        rank: values.rank,
        discordUsername: values.discordUsername,
        callsign: values.callsign,
        user: currentUser,
    });
    
    if (result.success) {
      toast({
        title: "Personnel Rehired",
        description: `${personnel.name} has been added back to the roster.`,
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
        <Button variant="outline" size="sm" className="gap-1">
          <Recycle className="h-4 w-4" />
          Rehire
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rehire {personnel.name}</DialogTitle>
          <DialogDescription>
            Assign a new rank and callsign to add this person back to the active roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
                <FormLabel>Name</FormLabel>
                <Input value={personnel.name} disabled className="mt-2" />
            </div>
            <FormField
              control={form.control}
              name="discordUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe#1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rank</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rankOrder.map((rank) => (
                        <SelectItem key={rank} value={rank}>
                          {rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="callsign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Callsign</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Confirm Rehire"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
