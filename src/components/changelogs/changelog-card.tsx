
"use client";

import type { Changelog } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "../ui/separator";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "../ui/button";
import { deleteChangelog } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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

interface ChangelogCardProps {
  changelog: Changelog;
}

const ChangelogSection = ({ title, content, emoji }: { title: string, content: string | null, emoji: string }) => {
    if (!content) return null;
    return (
        <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">{emoji} {title}</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {content.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim().replace(/^- /, '')}</li>)}
            </ul>
        </div>
    )
}

export function ChangelogCard({ changelog }: ChangelogCardProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const canManage = hasPermission('MANAGE_CHANGELOGS');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUser(localStorage.getItem('loggedInUser'));
    }
  }, []);
  
  const handleDelete = async () => {
    if (!currentUser) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to delete changelogs." });
        return;
    }
    const result = await deleteChangelog(changelog.id, currentUser);
    if (result.success) {
        toast({ title: "Success", description: "Changelog deleted." });
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  }


  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-2xl">{changelog.version}</CardTitle>
        <CardDescription>
          Posted on {format(changelog.createdAt, "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChangelogSection title="Added Features" emoji="✨" content={changelog.added_features} />
        <ChangelogSection title="Fixes" emoji="🐛" content={changelog.fixes} />
        <ChangelogSection title="Removed Features" emoji="🗑️" content={changelog.removed_features} />
        <ChangelogSection title="Other" emoji="📝" content={changelog.other} />
      </CardContent>
      <Separator className="my-4" />
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={changelog.author.avatarUrl} alt={changelog.author.username}/>
                <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-medium">{changelog.author.username}</p>
                <p className="text-xs text-muted-foreground">Author</p>
            </div>
        </div>
        {canManage && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4"/>
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the changelog for version <span className="font-bold">{changelog.version}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80">
                            Yes, delete changelog
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
