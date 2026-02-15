// [FILENAME: src/app/(protected)/dashboard/dashboard-client.tsx]
// [PURPOSE: Warm MindSpace-themed dashboard with serif headings, earthy cards]
// [PHASE: UI Redesign v2 - Warm Theme]

"use client";

import Link from "next/link";
import CountUp from "@/components/ui/count-up";
import { useLanguage } from "@/context/language-context";

interface RecentEntry {
    id: string;
    title: string | null;
    emotion_tag: string | null;
    created_at: string;
}

interface DashboardClientProps {
    displayName: string;
    entryCount: number;
    recentEntries: RecentEntry[];
}

const emotionEmojis: Record<string, string> = {
    joy: "😊", sadness: "😢", anxiety: "😰", anger: "😠",
    calm: "😌", gratitude: "🙏", love: "❤️", confused: "😕",
    hopeful: "🌱", neutral: "📝",
};

export default function DashboardClient({
    displayName,
    entryCount,
    recentEntries,
}: DashboardClientProps) {
    const { t, language } = useLanguage();

    // Format date based on selected language
    const locale = language === 'hi' ? 'hi-IN' : 'en-US';

    const today = new Date().toLocaleDateString(locale, {
        weekday: "long", month: "long", day: "numeric",
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale, { month: "short", day: "numeric" });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 fade-in-up">
            {/* Header */}
            <div>
                <p className="text-sm text-[#8ca69e] uppercase tracking-widest font-medium">{today}</p>
                <h1 className="serif-text text-3xl md:text-4xl font-light mt-2 leading-tight">
                    {t.dashboard.greeting}, {displayName}
                </h1>
                <p className="text-foreground/60 mt-2 font-light">
                    {t.dashboard.dailyQuote}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label={t.dashboard.recentEntries} value={entryCount} icon="edit_note" />
                <StatCard label="Day Streak" value={entryCount > 0 ? 1 : 0} icon="local_fire_department" />
                <StatCard label={t.journal.moodScore} value={7.2} icon="sentiment_satisfied" suffix="/10" />
                <StatCard label="This Week" value={Math.min(entryCount, 7)} icon="date_range" />
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link href="/journal/new" className="group">
                    <div className="relative overflow-hidden rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-8 transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 h-full">
                        <div className="mb-6 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">edit_note</span>
                        </div>
                        <h3 className="serif-text text-xl font-bold mb-2">{t.dashboard.newEntry}</h3>
                        <p className="text-foreground/60 font-light text-sm">
                            {t.journal.subtitle}
                        </p>
                    </div>
                </Link>

                <Link href="/talk" className="group">
                    <div className="relative overflow-hidden rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-8 transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 h-full">
                        <div className="mb-6 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">mic</span>
                        </div>
                        <h3 className="serif-text text-xl font-bold mb-2">{t.talk.title}</h3>
                        <p className="text-foreground/60 font-light text-sm">
                            {t.talk.subtitle}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Recent Entries */}
            <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="serif-text text-xl font-bold">{t.dashboard.recentEntries}</h2>
                    {recentEntries.length > 0 && (
                        <Link href="/journal" className="text-primary text-sm font-medium hover:underline">
                            {t.dashboard.viewAll} →
                        </Link>
                    )}
                </div>

                <div className="space-y-4">
                    {recentEntries.length === 0 ? (
                        <p className="text-[#8ca69e] italic">{t.dashboard.noEntries}</p>
                    ) : (
                        recentEntries.map((entry) => (
                            <Link key={entry.id} href={`/journal/${entry.id}`}>
                                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 border border-transparent hover:border-[#8ca69e]/20 transition-all group">
                                    <div>
                                        <h3 className="font-medium text-[#064e3b] group-hover:text-primary transition-colors">
                                            {emotionEmojis[entry.emotion_tag || "neutral"] || "📝"} {entry.title || "Untitled Entry"}
                                        </h3>
                                        <p className="text-xs text-[#8ca69e] mt-1">{formatDate(entry.created_at)}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#8ca69e]/50 group-hover:text-primary transition-colors">
                                        chevron_right
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
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
