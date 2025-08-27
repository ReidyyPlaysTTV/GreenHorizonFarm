import { getPersonnel, getApplications } from "@/lib/actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const personnel = await getPersonnel();
  const applications = await getApplications();

  return <DashboardClient personnel={personnel} applications={applications} />;
}
