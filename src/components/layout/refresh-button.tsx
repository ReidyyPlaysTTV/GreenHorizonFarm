
"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";
import { useState } from "react";

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        // A short timeout to give visual feedback
        setTimeout(() => setIsRefreshing(false), 500);
    }

    return (
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
        </Button>
    )
}
