
import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from "@/components/layout/refresh-button";

export default function SOPsPage() {
  // IMPORTANT: Replace this with your own Google Slides embed URL.
  // To get the URL: In Google Slides, go to File > Share > Publish to web.
  // Click "Embed", choose your options, and click "Publish".
  // Copy the `src` URL from the generated iframe code.
  const googleSlidesEmbedUrl = "https://docs.google.com/presentation/d/1jjUe1Jx2odazolqiyGnuCiEVEE3NPrHQVMn3_cw9A2s/embed?start=false&loop=false&delayms=3000";

  return (
    <div className="flex flex-col h-full">
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">DOC Standard Operating Procedures</h1>
                    <p className="text-muted-foreground">
                    Official guidelines and procedures for all personnel.
                    </p>
                </div>
                <RefreshButton />
            </div>
        </div>

      <div className="flex-1 px-4 md:px-8 pb-8">
        <Card className="overflow-hidden h-full">
            <CardContent className="p-0 h-full">
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
