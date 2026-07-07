
import { Button } from "@/components/ui/button";
import { Sprout, ArrowRight, ShieldCheck, Search, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function FarmLandingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-2xl px-6 text-center">
            <div className="mb-10 inline-flex p-1 rounded-full bg-primary/10 border border-primary/20">
                <Image 
                    src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                    alt="Green Horizon Logo" 
                    width={160} 
                    height={160} 
                    className="h-40 w-40 rounded-full object-cover"
                />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                GREEN HORIZON
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium">
                Nature • Kindness • Future
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
                <Button size="lg" className="h-16 text-lg font-bold rounded-2xl group" asChild>
                    <Link href="/login">
                        Enter Operations Room
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 text-lg font-bold rounded-2xl border-primary/20 hover:bg-primary/10" asChild>
                    <Link href="/apply">
                        <FileText className="mr-2 h-5 w-5" />
                        Join Our Team
                    </Link>
                </Button>
            </div>

            <div className="mt-6 flex justify-center">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2" asChild>
                    <Link href="/check-status">
                        <Search className="h-4 w-4" />
                        Track Application Status
                    </Link>
                </Button>
            </div>

            <div className="mt-16 flex items-center justify-center gap-8 text-muted-foreground/60 font-bold uppercase tracking-widest text-xs">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Secure Access
                </div>
                <span>•</span>
                <div>Manager Verified</div>
                <span>•</span>
                <div>v2.0 Farm Edition</div>
            </div>
        </div>
    </div>
  );
}
