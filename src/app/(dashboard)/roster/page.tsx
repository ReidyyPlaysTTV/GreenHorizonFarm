import { getPersonnel, departments } from "@/lib/data";
import type { Department, Personnel } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RosterTable = ({ department, personnel }: { department: Department, personnel: Personnel[] }) => {
  const departmentPersonnel = personnel.filter(p => p.department === department);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Avatar</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Rank</TableHead>
          <TableHead>Badge Number</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departmentPersonnel.length > 0 ? (
          departmentPersonnel.map((p) => (
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Personnel Roster</h1>
        <p className="text-muted-foreground">
          Browse active personnel across all departments.
        </p>
      </div>
      
      <Card>
        <CardContent className="p-0">
           <Tabs defaultValue={departments[0]} className="w-full">
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-2 h-auto md:grid-cols-3 lg:grid-cols-6">
                {departments.map(dep => (
                  <TabsTrigger key={dep} value={dep}>{dep}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            {departments.map(dep => (
              <TabsContent key={dep} value={dep} className="p-0">
                <RosterTable department={dep} personnel={personnel} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
