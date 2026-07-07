import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <Image 
        src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
        alt="Green Horizon Logo" 
        width={128} 
        height={128} 
        className="h-32 w-32 animate-pulse"
      />
      <p className="text-lg text-muted-foreground">Preparing Farm Data...</p>
    </div>
  );
}
