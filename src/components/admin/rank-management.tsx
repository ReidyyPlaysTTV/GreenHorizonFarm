
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { getRanks, deleteRank } from "@/lib/actions/rank-actions";
import type { Rank } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { EditRankDialog } from "./edit-rank-dialog";
import Image from "next/image";
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


export function RankManagement() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<string>("System");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
    fetchRanks();
  }, []);

  const fetchRanks = async () => {
    setLoading(true);
    try {
        const fetchedRanks = await getRanks();
        setRanks(fetchedRanks);
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch ranks." });
    } finally {
        setLoading(false);
    }
  }
  
  const handleDelete = async (rankId: string) => {
    setIsProcessing(prev => ({ ...prev, [rankId]: true }));
    try {
        const result = await deleteRank(rankId, currentUser);
        if (result.success) {
            toast({ title: "Success", description: "Rank deleted successfully."});
            fetchRanks(); // Refresh list
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete rank." });
    } finally {
        setIsProcessing(prev => ({ ...prev, [rankId]: false }));
    }
  }


  if (!hasPermission('MANAGE_RANKS')) {
    return (
       <Card className="bg-black text-white">
        <CardHeader>
            <CardTitle>Rank Management</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to manage ranks.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (loading) {
    return (
       <Card className="bg-black text-white">
        <CardHeader>
            <CardTitle>Rank Management</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Rank Management</CardTitle>
            <CardDescription className="text-gray-400">
            Add, edit, or delete ranks for the roster.
            </CardDescription>
        </div>
        <EditRankDialog onSave={fetchRanks}>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Rank
            </Button>
        </EditRankDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-white w-16">Insignia</TableHead>
              <TableHead className="text-white">Rank Name</TableHead>
              <TableHead className="text-white">Department</TableHead>
              <TableHead className="text-white">Sort Order</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranks.map(rank => (
              <TableRow key={rank.id} className="border-gray-800">
                <TableCell>
                    {rank.insignia_url ? (
                        <Image src={rank.insignia_url} alt={rank.name} width={32} height={32} className="object-contain" />
                    ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-sm" />
                    )}
                </TableCell>
                <TableCell className="font-medium">{rank.name}</TableCell>
                <TableCell>{rank.department}</TableCell>
                <TableCell>{rank.sort_order}</TableCell>
                <TableCell className="text-right space-x-2">
                  {isProcessing[rank.id] ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                    <>
                      <EditRankDialog rank={rank} onSave={fetchRanks}>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                      </EditRankDialog>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-4 w-4"/>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the <span className="font-bold">{rank.name}</span> rank. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(rank.id)} className="bg-destructive hover:bg-destructive/90">
                                      Delete
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
