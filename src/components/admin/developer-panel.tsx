
"use client";

import type { BugReport, Suggestion } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReportTable } from "./report-table";

interface DeveloperPanelProps {
    bugReports: BugReport[];
    suggestions: Suggestion[];
}

export function DeveloperPanel({ bugReports, suggestions }: DeveloperPanelProps) {

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Bug Reports</CardTitle>
                <CardDescription>
                    Issues and bugs reported by users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ReportTable reports={bugReports} type="bug" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Feature Suggestions</CardTitle>
                <CardDescription>
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
