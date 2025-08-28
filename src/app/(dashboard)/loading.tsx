
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <Image 
        src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png" 
        alt="DOC Logo" 
        width={128} 
        height={128} 
        className="h-32 w-32 animate-pulse"
      />
      <p className="text-lg text-muted-foreground">Retrieving Roster Data...</p>
    </div>
  );
}
