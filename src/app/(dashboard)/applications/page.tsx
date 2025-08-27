
import { getApplications } from "@/lib/actions";
import { ApplicationReviewCard } from "@/components/application/application-review-card";
import { ApplicationFormEditor } from "@/components/application/application-form-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshButton } from "@/components/layout/refresh-button";

export default async function ApplicationsPage() {
  const applications = await getApplications();
  const pendingApplications = applications.filter(a => a.status === "Pending");
  const approvedApplications = applications.filter(a => a.status === "Approved");
  const rejectedApplications = applications.filter(a => a.status === "Rejected");

  const ApplicationList = ({ applications }: { applications: (typeof applications) }) => (
    <>
      {applications.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationReviewCard key={app.id} application={app} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No applications found in this category.</p>
        </div>
      )}
    </>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Center</h1>
          <p className="text-muted-foreground">
            Review and manage incoming applications and the application form itself.
          </p>
        </div>
        <RefreshButton />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedApplications.length})</TabsTrigger>
          <TabsTrigger value="denied">Denied ({rejectedApplications.length})</TabsTrigger>
          <TabsTrigger value="edit">Edit Form</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
            <ApplicationList applications={pendingApplications} />
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
            <ApplicationList applications={approvedApplications} />
        </TabsContent>
        <TabsContent value="denied" className="mt-6">
            <ApplicationList applications={rejectedApplications} />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
            <ApplicationFormEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
