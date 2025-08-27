
import { getPersonnel } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Check, X } from "lucide-react";

export default async function CallsignsPage() {
  const personnel = await getPersonnel();
  const usedCallsigns = personnel.reduce((acc, p) => {
    acc[p.badgeNumber] = p.name;
    return acc;
  }, {} as Record<string, string>);

  const callsignStart = 1000;
  const callsignEnd = 1100; // Let's display 100 callsigns for now
  const allCallsigns = Array.from({ length: callsignEnd - callsignStart + 1 }, (_, i) => (callsignStart + i).toString());

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Callsign Assignments</h1>
        <p className="text-muted-foreground">
          Overview of assigned and available callsigns.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {allCallsigns.map(callsign => {
          const isUsed = usedCallsigns[callsign];
          const userName = usedCallsigns[callsign];

          return (
            <Card key={callsign} className={isUsed ? 'bg-card' : 'bg-muted/50'}>
              <CardHeader className="p-4">
                <CardTitle className="flex justify-between items-center">
                  <span>{callsign}</span>
                  {isUsed ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isUsed ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{userName}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
