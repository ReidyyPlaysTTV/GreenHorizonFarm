
"use client";

import { useState, useMemo, useEffect } from "react";
import { getPersonnel } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Check, X } from "lucide-react";

// Note: In a real-world app, you'd want to fetch this data client-side
// or use a suspense boundary if the personnel list is very large.
// For this example, we assume `getPersonnel` is fast and can be awaited
// in a Server Component wrapper that passes data to this client component.
// However, since we need client-side interactivity (search), we've made
// this a Client Component and would ideally fetch data within a useEffect.
// To keep it simple and aligned with existing patterns in the app,
// we'll assume the initial data is passed as a prop.

// This is a placeholder for the data fetching logic.
// In a real app, this would be inside `useEffect` or a data fetching library.
const usePersonnelData = () => {
    const [personnel, setPersonnel] = useState<Awaited<ReturnType<typeof getPersonnel>>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPersonnel().then(data => {
            setPersonnel(data);
            setLoading(false);
        });
    }, []);

    return { personnel, loading };
}


export default function CallsignsPage() {
  const { personnel, loading } = usePersonnelData();
  const [searchTerm, setSearchTerm] = useState("");

  const usedCallsigns = useMemo(() => {
    return personnel.reduce((acc, p) => {
      acc[p.badgeNumber] = p.name;
      return acc;
    }, {} as Record<string, string>);
  }, [personnel]);


  const callsignStart = 1000;
  const callsignEnd = 1100;
  const allCallsigns = Array.from({ length: callsignEnd - callsignStart + 1 }, (_, i) => (callsignStart + i).toString());

  const filteredCallsigns = allCallsigns.filter(callsign => 
    callsign.includes(searchTerm) || usedCallsigns[callsign]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Callsign Assignments</h1>
          <p className="text-muted-foreground">
            Overview of assigned and available callsigns.
          </p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <Input 
            placeholder="Search by callsign or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-[250px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading callsigns...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredCallsigns.map(callsign => {
            const isUsed = !!usedCallsigns[callsign];
            const userName = usedCallsigns[callsign];

            return (
              <Card key={callsign} className={isUsed ? 'bg-card' : 'bg-muted/50'}>
                <CardHeader className="p-4">
                  <CardTitle className="flex justify-between items-center">
                    <span>{callsign}</span>
                    {isUsed ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : (
                      <Check className="h-5 w-5 text-green-500" />
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
                    <p className="text-sm text-muted-foreground italic">Available</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {!loading && filteredCallsigns.length === 0 && (
         <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No callsigns found matching your search.</p>
        </div>
      )}
    </div>
  );
}
