
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Key } from "lucide-react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md relative z-10 border-primary/10 shadow-2xl bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 p-2 border border-primary/20">
            <Image 
              src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
              alt="Green Horizon Logo" 
              width={80} 
              height={80} 
              className="rounded-full"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter">Staff Access</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Secure entrance for Green Horizon Farm employees.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <LoginForm />
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Authorized Only</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-4">
             <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-white/5">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Access is restricted to authorized personnel. Role-based access is determined by your system credentials.
                </p>
             </div>
             
             <Button variant="outline" className="w-full h-12 border-primary/20 hover:bg-primary/10 font-bold gap-2" asChild>
                <Link href="/request-access">
                    <Key className="h-4 w-4" />
                    Request Access Account
                </Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
