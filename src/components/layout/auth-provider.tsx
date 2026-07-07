
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/(dashboard)/loading';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const loggedInUser = localStorage.getItem('loggedInUser');
            
            // Temporary Bypass: Auto-login as CEO if no one is logged in
            if (!loggedInUser) {
                console.log("Auth Bypassed: Auto-logging in as CEO for development.");
                localStorage.setItem('loggedInUser', 'CEO_Guest');
                // Optional: You could also mock a session in a real auth system here
            }
            
            setIsChecking(false);
        }
    }, [pathname, router]);

    if (isChecking) {
        return <Loading />;
    }

    return <>{children}</>;
}
