
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
                src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png" 
                alt="DOC Logo" 
                width={128} 
                height={128} 
                className="h-32 w-32 animate-pulse mb-8"
            />
            <h1 className="text-4xl font-bold tracking-tight mb-4">Under Maintenance</h1>
            <p className="text-lg text-muted-foreground">
                Sorry, this application is under scheduled maintenance. We'll be back online soon!
            </p>
             <Button onClick={handleLogout} variant="outline" className="mt-8 gap-2">
                <LogOut />
                Logout
            </Button>
        </div>
    );
}
