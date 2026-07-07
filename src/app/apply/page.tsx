import { ApplicationForm } from "@/components/application/application-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, FileText, XCircle } from "lucide-react";
import Link from "next/link";
import { getApplicationStatus } from "@/lib/actions";
import Image from "next/image";

export default async function ApplyPage() {
  const applicationsOpen = await getApplicationStatus();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center text-foreground">
          <Image 
            src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Green_Horizon_Logo.png" 
            alt="Green Horizon Logo" 
            width={80} 
            height={80} 
            className="mx-auto rounded-full h-20 w-20 mb-4"
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Green Horizon Employment
          </h1>
          <p className="mt-2 text-muted-foreground">
            {applicationsOpen
              ? "Join our team and help us grow a greener tomorrow."
              : "Applications are currently closed."}
          </p>
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              {applicationsOpen
                ? "All fields are required. Tell us why you'd be a great fit for the farm."
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
                  Unfortunately, Green Horizon Farm is not currently hiring. Please check back later or follow our announcements.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <div className="text-center">
            <Button variant="ghost" asChild>
                <Link href="/" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Main Page
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
