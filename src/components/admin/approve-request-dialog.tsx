
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { approveAccessRequest } from "@/lib/actions";
import type { AccessRequest } from "@/lib/types";
import { roles, staffRoles } from "@/lib/data";

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
import { Loader2, Check, ShieldCheck, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  roles: z.array(z.string()).min(1, "At least one role must be selected."),
  rank: z.string({ required_error: "Please assign a starting rank." }),
  callsign: z.coerce.number().min(1000).max(9999),
});

interface ApproveRequestDialogProps {
    request: AccessRequest;
}

export function ApproveRequestDialog({ request }: ApproveRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState("System");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: request.requested_username,
      roles: ["User"],
      rank: "Trainee Farm Hand",
      callsign: 1000 as any,
    },
  });
  
  const selectedRoles = form.watch('roles');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await approveAccessRequest({
        requestId: request.id,
        username: values.username,
        roles: values.roles,
        rank: values.rank,
        callsign: values.callsign,
        adminUser: currentUser,
    });
    
    if (result.success) {
      toast({
        title: "Account Provisioned",
        description: `User '${values.username}' is now active and on the roster.`,
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
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2">
            <UserPlus className="h-4 w-4" />
            Approve & Onboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Provision System Access
          </DialogTitle>
          <DialogDescription>
            Approve this request to create a user account and add them to the staff roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full IC Name</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                            {staffRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                {role}
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
                        <FormLabel>Initial Callsign</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>System Permission Groups</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between h-auto", !field.value && "text-muted-foreground")}
                                        >
                                            <div className="flex gap-1 flex-wrap">
                                                {selectedRoles.length > 0 ? selectedRoles.map(role => <Badge key={role} variant="secondary">{role}</Badge>) : "Select groups..."}
                                            </div>
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search groups..." className="h-9" />
                                        <CommandEmpty>No groups found.</CommandEmpty>
                                        <CommandGroup>
                                            {roles.map((role) => (
                                                <CommandItem
                                                    value={role}
                                                    key={role}
                                                    onSelect={() => {
                                                        const currentRoles = form.getValues("roles");
                                                        if (currentRoles.includes(role)) {
                                                            form.setValue("roles", currentRoles.filter((r) => r !== role));
                                                        } else {
                                                            form.setValue("roles", [...currentRoles, role]);
                                                        }
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", field.value.includes(role) ? "opacity-100" : "opacity-0")}/>
                                                    {role}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-black px-8">
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
