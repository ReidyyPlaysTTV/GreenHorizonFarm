
import { CheckStatusForm } from "@/components/application/check-status-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function CheckStatusPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-foreground">
          <Search className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Check Application Status
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your unique Application ID to see the current status.
          </p>
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Enter the ID you received upon submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckStatusForm />
          </CardContent>
        </Card>
        <div className="text-center">
            <Button variant="ghost" asChild>
                <Link href="/" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
