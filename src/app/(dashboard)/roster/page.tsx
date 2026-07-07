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
import { Recycle } from "lucide-react";

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Insignia</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Discord</TableHead>
            <TableHead className="text-right w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {personnel.length > 0 ? (
            personnel.map((p) => (
              <TableRow key={p.id} className={cn(getStatusRowClass(p))}>
                <TableCell>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted p-1">
                    <Image src={rankInsignias[p.rank] || "https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png"} alt={`${p.rank} insignia`} width={25} height={25} className="rounded-md object-contain" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.name}
                    {p.is_rehired && (
                       <Tooltip>
                          <TooltipTrigger>
                            <Recycle className="h-4 w-4 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rehired (2nd Chance)</p>
                          </TooltipContent>
                        </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell>{p.rank}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.badgeNumber}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(p.status)}>
                      {p.status}
                      {p.status === 'LOA' && p.loa_until && ` until ${format(new Date(p.loa_until), 'MM/dd/yyyy')}`}
                  </Badge>
                </TableCell>
                <TableCell>
                    {p.discordUsername ? (
                        <Badge variant="outline">{p.discordUsername}</Badge>
                    ) : (
                        <Badge variant="destructive" className="border-transparent">N/A</Badge>
                    )}
                </TableCell>
                <TableCell className="text-right">
                  <PersonnelActions personnel={p} ranks={ranks} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No personnel found in this division.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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
    <div className="flex flex-col h-full">
        <div className="flex-none p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Roster</h1>
                    <p className="text-muted-foreground">
                    Browse active farm personnel across all divisions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                    <Card key={div}>
                    <CardHeader>
                        <CardTitle>{div}</CardTitle>
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
