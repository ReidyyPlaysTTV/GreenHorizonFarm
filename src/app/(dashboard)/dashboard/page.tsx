
import { getPersonnel, getApplications, getRecentActivity } from "@/lib/actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  // Fetch all data in parallel. The loading.tsx file will be displayed until all data is resolved.
  const [personnel, applications, recentActivity] = await Promise.all([
    getPersonnel(),
    getApplications(),
    getRecentActivity(),
  ]);

  return <DashboardClient personnel={personnel} applications={applications} recentActivity={recentActivity} />;
}
