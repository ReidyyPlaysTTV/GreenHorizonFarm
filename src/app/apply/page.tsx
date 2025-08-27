import { ApplicationForm } from "@/components/application/application-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function ApplyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center text-foreground">
          <FileText className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            DOC Application
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete the form below to apply to the Department of Corrections.
          </p>
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>All fields are required. Please be truthful and concise.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationForm />
          </CardContent>
        </Card>
        <div className="text-center">
            <Button variant="ghost" asChild>
                <Link href="/login" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
