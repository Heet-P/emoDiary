"use client";

import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/use-subscription";

interface UsageIndicatorProps {
    type: "journal_entries" | "voice_sessions";
    label: string;
}

export function UsageIndicator({ type, label }: UsageIndicatorProps) {
    const { status, loading } = useSubscription();

    if (loading || !status) return null;

    const usage = status.usage[type];
    if (usage.limit === -1) return null; // Hide for premium

    const percent = Math.min((usage.count / usage.limit) * 100, 100);
    const isClose = usage.count >= usage.limit - 2;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#8ca69e]">
                <span>{label}</span>
                <span>{usage.count} / {usage.limit}</span>
            </div>
            <div className="h-1.5 w-full bg-[#8ca69e]/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={`h-full rounded-full ${isClose ? "bg-amber-500" : "bg-[#10b981]"}`}
                />
            </div>
            {usage.exceeded && (
                <p className="text-[10px] text-red-500 font-medium">Limit reached. Please upgrade.</p>
            )}
        </div>
    );
}
