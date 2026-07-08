
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { createUser } from "@/lib/actions";

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
import { Loader2, PlusCircle, X } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { roles } from "@/lib/data";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { Check } from "lucide-react";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters.")
    .regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Username must be IC Name format (e.g. 'Leon Green')"),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roles: z.array(z.string()).min(1, "At least one role must be selected."),
});

export function AddUserForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      roles: ["User"],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await createUser({ ...values, adminUser: currentUser });
    if (result.success) {
      toast({
        title: "User Created",
        description: `User '${values.username}' has been created successfully.`,
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

  if (!hasPermission('MANAGE_USERS')) {
    return null;
  }
  
  const selectedRoles = form.watch('roles');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Account usernames must follow the IC Name format.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full IC Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
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
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Create User"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
