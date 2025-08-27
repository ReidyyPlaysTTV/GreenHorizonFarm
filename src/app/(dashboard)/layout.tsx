
"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PermissionsProvider } from "@/hooks/use-permissions";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function TimedOutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleIdle = () => {
    localStorage.removeItem('loggedInUser');
    router.push('/login');
    toast({
      title: "Session Expired",
      description: "You have been logged out due to inactivity.",
      variant: "destructive",
    });
  };

  useIdleTimeout({ onIdle: handleIdle, idleTime: 30 }); // 30 minutes

  return <>{children}</>;
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider>
      <SidebarProvider>
        <TimedOutProvider>
          <div className="flex min-h-screen">
            <SidebarNav />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </TimedOutProvider>
      </SidebarProvider>
    </PermissionsProvider>
  );
}
