
import { Donut, Handcuffs } from "@/components/icons/custom-icons";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center gap-4">
            <Handcuffs className="h-12 w-12 animate-cuff-swing origin-top" />
            <Donut className="h-14 w-14 animate-donut-bounce" />
        </div>
      <p className="text-lg text-muted-foreground animate-pulse">Loading Roster...</p>
    </div>
  );
}
