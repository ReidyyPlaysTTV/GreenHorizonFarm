import { getPersonnel, getApplications, getRecentActivity } from "@/lib/actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const personnel = await getPersonnel();
  const applications = await getApplications();
  const recentActivity = await getRecentActivity();

  return <DashboardClient personnel={personnel} applications={applications} recentActivity={recentActivity} />;
}
