
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from "@/components/layout/refresh-button";
import { getFarmProcedures, deleteFarmProcedure } from "@/lib/actions";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, User, ShieldCheck, Loader2 } from "lucide-react";
import { AddProcedureDialog } from "@/components/sops/add-procedure-dialog";
import type { FarmProcedure } from "@/lib/types";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
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

export default function FarmGuidelinesPage() {
  const [procedures, setProcedures] = useState<FarmProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("System");
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  const canManage = hasPermission('MANAGE_PROCEDURES');

  const fetchProcedures = async () => {
    setLoading(true);
    const data = await getFarmProcedures();
    setProcedures(data);
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
    fetchProcedures();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await deleteFarmProcedure(id, currentUser);
    if (res.success) {
        toast({ title: "Procedure Removed" });
        fetchProcedures();
    }
  }

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-5xl font-black tracking-tighter text-primary">Farm Guidelines</h1>
            <p className="text-muted-foreground mt-2 text-xl font-medium">Official Standard Operating Procedures for Green Horizon.</p>
        </div>
        <div className="flex items-center gap-3">
            {canManage && <AddProcedureDialog />}
            <RefreshButton onRefresh={fetchProcedures} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="mt-4 text-muted-foreground font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
        </div>
      ) : procedures.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2">
            {procedures.map((proc) => (
                <Card key={proc.id} className="group relative overflow-hidden border-primary/10 bg-card/40 backdrop-blur-md shadow-2xl transition-all hover:scale-[1.01] hover:border-primary/30">
                    {proc.image_url && (
                        <div className="aspect-video relative w-full overflow-hidden">
                            <Image 
                                src={proc.image_url} 
                                alt={proc.title} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                data-ai-hint="farm environment"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        </div>
                    )}
                    
                    <CardContent className="p-8 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight leading-none mb-2">{proc.title}</h2>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                                    <ShieldCheck className="h-3 w-3" />
                                    Official Guideline
                                </div>
                            </div>
                            {canManage && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Archive Guideline?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently remove the <span className="font-bold">{proc.title}</span> procedure from the system.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(proc.id)} className="bg-destructive text-white hover:bg-destructive/90">Delete Permanently</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-6 whitespace-pre-wrap">
                            {proc.content}
                        </p>

                        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-black tracking-tight leading-none">{proc.author_name}</p>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">{proc.author_rank}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                                {new Date(proc.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
            <BookOpen className="h-20 w-20 text-primary opacity-10 mb-6" />
            <h3 className="text-2xl font-black tracking-tight text-foreground/40">No Active Guidelines</h3>
            <p className="text-muted-foreground/60 max-w-xs text-center mt-2 font-medium">Standard operating procedures have not been published by leadership yet.</p>
        </div>
      )}
    </div>
  );
}
