import { ApplicationForm } from "@/components/application/application-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, FileText, XCircle } from "lucide-react";
import Link from "next/link";
import { getApplicationStatus } from "@/lib/actions";

export default async function ApplyPage() {
  const applicationsOpen = await getApplicationStatus();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center text-foreground">
          <FileText className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            DOC Application
          </h1>
          <p className="mt-2 text-muted-foreground">
            {applicationsOpen
              ? "Complete the form below to apply to the Department of Corrections."
              : "Applications are currently closed."}
          </p>
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              {applicationsOpen
                ? "All fields are required. Please be truthful and concise."
                : "Check back at a later date."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsOpen ? (
              <ApplicationForm />
            ) : (
              <Alert variant="warning">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Applications Closed</AlertTitle>
                <AlertDescription>
                  Unfortunately, Department of Corrections Applications are Currently Closed and we cannot give you a time frame before you will be able to Apply.
                </AlertDescription>
              </Alert>
            )}
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
