
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  promotePersonnel,
  demotePersonnel,
  firePersonnel,
  updatePersonnel,
} from "@/lib/actions/personnel-actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rankOrder } from "@/lib/data";
import { ArrowUp, ArrowDown, UserX, Edit, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";


interface PersonnelActionsProps {
  personnel: Personnel;
}

const fireFormSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters."),
});

const editFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  badgeNumber: z.string().min(4, "Callsign must be 4 digits.").max(4, "Callsign must be 4 digits."),
  rank: z.string(),
});

export function PersonnelActions({ personnel }: PersonnelActionsProps) {
  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isFireDialogOpen, setFireDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  
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
    },
  });

  const handlePromote = async () => {
    setIsPromoting(true);
    const result = await promotePersonnel(personnel.id);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsPromoting(false);
  };

  const handleDemote = async () => {
    setIsDemoting(true);
    const result = await demotePersonnel(personnel.id);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsDemoting(false);
  };

  const handleFireSubmit = async (values: z.infer<typeof fireFormSchema>) => {
    setIsFiring(true);
    const result = await firePersonnel(personnel.id, values.reason);
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
    const result = await updatePersonnel(personnel.id, values);
     if (result.success) {
      toast({ title: "Success", description: result.message });
      setEditDialogOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsEditing(false);
  };


  const currentRankIndex = rankOrder.indexOf(personnel.rank);
  const canPromote = currentRankIndex > 0;
  const canDemote = currentRankIndex < rankOrder.length - 1;

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
