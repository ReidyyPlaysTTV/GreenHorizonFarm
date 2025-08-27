
import { getPersonnel } from "@/lib/actions";
import { departments } from "@/lib/data";
import type { Personnel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPersonnelForm } from "@/components/roster/add-personnel-form";
import { PersonnelActions } from "@/components/roster/personnel-actions";
import Image from "next/image";
import { RefreshButton } from "@/components/layout/refresh-button";

const RosterTable = ({ personnel }: { personnel: Personnel[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Insignia</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Rank</TableHead>
          <TableHead>Callsign</TableHead>
          <TableHead>Discord</TableHead>
          <TableHead className="text-right w-[200px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personnel.length > 0 ? (
          personnel.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted p-1">
                  <Image src={p.avatarUrl} alt={`${p.rank} Insignia`} width={32} height={32} className="h-auto w-auto object-contain" />
                </div>
              </TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.rank}</TableCell>
              <TableCell>
                <Badge variant="secondary">#{p.badgeNumber}</Badge>
              </TableCell>
              <TableCell>{p.discordUsername || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <PersonnelActions personnel={p} />
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No personnel found in this department.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default async function RosterPage() {
  const personnel = await getPersonnel();

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Personnel Roster</h1>
            <p className="text-muted-foreground">
            Browse active personnel across all departments.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <AddPersonnelForm />
            <RefreshButton />
        </div>
      </div>
      
      <div className="space-y-8">
        {departments.map(dep => {
          const departmentPersonnel = personnel.filter(p => p.department === dep);
          // Do not render department card if there are no personnel
          if (departmentPersonnel.length === 0) return null;
          return (
            <Card key={dep}>
              <CardHeader>
                <CardTitle>{dep}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <RosterTable personnel={departmentPersonnel} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
