
import { getChangelogs } from "@/lib/actions";
import { AddChangelogDialog } from "@/components/changelogs/add-changelog-dialog";
import { ChangelogCard } from "@/components/changelogs/changelog-card";
import { RefreshButton } from "@/components/layout/refresh-button";

export default async function ChangelogsPage() {
  const changelogs = await getChangelogs();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roster Changelogs</h1>
          <p className="text-muted-foreground">
            Updates and patch notes for the application.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <AddChangelogDialog />
            <RefreshButton />
        </div>
      </div>
      
      <div className="space-y-8 max-w-4xl mx-auto">
        {changelogs.length > 0 ? (
            changelogs.map(log => (
                <ChangelogCard key={log.id} changelog={log} />
            ))
        ) : (
             <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
                <p className="text-muted-foreground">No changelogs have been posted yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
