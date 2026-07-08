
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export function HeaderClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null;

    return (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-3 px-6 py-2.5 bg-black/40 backdrop-blur-xl border border-primary/20 rounded-full shadow-2xl shadow-primary/10">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            <div className="flex items-center gap-2 font-black tracking-[0.2em] text-[10px] uppercase">
                <Clock className="h-3 w-3 text-primary opacity-60" />
                <span className="text-white/90">System Time:</span>
                <span className="text-primary text-sm tabular-nums">
                    {format(time, "HH:mm:ss")}
                </span>
            </div>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {format(time, "EEE, MMM dd")}
            </span>
        </div>
    );
}
