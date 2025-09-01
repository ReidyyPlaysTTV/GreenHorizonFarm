
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
                src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png" 
                alt="DOC Logo" 
                width={128} 
                height={128} 
                className="h-32 w-32 mb-8"
            />
            <h1 className="text-4xl font-bold tracking-tight mb-4">Access Denied</h1>
            <p className="text-lg text-destructive-foreground/80 max-w-md text-center">
                Your account has been banned from accessing this application. 
                If you believe this is a mistake, please contact an administrator.
            </p>
             <Button onClick={handleLogout} variant="secondary" className="mt-8 gap-2">
                <LogOut />
                Logout
            </Button>
        </div>
    );
}
