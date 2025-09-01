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
            if (!loggedInUser && pathname !== '/') {
                router.replace('/'); 
            } else {
                setIsChecking(false);
            }
        }
    }, [pathname, router]);

    if (isChecking) {
        return <Loading />;
    }

    return <>{children}</>;
}
