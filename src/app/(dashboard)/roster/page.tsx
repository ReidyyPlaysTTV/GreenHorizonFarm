
import { getPersonnel, getRanks } from "@/lib/actions";
import { divisions } from "@/lib/data";
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
import { Recycle, Phone, CreditCard, CalendarDays, ClipboardCheck } from "lucide-react";

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

  const rankInsignias = ranks.reduce((acc, rank) => {
    if (rank.insignia_url) {
      acc[rank.name] = rank.insignia_url;
    }
    return acc;
  }, {} as Record<string, string>);

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[60px]">Insignia</TableHead>
                <TableHead>Personnel Details</TableHead>
                <TableHead>Contact & Finance</TableHead>
                <TableHead>Rank & Dept</TableHead>
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
                    <TableCell>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted p-1 border border-white/5">
                        <Image src={rankInsignias[p.rank] || "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png"} alt={`${p.rank} insignia`} width={32} height={32} className="rounded-md object-contain" />
                    </div>
                    </TableCell>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black tracking-tight">{p.name}</span>
                                {p.is_rehired && (
                                <Tooltip>
                                    <TooltipTrigger><Recycle className="h-3.5 w-3.5 text-green-500" /></TooltipTrigger>
                                    <TooltipContent><p>Rehired (2nd Chance)</p></TooltipContent>
                                </Tooltip>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{p.discordUsername || "No Discord"}</span>
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
                <TableCell colSpan={8} className="h-24 text-center">
                    No personnel found in this division.
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
    const rankA = ranks.find(r => r.name === a.rank);
    const rankB = ranks.find(r => r.name === b.rank);
    const rankAOrder = rankA ? rankA.sort_order : Infinity;
    const rankBOrder = rankB ? rankB.sort_order : Infinity;
    
    if (rankAOrder !== rankBOrder) {
        return rankAOrder - rankBOrder;
    }
    return parseInt(a.badgeNumber) - parseInt(b.badgeNumber);
  });

  return (
    <div className="flex flex-col h-full bg-background/50">
        <div className="flex-none p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-primary">Green Horizon Roster</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                    Live personnel manifest and performance tracking.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AddPersonnelForm ranks={ranks} />
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
            </div>
        </div>
    </div>
  );
}
