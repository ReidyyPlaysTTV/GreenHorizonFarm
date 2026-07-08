
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  promotePersonnel,
  demotePersonnel,
  firePersonnel,
  updatePersonnel,
  updatePersonnelStatus,
} from "@/lib/actions";
import type { Personnel, PersonnelStatus, Rank } from "@/lib/types";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, UserX, Edit, Loader2, ShieldHalf, CalendarIcon, MoreHorizontal } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { staffRoles } from "@/lib/data";


interface PersonnelActionsProps {
  personnel: Personnel;
  ranks: Rank[];
}

const fireFormSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters."),
});

const editFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Must be IC Name format"),
  rank: z.string(),
  discordUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.date().optional(),
});

const statusFormSchema = z.object({
    status: z.enum(['Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended']),
    loaUntil: z.date().optional().nullable(),
}).refine(data => data.status !== 'LOA' || !!data.loaUntil, {
    message: "An end date is required for LOA.",
    path: ["loaUntil"],
});


const statusOptions: PersonnelStatus[] = ['Active', 'LOA', 'Inactive', 'Low Activity', 'Medical Leave', 'Suspended'];

export function PersonnelActions({ personnel }: PersonnelActionsProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  
  const [isFireDialogOpen, setFireDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);
  
  const fireForm = useForm<z.infer<typeof fireFormSchema>>({
    resolver: zodResolver(fireFormSchema),
    defaultValues: { reason: "" },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: personnel.name,
      rank: personnel.rank,
      discordUsername: personnel.discordUsername || "",
      phoneNumber: personnel.phoneNumber || "",
      bankAccount: personnel.bankAccount || "",
      hireDate: personnel.hireDate ? new Date(personnel.hireDate) : undefined,
    },
  });

  const statusForm = useForm<z.infer<typeof statusFormSchema>>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      status: personnel.status,
      loaUntil: personnel.loa_until ? new Date(personnel.loa_until) : null,
    },
  });

  const handlePromote = async () => {
    setIsPromoting(true);
    const result = await promotePersonnel(personnel.id, currentUser);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsPromoting(false);
  };

  const handleDemote = async () => {
    setIsDemoting(true);
    const result = await demotePersonnel(personnel.id, currentUser);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsDemoting(false);
  };

  const handleFireSubmit = async (values: z.infer<typeof fireFormSchema>) => {
    setIsFiring(true);
    const result = await firePersonnel(personnel.id, values.reason, currentUser);
    if (result.success) {
      toast({ title: "Personnel Fired", description: `${personnel.name} has been moved to the archive.` });
      setFireDialogOpen(false);
      fireForm.reset();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsFiring(false);
  };

  const handleEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    setIsEditing(true);
    const result = await updatePersonnel(personnel.id, { ...values, user: currentUser });
     if (result.success) {
      toast({ title: "Success", description: result.message });
      setEditDialogOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsEditing(false);
  };
  
  const handleStatusSubmit = async (values: z.infer<typeof statusFormSchema>) => {
    setIsUpdatingStatus(true);
    const result = await updatePersonnelStatus({
        personnelId: personnel.id,
        status: values.status,
        loaUntil: values.status === 'LOA' ? values.loaUntil : null,
        user: currentUser,
    });
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setStatusDialogOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsUpdatingStatus(false);
  }


  const currentRankIndex = staffRoles.indexOf(personnel.rank as any);
  const canPromote = currentRankIndex > 0;
  const canDemote = currentRankIndex !== -1 && currentRankIndex < staffRoles.length - 1;

  const canManagePersonnel = hasPermission('MANAGE_EMPLOYEES');

  const watchedStatus = statusForm.watch('status');

  if (!canManagePersonnel) {
    return null;
  }

  return (
    <>
      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="glass-card">
            <DialogHeader>
                <DialogTitle className="text-xl font-black">Update Status: {personnel.name}</DialogTitle>
            </DialogHeader>
            <Form {...statusForm}>
                <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="space-y-4">
                    <FormField control={statusForm.control} name="status" render={({field}) => (
                        <FormItem>
                            <Label>Status</Label>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    {watchedStatus === 'LOA' && (
                        <FormField
                            control={statusForm.control}
                            name="loaUntil"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <Label>LOA End Date</Label>
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
                                                selected={field.value ?? undefined}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date()
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isUpdatingStatus}>
                            {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin"/> : "Update Status"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card">
            <DialogHeader>
                <DialogTitle className="text-xl font-black">Edit Record: {personnel.name}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <FormField control={editForm.control} name="name" render={({field}) => (
                            <FormItem>
                                <Label>Full IC Name</Label>
                                <FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="rank" render={({field}) => (
                            <FormItem>
                                <Label>Position</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {staffRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={editForm.control} name="discordUsername" render={({field}) => (
                            <FormItem>
                                <Label>Discord</Label>
                                <FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="phoneNumber" render={({field}) => (
                            <FormItem>
                                <Label>Phone</Label>
                                <FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={editForm.control} name="bankAccount" render={({field}) => (
                            <FormItem>
                                <Label>Bank Account</Label>
                                <FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </div>

                    <FormField
                        control={editForm.control}
                        name="hireDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <Label>Hire Date</Label>
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
                        <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isEditing}>
                            {isEditing ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isFireDialogOpen} onOpenChange={setFireDialogOpen}>
        <DialogContent className="glass-card border-destructive/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-destructive">Terminate Contract: {personnel.name}?</DialogTitle>
          </DialogHeader>
          <Form {...fireForm}>
            <form onSubmit={fireForm.handleSubmit(handleFireSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="discordUsername">Discord Reference</Label>
                    <Input id="discordUsername" value={personnel.discordUsername || 'N/A'} disabled className="bg-black/20" />
                </div>
                <FormField
                    control={fireForm.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <Label>Reason for Termination</Label>
                            <FormControl>
                                <Textarea placeholder="Provide a detailed reason for the personnel archive..." {...field} className="bg-white/5 border-white/10 min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setFireDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={isFiring} className="font-black">
                    {isFiring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Termination"}
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/5">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card min-w-[200px]">
          <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Personnel Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlePromote} disabled={!canPromote || isPromoting} className="gap-2">
            {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4 text-green-500" />}
            <span className="font-bold">Promote</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDemote} disabled={!canDemote || isDemoting} className="gap-2">
            {isDemoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDown className="mr-2 h-4 w-4 text-orange-500" />}
            <span className="font-bold">Demote</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem onSelect={() => setStatusDialogOpen(true)} className="gap-2">
            <ShieldHalf className="mr-2 h-4 w-4 text-primary opacity-70" />
            <span>Update Status</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditDialogOpen(true)} className="gap-2">
            <Edit className="mr-2 h-4 w-4 text-primary opacity-70" />
            <span>Edit Details</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem onSelect={() => setFireDialogOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 font-black">
            <UserX className="mr-2 h-4 w-4" />
            <span>Fire Personnel</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
