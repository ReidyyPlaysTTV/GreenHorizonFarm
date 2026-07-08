
import { BusinessOrderForm } from "@/components/order/business-order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sprout } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BusinessOrderPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

        <div className="w-full max-w-3xl relative z-10 space-y-8">
            <div className="text-center space-y-4">
                <Image 
                    src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                    alt="Green Horizon Logo" 
                    width={80} 
                    height={80} 
                    className="mx-auto rounded-full shadow-2xl border-4 border-primary/20"
                />
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Supply Requisition</h1>
                <p className="text-muted-foreground text-lg font-medium">B2B Agricultural Supply & Logistics Solutions</p>
            </div>

            <Card className="border-primary/10 bg-card/50 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                        <Sprout className="h-4 w-4" />
                        Business Order Terminal
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Submit your requirements to our logistics network.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <BusinessOrderForm />
                </CardContent>
            </Card>

            <div className="text-center pb-12">
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-white transition-colors">
                    <Link href="/" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Return to Main Entrance
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
