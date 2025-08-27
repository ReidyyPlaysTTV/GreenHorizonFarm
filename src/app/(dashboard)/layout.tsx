
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PermissionsProvider } from "@/hooks/use-permissions";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </PermissionsProvider>
  );
}
