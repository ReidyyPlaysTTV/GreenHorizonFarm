
import { getArchivedPersonnel } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshButton } from "@/components/layout/refresh-button";
import { RehireDialog } from "@/components/archive/rehire-dialog";
import type { ArchivedPersonnel } from "@/lib/types";

export default async function ArchivePage() {
  const archivedPersonnel: ArchivedPersonnel[] = await getArchivedPersonnel();
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Personnel Archive</h1>
            <p className="text-muted-foreground">
            List of all fired and resigned personnel.
            </p>
        </div>
        <RefreshButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived Records</CardTitle>
          <CardDescription>
            This list is for official use only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Former Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedPersonnel.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.rank}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Fired" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                  <TableCell>{p.reason}</TableCell>
                   <TableCell className="text-right">
                    <RehireDialog personnel={p} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
