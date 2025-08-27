import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal } from "lucide-react";

export default function SOPsPage() {
  // IMPORTANT: Replace this with your own Google Slides embed URL.
  // To get the URL: In Google Slides, go to File > Share > Publish to web.
  // Click "Embed", choose your options, and click "Publish".
  // Copy the `src` URL from the generated iframe code.
  const googleSlidesEmbedUrl = "https://docs.google.com/presentation/d/e/2PACX-1vTOa-M-hBBO6yQakeeYQ_Jt3iS_2b2sX0Cq8i_a-1_AIpB3sH_a-1_AIpB3sH_a-1_AIpB3sH_a-1/embed?start=false&loop=false&delayms=3000";

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">DOC Standard Operating Procedures</h1>
        <p className="text-muted-foreground">
          Official guidelines and procedures for all personnel.
        </p>
      </div>
      
      <Alert className="mb-6">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Note for Admins</AlertTitle>
        <AlertDescription>
          To display your SOPs, you must update the placeholder URL in the file: <code>src/app/(dashboard)/sops/page.tsx</code>
        </AlertDescription>
      </Alert>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-video w-full">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
