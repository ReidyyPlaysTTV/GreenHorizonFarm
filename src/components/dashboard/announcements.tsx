
"use client";

import type { Announcement } from "@/lib/types";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Megaphone, Trash2, User, X } from "lucide-react";
import { Card } from "../ui/card";
import { AddAnnouncementDialog } from "./add-announcement-dialog";
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

interface AnnouncementsProps {
    initialAnnouncements: Announcement[];
}

export function Announcements({ initialAnnouncements }: AnnouncementsProps) {
    const { hasPermission, userRole } = usePermissions();
    const canView = hasPermission('VIEW_ANNOUNCEMENTS');
    const canManage = hasPermission('MANAGE_ANNOUNCEMENTS');
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUser(localStorage.getItem('loggedInUser'));
        }
    }, []);

    if (!canView) {
        return null;
    }

    const handleDelete = async (id: string) => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to delete announcements." });
            return;
        }
        const result = await deleteAnnouncement(id, currentUser);
        if (result.success) {
            toast({ title: "Success", description: "Announcement deleted." });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    }

    return (
        <Card className="mb-8">
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Announcements</h2>
                </div>
                {canManage && <AddAnnouncementDialog />}
            </div>
            <div className="p-4 space-y-4">
                {initialAnnouncements.length > 0 ? (
                    initialAnnouncements.map((announcement) => (
                        <Alert key={announcement.id} variant={announcement.is_urgent ? "destructive" : "default"} className="relative pr-10">
                            {announcement.is_urgent && <Megaphone className="h-4 w-4" />}
                            <AlertTitle className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={announcement.author.avatarUrl} alt={announcement.author.username}/>
                                    <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">{announcement.author.username}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    - {formatDistanceToNow(announcement.createdAt, { addSuffix: true })}
                                </span>
                            </AlertTitle>
                            <AlertDescription>
                                {announcement.content}
                            </AlertDescription>
                            {canManage && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6">
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete this announcement. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="bg-destructive hover:bg-destructive/80">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </Alert>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground p-8">
                        No announcements at this time.
                    </div>
                )}
            </div>
        </Card>
    )
}
