// [FILENAME: src/app/(protected)/dashboard/dashboard-client.tsx]
// [PURPOSE: Warm MindSpace-themed dashboard with serif headings, earthy cards]
// [PHASE: UI Redesign v2 - Warm Theme]

"use client";

import Link from "next/link";
import CountUp from "@/components/ui/count-up";

interface RecentEntry {
    id: string;
    title: string | null;
    mood_before: number | null;
    created_at: string;
}

interface DashboardClientProps {
    displayName: string;
    entryCount: number;
    recentEntries: RecentEntry[];
}

const moodEmojis: Record<number, string> = {
    1: "😞", 2: "😔", 3: "😐", 4: "🙂", 5: "😊",
    6: "😄", 7: "😁", 8: "🥰", 9: "🤩", 10: "🌟",
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function DashboardClient({
    displayName,
    entryCount,
    recentEntries,
}: DashboardClientProps) {
    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
    });

    return (
        <div className="max-w-5xl mx-auto space-y-10 fade-in-up">
            {/* Header */}
            <div>
                <p className="text-sm text-[#8ca69e] uppercase tracking-widest font-medium">{today}</p>
                <h1 className="serif-text text-3xl md:text-4xl font-light mt-2 leading-tight">
                    Good to see you, {displayName}
                </h1>
                <p className="text-foreground/60 mt-2 font-light">
                    How are you feeling in this moment?
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label="Journal Entries" value={entryCount} icon="edit_note" />
                <StatCard label="Day Streak" value={entryCount > 0 ? 1 : 0} icon="local_fire_department" />
                <StatCard label="Mood Score" value={7.2} icon="sentiment_satisfied" suffix="/10" />
                <StatCard label="This Week" value={Math.min(entryCount, 7)} icon="date_range" />
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link href="/journal/new" className="group">
                    <div className="relative overflow-hidden rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-8 transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 h-full">
                        <div className="mb-6 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">edit_note</span>
                        </div>
                        <h3 className="serif-text text-xl font-bold mb-2">New Journal Entry</h3>
                        <p className="text-foreground/60 font-light text-sm">
                            Write about your thoughts and feelings
                        </p>
                    </div>
                </Link>

                <Link href="/talk" className="group">
                    <div className="relative overflow-hidden rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-8 transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 h-full">
                        <div className="mb-6 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">mic</span>
                        </div>
                        <h3 className="serif-text text-xl font-bold mb-2">Start a Conversation</h3>
                        <p className="text-foreground/60 font-light text-sm">
                            Talk with your AI companion
                        </p>
                    </div>
                </Link>
            </div>

            {/* Recent Entries */}
            <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="serif-text text-xl font-bold">Recent Reflections</h2>
                    {recentEntries.length > 0 && (
                        <Link href="/journal" className="text-primary text-sm font-medium hover:underline">
                            View All →
                        </Link>
                    )}
                </div>

                {recentEntries.length === 0 ? (
                    <div className="text-center py-16 text-foreground/50">
                        <span className="material-symbols-outlined text-5xl text-[#8ca69e]/40 mb-4 block">book</span>
                        <p className="serif-text text-lg font-light">No reflections yet.</p>
                        <p className="text-sm mt-1 font-light">Your journey begins with a single thought</p>
                        <Link
                            href="/journal/new"
                            className="inline-block mt-6 text-primary text-sm font-medium hover:underline"
                        >
                            Write your first entry →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentEntries.map((entry) => (
                            <Link
                                key={entry.id}
                                href={`/journal/${entry.id}`}
                                className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#8ca69e]/5 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#8ca69e]/10 flex items-center justify-center text-lg shrink-0">
                                    {entry.mood_before ? moodEmojis[entry.mood_before] || "📝" : "📝"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                        {entry.title || "Untitled Reflection"}
                                    </p>
                                    <p className="text-xs text-[#8ca69e]">
                                        {formatDate(entry.created_at)} · {formatTime(entry.created_at)}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-[#8ca69e] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    arrow_forward
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({
    label,
    value,
    icon,
    suffix = "",
}: {
    label: string;
    value: number;
    icon: string;
    suffix?: string;
}) {
    return (
        <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-6 transition-all hover:border-[#8ca69e]/40 hover:shadow-lg hover:shadow-[#8ca69e]/5">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[#8ca69e] uppercase tracking-wider">{label}</span>
                <div className="w-9 h-9 rounded-full bg-[#8ca69e]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#8ca69e] text-lg">{icon}</span>
                </div>
            </div>
            <div className="flex items-baseline gap-1">
                <CountUp to={value} duration={1.5} className="serif-text text-3xl font-light" />
                {suffix && <span className="text-sm text-[#8ca69e]">{suffix}</span>}
            </div>
        </div>
    );
}
