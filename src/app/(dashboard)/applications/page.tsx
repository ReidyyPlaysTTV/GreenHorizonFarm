import { applications } from "@/lib/data";
import { ApplicationReviewCard } from "@/components/application/application-review-card";

export default function ApplicationsPage() {
  const pendingApplications = applications.filter(a => a.status === "Pending");
  const reviewedApplications = applications.filter(a => a.status !== "Pending");

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Application Center</h1>
        <p className="text-muted-foreground">
          Review and manage incoming applications.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Pending Review ({pendingApplications.length})</h2>
        {pendingApplications.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingApplications.map((app) => (
              <ApplicationReviewCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No pending applications.</p>
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Reviewed Applications ({reviewedApplications.length})</h2>
        {reviewedApplications.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviewedApplications.map((app) => (
              <ApplicationReviewCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No reviewed applications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
