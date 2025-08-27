
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { removeBlacklistedPersonnel } from "@/lib/actions";
import type { BlacklistedPersonnel } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface RemoveFromBlacklistDialogProps {
    personnel: BlacklistedPersonnel;
}

export function RemoveFromBlacklistDialog({ personnel }: RemoveFromBlacklistDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("System");
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);


  async function handleRemove() {
    setIsLoading(true);
    const result = await removeBlacklistedPersonnel({ 
        personnelId: personnel.id,
        user: currentUser,
        name: personnel.name,
    });
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsLoading(false);
  }
  
  if (!hasPermission('MANAGE_BLACKLIST')) {
    return null;
  }

  return (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Remove
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action will remove <span className="font-bold">{personnel.name}</span> from the blacklist. 
                They will be able to apply again. This cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Yes, remove from blacklist"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
