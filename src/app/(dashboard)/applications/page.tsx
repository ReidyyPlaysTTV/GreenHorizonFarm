
import { getApplications, getApplicationStatus } from "@/lib/actions";
import { ApplicationReviewCard } from "@/components/application/application-review-card";
import { ApplicationFormEditor } from "@/components/application/application-form-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshButton } from "@/components/layout/refresh-button";
import { Badge } from "@/components/ui/badge";
import { ToggleApplicationStatus } from "@/components/application/toggle-application-status";

export default async function ApplicationsPage() {
  const [applications, applicationsOpen] = await Promise.all([
    getApplications(),
    getApplicationStatus(),
  ]);
  
  const pendingApplications = applications.filter(a => a.status === "Pending");
  const underReviewApplications = applications.filter(a => a.status === "Under Review");
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
          <div className="flex items-center gap-4">
             <h1 className="text-3xl font-bold tracking-tight">Application Center</h1>
             <Badge variant={applicationsOpen ? "secondary" : "destructive"}>
                Applications are {applicationsOpen ? "Open" : "Closed"}
             </Badge>
          </div>
          <p className="text-muted-foreground">
            Review and manage incoming applications and the application form itself.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ToggleApplicationStatus initialStatus={applicationsOpen} />
            <RefreshButton />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="review">Under Review ({underReviewApplications.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedApplications.length})</TabsTrigger>
          <TabsTrigger value="denied">Denied ({rejectedApplications.length})</TabsTrigger>
          <TabsTrigger value="edit">Edit Form</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
            <ApplicationList applications={pendingApplications} />
        </TabsContent>
         <TabsContent value="review" className="mt-6">
            <ApplicationList applications={underReviewApplications} />
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
