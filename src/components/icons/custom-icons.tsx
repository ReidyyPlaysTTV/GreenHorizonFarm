
import { cn } from "@/lib/utils";

export const Handcuffs = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={cn("text-muted-foreground", className)}
        {...props}
    >
        <path d="M8 9a3 3 0 0 1 3-3h1"/>
        <path d="M18 9a3 3 0 0 1-3-3h-1"/>
        <path d="m8 9-2 2 4 4 2-2"/>
        <path d="m16 9 2 2-4 4-2-2"/>
        <path d="M12 13V9"/>
        <path d="M10 6H7a3 3 0 0 0-3 3v1"/>
        <path d="M14 6h3a3 3 0 0 1 3 3v1"/>
    </svg>
);

export const Donut = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={cn("text-primary", className)}
        {...props}
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="hsl(var(--background))"/>
        <path d="M19.92 8.35c-.14-.49-.33-.96-.58-1.4l-1.42 1.42c.16.29.29.59.39.9zM5.08 15.65c.14.49.33.96.58 1.4l1.42-1.42c-.16-.29-.29-.59-.39-.9z" fill="#F48FB1"/>
        <path d="M4.66 9.75c-.25.44-.44.91-.58 1.4l1.42 1.42c.1-.31.23-.61.39-.9zM20.34 14.25c.25-.44.44-.91.58-1.4l-1.42-1.42c-.1.31-.23.61-.39-.9z" fill="#F48FB1" opacity="0.6"/>
    </svg>
);

