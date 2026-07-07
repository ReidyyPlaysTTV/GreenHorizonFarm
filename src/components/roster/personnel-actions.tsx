
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


interface PersonnelActionsProps {
  personnel: Personnel;
  ranks: Rank[];
}

const fireFormSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters."),
});

const editFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  badgeNumber: z.string().min(3, "Callsign must be 3-4 digits.").max(4, "Callsign must be 3-4 digits."),
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

export function PersonnelActions({ personnel, ranks }: PersonnelActionsProps) {
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
      badgeNumber: personnel.badgeNumber,
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


  const currentRank = ranks.find(r => r.name === personnel.rank);
  const canPromote = currentRank && currentRank.sort_order > 1;
  const canDemote = currentRank && currentRank.sort_order < ranks.length;

  const canManagePersonnel = hasPermission('MANAGE_PERSONNEL');

  const watchedStatus = statusForm.watch('status');

  if (!canManagePersonnel) {
    return null;
  }

  return (
    <>
      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update Status for {personnel.name}</DialogTitle>
            </DialogHeader>
            <Form {...statusForm}>
                <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="space-y-4">
                    <FormField control={statusForm.control} name="status" render={({field}) => (
                        <FormItem>
                            <Label>Status</Label>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
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
                                                "w-full pl-3 text-left font-normal",
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
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Edit Personnel: {personnel.name}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="name" render={({field}) => (
                            <FormItem>
                                <Label>Name</Label>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={editForm.control} name="discordUsername" render={({field}) => (
                            <FormItem>
                                <Label>Discord</Label>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="phoneNumber" render={({field}) => (
                            <FormItem>
                                <Label>Phone</Label>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={editForm.control} name="bankAccount" render={({field}) => (
                            <FormItem>
                                <Label>Bank Account</Label>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="badgeNumber" render={({field}) => (
                            <FormItem>
                                <Label>Callsign</Label>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={editForm.control} name="rank" render={({field}) => (
                            <FormItem>
                                <Label>Rank</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {ranks.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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
                                    "w-full pl-3 text-left font-normal",
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fire {personnel.name}?</DialogTitle>
          </DialogHeader>
          <Form {...fireForm}>
            <form onSubmit={fireForm.handleSubmit(handleFireSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="discordUsername">Discord</Label>
                    <Input id="discordUsername" value={personnel.discordUsername || 'N/A'} disabled />
                </div>
                <FormField
                    control={fireForm.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <Label>Reason for Firing</Label>
                            <FormControl>
                                <Textarea placeholder="Provide a detailed reason..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setFireDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={isFiring}>
                    {isFiring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Fire"}
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlePromote} disabled={!canPromote || isPromoting}>
            {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4 text-green-500" />}
            <span>Promote</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDemote} disabled={!canDemote || isDemoting}>
            {isDemoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDown className="mr-2 h-4 w-4 text-orange-500" />}
            <span>Demote</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setStatusDialogOpen(true)}>
            <ShieldHalf className="mr-2 h-4 w-4" />
            <span>Update Status</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Details</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setFireDialogOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <UserX className="mr-2 h-4 w-4" />
            <span>Fire</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
