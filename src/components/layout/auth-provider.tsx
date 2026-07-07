
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/(dashboard)/loading';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const user = typeof window !== 'undefined' ? localStorage.getItem('loggedInUser') : null;
            
            const isPublicRoute = ['/login', '/', '/apply', '/check-status'].includes(pathname);
            
            if (!user && !isPublicRoute) {
                router.replace('/login');
            } else if (user && pathname === '/login') {
                router.replace('/dashboard');
            }
            
            setIsAuthenticated(!!user);
            setIsLoading(false);
        };

        checkAuth();
    }, [pathname, router]);

    if (isLoading) {
        return <Loading />;
    }

    return <>{children}</>;
}
