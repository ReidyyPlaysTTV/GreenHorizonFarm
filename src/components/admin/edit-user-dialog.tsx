
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/lib/actions";
import { roles } from "@/lib/data";
import type { AppUser } from "@/lib/types";

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
import { Loader2, Edit, Check } from "lucide-react";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  roles: z.array(z.string()).min(1, "At least one role must be selected."),
});

interface EditUserDialogProps {
    user: AppUser;
}

export function EditUserDialog({ user }: EditUserDialogProps) {
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
      username: user.username,
      roles: user.roles,
    },
  });
  
  const selectedRoles = form.watch('roles');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await updateUser({
        userId: user.id,
        username: values.username,
        roles: values.roles,
        adminUser: currentUser,
    });
    
    if (result.success) {
      toast({
        title: "User Updated",
        description: "User details have been updated successfully.",
      });
      setIsOpen(false);
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
          <DialogDescription>
            Change the user's username or assigned roles.
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
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                              <Check className={cn("mr-2 h-4 w-4", field.value.includes(role) ? "opacity-100" : "opacity-0")} />
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
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
