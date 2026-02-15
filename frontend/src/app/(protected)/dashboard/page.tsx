// [FILENAME: src/app/(protected)/dashboard/page.tsx]
// [PURPOSE: MindSpace-styled dashboard with CountUp stats, gradient action cards]
// [PHASE: UI Redesign]

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .single();

    const displayName = profile?.display_name || "there";

    // Get entry count
    const { count: entryCount } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

    // Get recent entries
    const { data: recentEntries } = await supabase
        .from("journal_entries")
        .select("id, title, emotion_tag, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <DashboardClient
            displayName={displayName}
            entryCount={entryCount ?? 0}
            recentEntries={recentEntries ?? []}
        />
    );
}
