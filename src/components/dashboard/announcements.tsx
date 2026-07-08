
"use client";

import type { Announcement, AnnouncementPriority } from "@/lib/types";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Megaphone, Trash2, User, X, Info, AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";
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
import { deleteAnnouncement } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface AnnouncementsProps {
    initialAnnouncements: Announcement[];
}

const PriorityIcon = ({ priority }: { priority: AnnouncementPriority }) => {
    switch (priority) {
        case 'high': return <ShieldAlert className="h-4 w-4" />;
        case 'medium': return <AlertTriangle className="h-4 w-4" />;
        default: return <Info className="h-4 w-4" />;
    }
}

const getPriorityStyles = (priority: AnnouncementPriority) => {
    switch (priority) {
        case 'high': return "border-destructive/30 bg-destructive/10 text-destructive-foreground";
        case 'medium': return "border-yellow-500/30 bg-yellow-500/10 text-yellow-500";
        default: return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    }
}

export function Announcements({ initialAnnouncements }: AnnouncementsProps) {
    const { hasPermission } = usePermissions();
    const canManage = hasPermission('MANAGE_ANNOUNCEMENTS');
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUser(localStorage.getItem('loggedInUser'));
        }
    }, []);

    const handleDelete = async (id: string) => {
        if (!currentUser) return;
        const result = await deleteAnnouncement(id, currentUser);
        if (result.success) {
            toast({ title: "Removed", description: "Announcement deleted." });
        }
    }

    return (
        <Card className="border-primary/10 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Farm Communications
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {initialAnnouncements.length > 0 ? (
                    initialAnnouncements.map((announcement) => (
                        <div key={announcement.id} className={cn(
                            "relative group p-4 rounded-xl border transition-all",
                            getPriorityStyles(announcement.priority)
                        )}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
                                        <PriorityIcon priority={announcement.priority} />
                                        {announcement.priority} PRIORITY
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-2 pt-2 opacity-60">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={announcement.author.avatarUrl} />
                                            <AvatarFallback className="text-[6px]">{announcement.author.username[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] font-bold">
                                            {announcement.author.username} • {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                {canManage && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remove Announcement?</AlertDialogTitle>
                                                <AlertDialogDescription>This will clear the message from the global dashboard.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="bg-destructive text-white hover:bg-destructive/90">Remove</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 opacity-20 italic text-sm">
                        No active broadcasts.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
