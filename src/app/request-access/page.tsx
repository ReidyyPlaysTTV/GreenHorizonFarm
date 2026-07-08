import { RequestAccessForm } from "@/components/auth/request-access-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function RequestAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center text-foreground">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Request Portal Access
          </h1>
          <p className="mt-2 text-muted-foreground">
            Fill out the form below to request an account. This is for Green Horizon staff only.
          </p>
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Access Request</CardTitle>
            <CardDescription>Your request will be reviewed by an administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <RequestAccessForm />
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
