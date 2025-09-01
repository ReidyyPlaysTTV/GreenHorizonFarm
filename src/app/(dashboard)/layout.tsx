
"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PermissionsProvider } from "@/hooks/use-permissions";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/components/layout/auth-provider";
import { TimedOutProvider } from "@/components/layout/timed-out-provider";
import { RouteProtectionProvider } from "./route-protection-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtectionProvider>
        <PermissionsProvider>
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
        </PermissionsProvider>
    </RouteProtectionProvider>
  );
}
