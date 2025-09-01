
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { approveAccessRequest } from "@/lib/actions";
import type { AccessRequest } from "@/lib/types";
import { roles } from "@/lib/data";

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
import { Loader2, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  roles: z.array(z.string()).min(1, "At least one role must be selected."),
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
    },
  });
  
  const selectedRoles = form.watch('roles');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await approveAccessRequest({
        requestId: request.id,
        username: values.username,
        roles: values.roles,
        adminUser: currentUser,
    });
    
    if (result.success) {
      toast({
        title: "Request Approved",
        description: `User '${values.username}' has been created and granted access.`,
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
        <Button size="sm">Approve</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve Access Request</DialogTitle>
          <DialogDescription>
            Confirm username and assign roles to create the user account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Roles</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between h-auto", !field.value && "text-muted-foreground")}
                                        >
                                            <div className="flex gap-1 flex-wrap">
                                                {selectedRoles.length > 0 ? selectedRoles.map(role => <Badge key={role}>{role}</Badge>) : "Select roles..."}
                                            </div>
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search roles..." className="h-9" />
                                        <CommandEmpty>No roles found.</CommandEmpty>
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
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Approve & Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
