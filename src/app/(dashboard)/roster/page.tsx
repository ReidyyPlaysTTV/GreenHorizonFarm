import { getPersonnel, departments } from "@/lib/data";
import type { Personnel } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPersonnelForm } from "@/components/roster/add-personnel-form";

const RosterTable = ({ personnel }: { personnel: Personnel[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Insignia</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Rank</TableHead>
          <TableHead>Callsign</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personnel.length > 0 ? (
          personnel.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage src={p.avatarUrl} alt={p.name} />
                  <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.rank}</TableCell>
              <TableCell>
                <Badge variant="secondary">#{p.badgeNumber}</Badge>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
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
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Personnel Roster</h1>
            <p className="text-muted-foreground">
            Browse active personnel across all departments.
            </p>
        </div>
        <AddPersonnelForm />
      </div>
      
      <div className="space-y-8">
        {departments.map(dep => (
          <Card key={dep}>
            <CardHeader>
              <CardTitle>{dep}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <RosterTable personnel={personnel.filter(p => p.department === dep)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
