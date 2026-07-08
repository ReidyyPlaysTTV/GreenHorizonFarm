
import { getPersonnel, getRanks } from "@/lib/actions";
import { staffRoles } from "@/lib/data";
import type { Personnel, PersonnelStatus, Rank } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPersonnelForm } from "@/components/roster/add-personnel-form";
import { PersonnelActions } from "@/components/roster/personnel-actions";
import { RefreshButton } from "@/components/layout/refresh-button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Recycle, Phone, CreditCard, CalendarDays, ClipboardCheck, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";

const RosterTable = ({ personnel, ranks }: { personnel: Personnel[], ranks: Rank[] }) => {
  
  const getStatusRowClass = (p: Personnel) => {
    const isLoaExpired = p.status === 'LOA' && p.loa_until && new Date(p.loa_until) < new Date();
    if (isLoaExpired) return 'bg-red-950/20 hover:bg-red-950/30 transition-colors';

    switch (p.status) {
      case 'LOA':
        return 'bg-orange-950/10 hover:bg-orange-950/20';
      case 'Suspended':
      case 'Inactive':
        return 'bg-red-950/20 hover:bg-red-950/30';
      case 'Low Activity':
        return 'bg-red-950/10 hover:bg-red-950/20';
      case 'Medical Leave':
        return 'bg-yellow-950/10 hover:bg-yellow-950/20';
      default:
        return 'hover:bg-white/5 transition-colors';
    }
  };

  const getStatusBadgeVariant = (status: PersonnelStatus) => {
    switch (status) {
        case 'Active': return 'secondary';
        case 'LOA':
        case 'Medical Leave':
            return 'default';
        case 'Inactive':
        case 'Suspended':
        case 'Low Activity':
            return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
            <TableHeader className="bg-white/5">
            <TableRow>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Personnel Details</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Contact & Finance</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Position</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 text-center">Hire Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 text-center">Orders</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 text-right w-[100px]">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {personnel.length > 0 ? (
                personnel.map((p) => (
                <TableRow key={p.id} className={cn(getStatusRowClass(p), "border-white/5")}>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link 
                                    href={`/users/${encodeURIComponent(p.name)}`}
                                    className="text-lg font-black tracking-tight text-primary hover:underline flex items-center gap-2"
                                >
                                    <UserIcon className="h-4 w-4 opacity-50" />
                                    {p.name}
                                </Link>
                                {p.is_rehired && (
                                <Tooltip>
                                    <TooltipTrigger><Recycle className="h-3.5 w-3.5 text-green-500" /></TooltipTrigger>
                                    <TooltipContent><p>Rehired (2nd Chance)</p></TooltipContent>
                                </Tooltip>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-6">{p.discordUsername || "No Discord"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                                <Phone className="h-3 w-3 text-primary" />
                                <span>{p.phoneNumber || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <CreditCard className="h-3 w-3 text-primary opacity-50" />
                                <span className="font-mono">{p.bankAccount || "N/A"}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight text-foreground">{p.rank}</span>
                            <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-[0.2em]">Official Position</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/40" />
                            <span className="text-[10px] font-bold">
                                {p.hireDate ? format(new Date(p.hireDate), "MMM dd, yyyy") : "Unknown"}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1.5 bg-primary/5 text-primary border-primary/20 font-black">
                            <ClipboardCheck className="h-3 w-3" />
                            {p.ordersCompleted}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(p.status)} className="text-[10px] uppercase font-black tracking-tighter px-3 py-1">
                            {p.status}
                            {p.status === 'LOA' && p.loa_until && ` • ${format(new Date(p.loa_until), 'MM/dd')}`}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <PersonnelActions personnel={p} ranks={ranks} />
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                    <p className="text-muted-foreground font-black uppercase tracking-widest opacity-20">Roster Empty</p>
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default async function RosterPage() {
  const [personnel, ranks] = await Promise.all([
    getPersonnel(),
    getRanks()
  ]);

  const sortedPersonnel = [...personnel].sort((a, b) => {
    const rankAIndex = staffRoles.indexOf(a.rank as any);
    const rankBIndex = staffRoles.indexOf(b.rank as any);
    
    if (rankAIndex !== rankBIndex) {
        return (rankAIndex === -1 ? 99 : rankAIndex) - (rankBIndex === -1 ? 99 : rankBIndex);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full bg-background/50">
        <div className="flex-none p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-8 bg-card/40 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-primary flex items-center gap-4">
                        <Shield className="h-14 w-14 opacity-80" />
                        Staff Roster
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2 text-xl max-w-2xl">
                    Live personnel manifest and performance tracking. Click a name to view their profile.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AddPersonnelForm />
                    <RefreshButton />
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-auto px-6 md:px-10 pb-10">
             <Card className="border-white/5 bg-card/30 backdrop-blur-sm overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-primary/5 py-4 border-b border-white/5">
                    <CardTitle className="text-sm uppercase tracking-[0.3em] font-black text-primary flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Unified Personnel Manifest
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <RosterTable personnel={sortedPersonnel} ranks={ranks} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
