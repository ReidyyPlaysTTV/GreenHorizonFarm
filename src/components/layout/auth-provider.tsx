
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/(dashboard)/loading';

const PUBLIC_ROUTES = ['/', '/login', '/request-access', '/apply', '/order', '/check-status', '/maintenance', '/banned'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (typeof window !== 'undefined') {
                const loggedInUser = localStorage.getItem('loggedInUser');
                
                // If not logged in and trying to access a protected route, redirect to login
                if (!loggedInUser && !PUBLIC_ROUTES.includes(pathname)) {
                    router.replace('/login');
                }
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
