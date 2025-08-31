
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateApplicationStatusSetting } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface ToggleApplicationStatusProps {
    initialStatus: boolean;
}

export function ToggleApplicationStatus({ initialStatus }: ToggleApplicationStatusProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(initialStatus);
    const [currentUser, setCurrentUser] = useState("System");
    const { hasPermission } = usePermissions();
    const canManageSettings = hasPermission('MANAGE_APP_SETTINGS');


    useEffect(() => {
        setIsOpen(initialStatus);
    }, [initialStatus]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
        setCurrentUser(localStorage.getItem('loggedInUser') || "System");
        }
    }, []);
    
    const handleToggle = async () => {
        setIsSaving(true);
        const newStatus = !isOpen;
        try {
            const result = await updateApplicationStatusSetting(newStatus, currentUser);
            if (result.success) {
                toast({
                    title: "Success",
                    description: `Applications are now ${newStatus ? 'OPEN' : 'CLOSED'}.`,
                });
                setIsOpen(newStatus);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update application status.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!canManageSettings) {
        return null;
    }

    return (
        <Button onClick={handleToggle} disabled={isSaving} variant="outline" size="sm">
            {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isOpen ? (
                <Lock className="mr-2 h-4 w-4" />
            ) : (
                <Unlock className="mr-2 h-4 w-4" />
            )}
            {isOpen ? 'Close Applications' : 'Open Applications'}
        </Button>
    )
}
