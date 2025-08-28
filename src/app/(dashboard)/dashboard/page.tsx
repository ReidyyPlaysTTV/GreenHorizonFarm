
import { getPersonnel, getApplications, getRecentActivity } from "@/lib/actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

// Helper function to introduce a minimum delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function DashboardPage() {
  // Fetch all data in parallel, but also wait for a minimum of 3 seconds
  // This ensures the loading animation is visible and not just a quick flash.
  const [personnel, applications, recentActivity] = await Promise.all([
    getPersonnel(),
    getApplications(),
    getRecentActivity(),
    wait(3000)
  ]);

  return <DashboardClient personnel={personnel} applications={applications} recentActivity={recentActivity} />;
}
