
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { updateSelfPersonnelInfo } from "@/lib/actions";
import type { Personnel } from "@/lib/types";

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
import { Loader2, UserCog } from "lucide-react";

const formSchema = z.object({
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
});

interface EditProfileDialogProps {
    personnel: Personnel;
    username: string;
}

export function EditProfileDialog({ personnel, username }: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discordUsername: personnel.discordUsername || "",
      phoneNumber: personnel.phoneNumber || "",
      bankAccount: personnel.bankAccount || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await updateSelfPersonnelInfo({ 
        ...values,
        username
    });
    
    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your contact and financial information has been updated.",
      });
      setIsOpen(false);
    } else {
       toast({
        variant: "destructive",
        title: "Update Error",
        description: result.message,
      });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10">
            <UserCog className="h-4 w-4" /> Edit Profile Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle>Update Your Information</DialogTitle>
          <DialogDescription>
            Maintain your own contact and banking details. These will be visible on the staff roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="discordUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe#1234" {...field} className="bg-white/5 border-white/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="555-0100" {...field} className="bg-white/5 border-white/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Farm Payroll Bank Account</FormLabel>
                  <FormControl>
                    <Input placeholder="GH-XXXXXX" {...field} className="bg-white/5 border-white/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
