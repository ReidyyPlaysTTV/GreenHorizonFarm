
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addPersonnel, getRanks, updateApplicationStatus } from "@/lib/actions";
import type { Application, Rank } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  rank: z.string({ required_error: "Please select a rank." }),
  callsign: z.coerce
    .number({ invalid_type_error: "Callsign must be a number." })
    .min(100, "Callsign must be between 100 and 9999.")
    .max(9999, "Callsign must be between 100 and 9999."),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  approvalComment: z.string().min(1, "Please provide feedback for the applicant."),
});

interface ApproveApplicationDialogProps {
    application: Application;
    currentUser: string;
    children: React.ReactNode;
}

export function ApproveApplicationDialog({ application, currentUser, children }: ApproveApplicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: application.name,
      discordUsername: application.discordUsername || "",
      phoneNumber: application.phoneNumber || "",
      rank: "Trainee Farm Hand",
      callsign: "" as any,
      approvalComment: "Congratulations! Your application has been approved. Please await contact from our management team for your initial onboarding and orientation.",
    },
  });

  useEffect(() => {
    async function fetchRanks() {
        const fetchedRanks = await getRanks();
        setRanks(fetchedRanks);
    }
    if(isOpen) {
        fetchRanks();
    }
  }, [isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        // Step 1: Add to Roster (Personnel)
        const rosterResult = await addPersonnel({ 
            name: values.name,
            rank: values.rank,
            callsign: values.callsign,
            discordUsername: values.discordUsername,
            phoneNumber: values.phoneNumber,
            user: currentUser,
        });

        if (!rosterResult.success) {
            throw new Error(rosterResult.message);
        }

        // Step 2: Update Application status to Approved with comment
        const statusResult = await updateApplicationStatus({
            applicationId: application.id,
            status: 'Approved',
            comment: values.approvalComment,
            user: currentUser,
        });

        if (!statusResult.success) {
            throw new Error("Roster updated but application status failed to save.");
        }

        toast({
            title: "Success",
            description: `${values.name} is now on the roster and application is marked Approved.`,
        });
        setIsOpen(false);
        form.reset();
    } catch (err: any) {
        toast({
            variant: "destructive",
            title: "Approval Error",
            description: err.message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
            Finalize Approval
          </DialogTitle>
          <DialogDescription>
            Assign onboarding details. This will automatically move {application.name} to the active roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Onboarding Rank</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {ranks.map((rank) => (
                            <SelectItem key={rank.id} value={rank.name}>
                            {rank.name}
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
                    <FormLabel>Assigned Callsign</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="approvalComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message to Applicant (Reason for Approval)</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Welcome message or instructions..." 
                        className="min-h-[100px] bg-muted/20"
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-black">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Onboard to Roster"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
