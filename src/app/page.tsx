import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-foreground">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            DOC Roster
          </h1>
          <p className="mt-2 text-muted-foreground">
            Department of Corrections Portal
          </p>
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Personnel Login</CardTitle>
            <CardDescription>Enter your credentials to access the roster.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Want to join the Department of Corrections?</p>
          <Button variant="link" asChild className="text-primary">
            <Link href="/apply">
              Submit an Application
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
