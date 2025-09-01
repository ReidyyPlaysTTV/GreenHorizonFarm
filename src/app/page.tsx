

import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginBackgroundImage } from "@/lib/actions";
import { testConnection } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function LoginPage() {
  const bgImageUrl = await getLoginBackgroundImage();
  const dbStatus = await testConnection();

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center bg-background p-4 bg-cover bg-center"
      style={{
        backgroundImage: `url('${bgImageUrl}')`
      }}
    >
        <div className="absolute inset-0 bg-black/60 z-0" />
        
        <div className="absolute top-4 left-4 right-4 z-20">
            <Alert variant={dbStatus.success ? "default" : "destructive"}>
                {dbStatus.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{dbStatus.success ? "Database Connected" : "Database Connection Failed"}</AlertTitle>
                <AlertDescription>
                    {dbStatus.message}
                </AlertDescription>
            </Alert>
        </div>

        <div className="relative z-10 w-full max-w-md space-y-6">
            <div className="text-center text-foreground">
            <Image src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png" alt="DOC Logo" width={96} height={96} className="mx-auto h-24 w-24 object-contain" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
                Department of Corrections
            </h1>
            <p className="mt-2 text-muted-foreground">
                Personnel Portal
            </p>
            </div>
            <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Personnel Login</CardTitle>
                <CardDescription>Enter your credentials to access the roster.</CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/80 backdrop-blur-sm text-center">
                    <CardHeader>
                        <CardTitle className="text-base">Check Application Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Button variant="link" asChild className="text-primary">
                            <Link href="/check-status">
                                Check Status
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="bg-card/80 backdrop-blur-sm text-center">
                    <CardHeader>
                        <CardTitle className="text-base">Want to join?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" asChild className="text-primary">
                            <Link href="/apply">
                                Submit Application
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
             <div className="text-center">
                 <Button variant="link" asChild className="text-sm text-muted-foreground">
                    <Link href="/request-access">
                        Need an account? Request Access
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
