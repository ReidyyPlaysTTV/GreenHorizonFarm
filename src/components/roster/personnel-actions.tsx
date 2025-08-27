

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
import type { Personnel, PersonnelStatus } from "@/lib/types";
import { format } from "date-fns";

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
import { rankOrder } from "@/lib/data";
import { ArrowUp, ArrowDown, UserX, Edit, Loader2, ShieldHalf, CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";


interface PersonnelActionsProps {
  personnel: Personnel;
}

const fireFormSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters."),
});

const editFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  badgeNumber: z.string().min(3, "Callsign must be 3-4 digits.").max(4, "Callsign must be 3-4 digits."),
  rank: z.string(),
  discordUsername: z.string().optional(),
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
      badgeNumber: personnel.badgeNumber,
      rank: personnel.rank,
      discordUsername: personnel.discordUsername || "",
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


  const currentRankIndex = rankOrder.indexOf(personnel.rank);
  const canPromote = currentRankIndex > 0;
  const canDemote = currentRankIndex < rankOrder.length - 1;

  const canManagePersonnel = hasPermission('MANAGE_PERSONNEL');

  const watchedStatus = statusForm.watch('status');

  if (!canManagePersonnel) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Promote */}
      <Button variant="ghost" size="icon" onClick={handlePromote} disabled={!canPromote || isPromoting} title="Promote">
        {isPromoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4 text-green-500" />}
      </Button>

      {/* Demote */}
      <Button variant="ghost" size="icon" onClick={handleDemote} disabled={!canDemote || isDemoting} title="Demote">
        {isDemoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4 text-orange-500" />}
      </Button>

      {/* Update Status */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Update Status">
                <ShieldHalf className="h-4 w-4"/>
            </Button>
        </DialogTrigger>
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
      
      {/* Edit */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Edit">
                <Edit className="h-4 w-4" />
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Personnel: {personnel.name}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                    <FormField control={editForm.control} name="name" render={({field}) => (
                        <FormItem>
                            <Label>Name</Label>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <FormField control={editForm.control} name="discordUsername" render={({field}) => (
                        <FormItem>
                            <Label>Discord Username</Label>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
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
                                    {rankOrder.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <DialogFooter>
                        <Button type="submit" disabled={isEditing}>
                            {isEditing ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>


      {/* Fire */}
      <Dialog open={isFireDialogOpen} onOpenChange={setFireDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Fire">
            <UserX className="h-4 w-4 text-destructive" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fire {personnel.name}?</DialogTitle>
            <DialogDescription>
              This action will move the personnel to the Fired/Resigned archive. Please provide a reason.
            </DialogDescription>
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
    </div>
  );
}
