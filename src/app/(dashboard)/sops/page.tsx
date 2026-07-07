import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from "@/components/layout/refresh-button";
import { getSopLink } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function SOPsPage() {
  const googleSlidesEmbedUrl = await getSopLink();

  return (
    <div className="flex flex-col h-full">
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Farm Guidelines & SOPs</h1>
                    <p className="text-muted-foreground">
                    Official operating procedures for all Green Horizon personnel.
                    </p>
                </div>
                <RefreshButton />
            </div>
        </div>

      <div className="flex-1 px-4 md:px-8 pb-8">
        <Card className="overflow-hidden h-full">
            <CardContent className="p-0 h-full">
            {googleSlidesEmbedUrl ? (
                <iframe
                    src={googleSlidesEmbedUrl}
                    frameBorder="0"
                    width="100%"
                    height="100%"
                    allowFullScreen={true}
                    className="h-full w-full"
                >
                    Loading SOPs...
                </iframe>
            ) : (
                <div className="h-full flex items-center justify-center p-8">
                    <Alert variant="destructive" className="max-w-md">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>SOPs Not Configured</AlertTitle>
                        <AlertDescription>
                            The link for the Farm Standard Operating Procedures has not been set.
                            An administrator can set this in the{' '}
                            <Link href="/admin" className="font-bold underline">
                                Admin Panel
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
