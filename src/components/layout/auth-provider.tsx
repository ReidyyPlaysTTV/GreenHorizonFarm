
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/(dashboard)/loading';

const PUBLIC_ROUTES = ['/', '/login', '/request-access', '/apply', '/order', '/check-status', '/maintenance', '/banned'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            if (typeof window !== 'undefined') {
                const loggedInUser = localStorage.getItem('loggedInUser');
                const isPublic = PUBLIC_ROUTES.includes(pathname);
                
                if (!loggedInUser && !isPublic) {
                    // Force immediate redirect without rendering children
                    router.replace('/login');
                } else {
                    setIsAuthenticated(!!loggedInUser);
                    setIsLoading(false);
                }
            }
        };

        checkAuth();
    }, [pathname, router]);

    // While checking or if we are about to redirect, show nothing but the loader
    // to prevent dashboard elements from leaking into the login flow.
    if (isLoading || (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname))) {
        return <Loading />;
    }

    return <>{children}</>;
}
