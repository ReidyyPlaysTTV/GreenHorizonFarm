"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function BannedPage() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        router.replace('/');
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-destructive p-4 text-destructive-foreground">
            <Image 
                src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Green_Horizon_Logo.png" 
                alt="Green Horizon Logo" 
                width={128} 
                height={128} 
                className="h-32 w-32 mb-8 rounded-full border-4 border-white/20"
            />
            <h1 className="text-4xl font-bold tracking-tight mb-4">Access Denied</h1>
            <p className="text-lg text-destructive-foreground/80 max-w-md text-center">
                Your account has been banned from accessing Green Horizon systems. 
                If you believe this is a mistake, please contact farm management.
            </p>
             <Button onClick={handleLogout} variant="secondary" className="mt-8 gap-2">
                <LogOut />
                Logout
            </Button>
        </div>
    );
}
