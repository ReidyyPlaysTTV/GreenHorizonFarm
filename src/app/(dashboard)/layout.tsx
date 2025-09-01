
import { RouteProtectionProvider } from "./route-protection-provider";
import { DashboardClientLayout } from "./dashboard-client-layout";
import { PermissionsProvider } from "@/hooks/use-permissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider>
      <RouteProtectionProvider>
        <DashboardClientLayout>{children}</DashboardClientLayout>
      </RouteProtectionProvider>
    </PermissionsProvider>
  );
}
