
import { getPersonnel, getRanks } from "@/lib/actions";
import { divisions, staffRoles } from "@/lib/data";
import type { Personnel, PersonnelStatus, Rank } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPersonnelForm } from "@/components/roster/add-personnel-form";
import { PersonnelActions } from "@/components/roster/personnel-actions";
import Image from "next/image";
import { RefreshButton } from "@/components/layout/refresh-button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Recycle, Phone, CreditCard, CalendarDays, ClipboardCheck, User as UserIcon } from "lucide-react";
import Link from "next/link";

const RosterTable = ({ personnel, ranks }: { personnel: Personnel[], ranks: Rank[] }) => {
  
  const getStatusRowClass = (p: Personnel) => {
    const isLoaExpired = p.status === 'LOA' && p.loa_until && new Date(p.loa_until) < new Date();
    if (isLoaExpired) return 'bg-red-900/50 hover:bg-red-900/60';

    switch (p.status) {
      case 'LOA':
        return 'bg-orange-900/50 hover:bg-orange-900/60';
      case 'Suspended':
      case 'Inactive':
        return 'bg-red-900/50 hover:bg-red-900/60';
      case 'Low Activity':
        return 'bg-red-800/50 hover:bg-red-800/60';
      case 'Medical Leave':
        return 'bg-yellow-900/50 hover:bg-yellow-900/60';
      default:
        return '';
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
            <TableHeader>
            <TableRow>
                <TableHead>Personnel Details</TableHead>
                <TableHead>Contact & Finance</TableHead>
                <TableHead>Position & Dept</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {personnel.length > 0 ? (
                personnel.map((p) => (
                <TableRow key={p.id} className={cn(getStatusRowClass(p))}>
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
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 text-primary" />
                                <span>{p.phoneNumber || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CreditCard className="h-3 w-3 text-primary" />
                                <span>{p.bankAccount || "N/A"}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{p.rank}</span>
                            <span className="text-[10px] text-muted-foreground">{p.department}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {p.hireDate ? format(new Date(p.hireDate), "MMM dd, yyyy") : "Unknown"}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1.5 bg-primary/5 text-primary border-primary/20">
                            <ClipboardCheck className="h-3 w-3" />
                            {p.ordersCompleted}
                        </Badge>
                    </TableCell>
                    <TableCell>
                    <Badge variant={getStatusBadgeVariant(p.status)} className="text-[10px] uppercase font-black tracking-tighter">
                        {p.status}
                        {p.status === 'LOA' && p.loa_until && ` until ${format(new Date(p.loa_until), 'MM/dd')}`}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <PersonnelActions personnel={p} ranks={ranks} />
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                    No personnel found.
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

  const unassignedPersonnel = sortedPersonnel.filter(p => !p.department || !divisions.includes(p.department as any));

  return (
    <div className="flex flex-col h-full bg-background/50">
        <div className="flex-none p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-primary">Green Horizon Roster</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                    Live personnel manifest and performance tracking. Click a name to view their profile.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AddPersonnelForm />
                    <RefreshButton />
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-auto px-4 md:px-8 pb-8">
            <div className="space-y-8">
                {divisions.map(div => {
                const divisionPersonnel = sortedPersonnel.filter(p => p.department === div);
                if (divisionPersonnel.length === 0) return null;
                return (
                    <Card key={div} className="border-primary/10 bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-primary/5 py-3 border-b border-primary/10">
                        <CardTitle className="text-sm uppercase tracking-widest font-black text-primary flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            {div} Division
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <RosterTable personnel={divisionPersonnel} ranks={ranks} />
                    </CardContent>
                    </Card>
                )
                })}

                {unassignedPersonnel.length > 0 && (
                     <Card className="border-destructive/20 bg-card/40 backdrop-blur-sm overflow-hidden">
                     <CardHeader className="bg-destructive/5 py-3 border-b border-destructive/10">
                         <CardTitle className="text-sm uppercase tracking-widest font-black text-destructive flex items-center gap-2">
                             <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                             Unassigned / Needs Division
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="p-0">
                         <RosterTable personnel={unassignedPersonnel} ranks={ranks} />
                     </CardContent>
                     </Card>
                )}
            </div>
        </div>
    </div>
  );
}
