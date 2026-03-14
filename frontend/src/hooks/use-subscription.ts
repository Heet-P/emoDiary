"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UsageData {
    count: number;
    limit: number;
    exceeded: boolean;
}

export interface SubscriptionStatus {
    is_premium: boolean;
    subscription_tier: string;
    usage: {
        journal_entries: UsageData;
        voice_sessions: UsageData;
    };
}

export function useSubscription() {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchStatus = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`${API_BASE}/api/subscription/usage`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch subscription status:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const upgrade = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`${API_BASE}/api/subscription/upgrade`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            if (res.ok) {
                await fetchStatus();
                return true;
            }
        } catch (error) {
            console.error("Failed to upgrade:", error);
        }
        return false;
    };

    return { status, loading, refresh: fetchStatus, upgrade };
}
