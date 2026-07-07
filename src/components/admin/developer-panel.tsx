
"use client";

import { useState } from "react";
import type { BugReport, Suggestion } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportTable } from "./report-table";
import { Button } from "../ui/button";
import { Database, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { testDatabaseConnection } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface DeveloperPanelProps {
    bugReports: BugReport[];
    suggestions: Suggestion[];
}

export function DeveloperPanel({ bugReports, suggestions }: DeveloperPanelProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
        const result = await testDatabaseConnection();
        setTestResult(result);
        if (result.success) {
            toast({ title: "Connection Success", description: result.message });
        } else {
            toast({ variant: "destructive", title: "Connection Failed", description: result.message });
        }
    } catch (e) {
        setTestResult({ success: false, message: "An unexpected client error occurred." });
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
        <Card className="bg-black text-white border-destructive/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            Database Diagnostics
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Verify the application's connection to the ZAP-Hosting MariaDB server.
                        </CardDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleTestConnection} 
                        disabled={isTesting}
                        className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
                    >
                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Test DB Connection
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {testResult && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
                        {testResult.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                        <div>
                            <p className="font-bold">{testResult.success ? "Connection Active" : "Connection Refused"}</p>
                            <p className="text-sm opacity-80">{testResult.message}</p>
                        </div>
                    </div>
                )}
                {!testResult && (
                    <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                        <p className="text-muted-foreground text-sm">Click the button above to run a connectivity diagnostic.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="bg-black text-white">
            <CardHeader>
                <CardTitle>Bug Reports</CardTitle>
                <CardDescription className="text-gray-400">
                    Issues and bugs reported by users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ReportTable reports={bugReports} type="bug" />
            </CardContent>
        </Card>

        <Card className="bg-black text-white">
            <CardHeader>
                <CardTitle>Feature Suggestions</CardTitle>
                <CardDescription className="text-gray-400">
                    Ideas and suggestions submitted by users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ReportTable reports={suggestions} type="suggestion" />
            </CardContent>
        </Card>
    </div>
  );
}
