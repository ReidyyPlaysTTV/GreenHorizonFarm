
"use client";

import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function TimedOutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleIdle = () => {
        localStorage.removeItem('loggedInUser');
        toast({
            title: "Session Timed Out",
            description: "You have been logged out due to inactivity.",
            variant: "destructive"
        });
        router.push('/');
    };

    // useIdleTimeout({ onIdle: handleIdle, idleTime: 15 }); // 15 minutes

    return <>{children}</>;
}
