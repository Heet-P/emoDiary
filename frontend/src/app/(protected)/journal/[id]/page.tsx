// [FILENAME: src/app/(protected)/journal/[id]/page.tsx]
// [PURPOSE: Journal entry detail page with view/edit/delete functionality]
// [DEPENDENCIES: @/lib/supabase/server]
// [PHASE: Phase 3 - Core Journaling]

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JournalEntryDetail from "./entry-detail";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function JournalEntryPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: entry } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

    if (!entry) {
        notFound();
    }

    return <JournalEntryDetail entry={entry} />;
}
