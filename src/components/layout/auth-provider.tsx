
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/(dashboard)/loading';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (typeof window !== 'undefined') {
                // TEMPORARY DEBUG BYPASS: 
                // Force auth to Leon Green to allow database testing without a working DB connection.
                localStorage.setItem('loggedInUser', 'Leon Green');
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [pathname, router]);

    if (isLoading) {
        return <Loading />;
    }

    return <>{children}</>;
}
