
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, ShoppingCart, ShieldCheck, Search, Key } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function FarmLandingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-3xl px-6 text-center">
            <div className="mb-10 inline-flex p-1 rounded-full bg-primary/10 border border-primary/20">
                <Image 
                    src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                    alt="Green Horizon Logo" 
                    width={160} 
                    height={160} 
                    className="h-40 w-40 rounded-full object-cover shadow-2xl"
                />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                GREEN HORIZON
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium tracking-wide">
                Sustainable Supply • Community Growth • Excellence
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
                <Button size="lg" className="h-16 text-md font-black uppercase tracking-widest rounded-2xl group shadow-xl shadow-primary/20" asChild>
                    <Link href="/dashboard">
                        Staff Entry
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
                <Button size="lg" variant="secondary" className="h-16 text-md font-black uppercase tracking-widest rounded-2xl border border-white/5" asChild>
                    <Link href="/order">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Supply Request
                    </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 text-md font-black uppercase tracking-widest rounded-2xl border-primary/20 hover:bg-primary/10" asChild>
                    <Link href="/apply">
                        <FileText className="mr-2 h-5 w-5" />
                        Join Team
                    </Link>
                </Button>
            </div>

            <div className="mt-8 flex justify-center gap-6">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2 text-xs font-bold uppercase tracking-widest" asChild>
                    <Link href="/check-status">
                        <Search className="h-4 w-4" />
                        Track Application
                    </Link>
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2 text-xs font-bold uppercase tracking-widest" asChild>
                    <Link href="/request-access">
                        <Key className="h-4 w-4" />
                        Request Login
                    </Link>
                </Button>
            </div>

            <div className="mt-20 flex items-center justify-center gap-8 text-muted-foreground/60 font-black uppercase tracking-[0.3em] text-[10px]">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Encrypted Protocol
                </div>
                <span className="opacity-20">•</span>
                <div>Supply Node Alpha</div>
                <span className="opacity-20">•</span>
                <div>v2.5 Enterprise</div>
            </div>
        </div>
    </div>
  );
}
