
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, CalendarIcon, ShieldCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPersonnel } from "@/lib/actions";
import { usePermissions } from "@/hooks/use-permissions";
import { staffRoles } from "@/lib/data";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Must be IC Name format (e.g. 'John Doe')"),
  rank: z.string({ required_error: "Please select a position." }),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.date().default(() => new Date()),
});

export function AddPersonnelForm() {
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
      name: "",
      discordUsername: "",
      phoneNumber: "",
      bankAccount: "",
      rank: "",
      hireDate: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await addPersonnel({ ...values, user: currentUser });
    if (result.success) {
      toast({
        title: "Personnel Added",
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

  if (!hasPermission('HIRE_EMPLOYEES')) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 font-black uppercase tracking-tighter rounded-xl h-12 shadow-xl">
          <PlusCircle className="h-5 w-5" />
          Add Personnel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-white/5">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Roster Onboarding
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new personnel member. Use their IC full name.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full IC Name</FormLabel>
                    <FormControl><Input placeholder="Leon Green" {...field} className="bg-white/5 border-white/10" /></FormControl>
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
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10">
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
                name="discordUsername"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Discord</FormLabel>
                    <FormControl><Input placeholder="johndoe#1234" {...field} className="bg-white/5 border-white/10" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="555-0199" {...field} className="bg-white/5 border-white/10" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Bank Account</FormLabel>
                    <FormControl><Input placeholder="GH-123456" {...field} className="bg-white/5 border-white/10" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Hire Date</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full pl-3 text-left font-normal bg-white/5 border-white/10",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value ? (
                            format(field.value, "PPP")
                            ) : (
                            <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full h-12 font-black uppercase text-lg rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Commit to Roster"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
