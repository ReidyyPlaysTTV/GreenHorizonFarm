
"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/components/layout/auth-provider";
import { TimedOutProvider } from "@/components/layout/timed-out-provider";

export function DashboardClientLayout({ children }: { children: React.ReactNode}) {
    return (
        <SidebarProvider>
            <AuthProvider>
                <TimedOutProvider>
                    <div className="flex min-h-screen">
                        <SidebarNav />
                        <main className="flex-1 overflow-auto">
                        {children}
                        </main>
                    </div>
                </TimedOutProvider>
            </AuthProvider>
        </SidebarProvider>
    )
}
