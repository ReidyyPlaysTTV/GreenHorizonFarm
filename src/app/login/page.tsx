
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, LogIn, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulatedLogin = async () => {
    setIsLoading(true);
    
    // Simulate a brief network delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('loggedInUser', 'CEO_User');
      }

      toast({
        title: "Access Granted",
        description: "Welcome to Green Horizon Management.",
      });

      router.push('/dashboard');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md relative z-10 border-primary/10 shadow-2xl bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 p-2 border border-primary/20">
            <Image 
              src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Green_Horizon_Logo.png" 
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
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl gap-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleSimulatedLogin}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            Enter Management System
          </Button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Authorized Only</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
             <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-white/5">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Access is restricted to authorized personnel. Role-based access is determined by your system credentials.
                </p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
