"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function MaintenancePage() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        router.replace('/');
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
             <Image 
                src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                alt="Green Horizon Logo" 
                width={128} 
                height={128} 
                className="h-32 w-32 animate-pulse mb-8 rounded-full"
            />
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">Farm Maintenance</h1>
            <p className="text-lg text-muted-foreground text-center max-w-md">
                We're currently tending to the digital fields. The system will be back online shortly!
            </p>
             <Button onClick={handleLogout} variant="outline" className="mt-8 gap-2 border-primary/20">
                <LogOut />
                Logout
            </Button>
        </div>
    );
}
