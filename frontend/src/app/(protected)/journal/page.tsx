import { createClient } from "@/lib/supabase/server";
import JournalClient from "./journal-client";

export default async function JournalPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: entries } = await supabase
        .from("journal_entries")
        .select("id, title, content, emotion_tag, word_count, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

    const journalEntries = entries ?? [];

    return <JournalClient entries={journalEntries} />;
}
