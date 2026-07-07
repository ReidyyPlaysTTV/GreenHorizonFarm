
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/(dashboard)/loading';
import { useUser } from '@/firebase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useUser();

    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login' && pathname !== '/' && pathname !== '/apply' && pathname !== '/check-status') {
                router.replace('/login');
            } else if (user && pathname === '/login') {
                router.replace('/dashboard');
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return <Loading />;
    }

    return <>{children}</>;
}
