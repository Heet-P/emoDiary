// [FILENAME: src/app/(protected)/dashboard/dashboard-client.tsx]
// [PURPOSE: Editorial brutalist dashboard matching MindSpace design mockup]

"use client";

import Link from "next/link";
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
    const locale = language === "hi" ? "hi-IN" : "en-US";

    // Recent-entries delta (entries this week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = recentEntries.filter(
        (e) => new Date(e.created_at) >= oneWeekAgo
    ).length;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString(locale, { month: "short", day: "numeric" });

    return (
        // Full-bleed cream canvas
        <div className="min-h-screen bg-[#f0ebe0]" style={{ margin: "-24px", padding: "32px" }}>
            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── Greeting ── */}
                <div className="pt-4">
                    <h1
                        className="text-5xl md:text-6xl font-black uppercase leading-none tracking-tight text-[#1a2e22]"
                        style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}
                    >
                        {language === "hi" ? "नमस्ते" : "Hello,"}&nbsp;{displayName.toUpperCase()}
                    </h1>
                    <p className="mt-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#8ca69e]">
                        {language === "hi" ? "आपका माइंडफुल स्पेस तैयार है।" : "Your mindful space is ready for you."}
                    </p>
                </div>

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Recent Entries — white */}
                    <div className="border-2 border-[#1a2e22] bg-white p-5 flex flex-col justify-between min-h-[110px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca69e]">
                            {t.dashboard.recentEntries}
                        </p>
                        <div className="flex items-baseline gap-2 mt-3">
                            <span className="text-5xl font-black text-[#1a2e22]" style={{ fontFamily: "Georgia, serif" }}>
                                {entryCount}
                            </span>
                            {thisWeekCount > 0 && (
                                <span className="text-xs text-[#8ca69e] font-medium">
                                    +{thisWeekCount} this week
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Day Streak — amber/golden */}
                    <div className="border-2 border-[#1a2e22] bg-[#c9a84c] p-5 flex flex-col justify-between min-h-[110px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a2e22]">
                            Day Streak
                        </p>
                        <div className="flex items-baseline gap-2 mt-3">
                            <span className="text-5xl font-black text-[#1a2e22]" style={{ fontFamily: "Georgia, serif" }}>
                                {Math.max(thisWeekCount, entryCount > 0 ? 1 : 0)}
                            </span>
                            <span className="text-xs font-bold uppercase text-[#1a2e22]">Days</span>
                        </div>
                    </div>

                    {/* Mood Score — white */}
                    <div className="border-2 border-[#1a2e22] bg-white p-5 flex flex-col justify-between min-h-[110px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca69e]">
                            Mood Score
                        </p>
                        <div className="flex items-baseline gap-2 mt-3">
                            <span className="text-5xl font-black text-[#1a2e22]" style={{ fontFamily: "Georgia, serif" }}>
                                7.5
                            </span>
                            <span className="text-xs font-bold uppercase text-[#8ca69e]">Stable</span>
                        </div>
                    </div>

                    {/* This Week — light grey/cream */}
                    <div className="border-2 border-[#1a2e22] bg-[#e8e2d4] p-5 flex flex-col justify-between min-h-[110px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca69e]">
                            This Week
                        </p>
                        <div className="flex items-baseline gap-2 mt-3">
                            <span className="text-5xl font-black text-[#1a2e22]" style={{ fontFamily: "Georgia, serif" }}>
                                {thisWeekCount}
                            </span>
                            <span className="text-xs font-bold uppercase text-[#8ca69e]">Hrs</span>
                        </div>
                    </div>
                </div>

                {/* ── Action Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* New Entry — dark green */}
                    <Link href="/journal/new" className="group">
                        <div className="border-2 border-[#1a2e22] bg-[#1a2e22] p-8 flex flex-col justify-between min-h-[200px] transition-all hover:bg-[#0f1f17] relative overflow-hidden">
                            {/* Icon */}
                            <div className="w-12 h-12 border-2 border-[#c9a84c] flex items-center justify-center text-[#c9a84c]">
                                <span className="material-symbols-outlined text-xl">edit_note</span>
                            </div>
                            {/* Text */}
                            <div>
                                <h3 className="text-2xl font-black uppercase text-white mt-6 tracking-tight"
                                    style={{ fontFamily: "Georgia, serif" }}>
                                    {language === "hi" ? "नई प्रविष्टि" : "New Entry"}
                                </h3>
                                <p className="text-sm text-[#8ca69e] mt-1">
                                    {language === "hi" ? "अपने आज के विचार और भावनाएँ लिखें।" : "Record your thoughts and feelings for today."}
                                </p>
                            </div>
                            {/* Arrow */}
                            <span className="absolute bottom-6 right-6 text-[#c9a84c] text-2xl font-bold transition-transform group-hover:translate-x-1">
                                →
                            </span>
                        </div>
                    </Link>

                    {/* Voice Chat — amber/golden */}
                    <Link href="/talk" className="group">
                        <div className="border-2 border-[#1a2e22] bg-[#c9a84c] p-8 flex flex-col justify-between min-h-[200px] transition-all hover:bg-[#b8953e] relative overflow-hidden">
                            {/* Icon */}
                            <div className="w-12 h-12 border-2 border-[#1a2e22] flex items-center justify-center text-[#1a2e22]">
                                <span className="material-symbols-outlined text-xl">mic</span>
                            </div>
                            {/* Text */}
                            <div>
                                <h3 className="text-2xl font-black uppercase text-[#1a2e22] mt-6 tracking-tight"
                                    style={{ fontFamily: "Georgia, serif" }}>
                                    {language === "hi" ? "वॉइस चैट" : "Voice Chat"}
                                </h3>
                                <p className="text-sm text-[#1a2e22]/70 mt-1">
                                    {language === "hi" ? "हमारे AI साथी से बात करें।" : "Talk through your day with our AI companion."}
                                </p>
                            </div>
                            {/* Arrow */}
                            <span className="absolute bottom-6 right-6 text-[#1a2e22] text-2xl font-bold transition-transform group-hover:translate-x-1">
                                →
                            </span>
                        </div>
                    </Link>
                </div>

                {/* ── Secondary Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Insights */}
                    <Link href="/insights" className="group">
                        <div className="border-2 border-[#1a2e22] bg-white p-8 flex flex-col justify-between min-h-[160px] transition-all hover:bg-[#f7f3eb] relative">
                            <div className="w-10 h-10 border-2 border-[#8ca69e] flex items-center justify-center text-[#8ca69e]">
                                <span className="material-symbols-outlined text-lg">insights</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase text-[#1a2e22] mt-4 tracking-tight"
                                    style={{ fontFamily: "Georgia, serif" }}>
                                    {language === "hi" ? "इनसाइट्स" : "Insights"}
                                </h3>
                                <p className="text-xs text-[#8ca69e] mt-1">
                                    {language === "hi" ? "अपनी भावनात्मक यात्रा देखें।" : "View your emotional patterns."}
                                </p>
                            </div>
                            <span className="absolute bottom-5 right-5 text-[#8ca69e] text-xl font-bold transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </Link>

                    {/* Recent Entries list */}
                    <div className="border-2 border-[#1a2e22] bg-[#e8e2d4] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca69e]">
                                {t.dashboard.recentEntries}
                            </p>
                            <Link href="/journal" className="text-[10px] font-bold uppercase tracking-widest text-[#8ca69e] hover:text-[#1a2e22] transition-colors">
                                {t.dashboard.viewAll} →
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentEntries.length === 0 ? (
                                <p className="text-xs text-[#8ca69e] italic">{t.dashboard.noEntries}</p>
                            ) : (
                                recentEntries.slice(0, 4).map((entry) => (
                                    <Link key={entry.id} href={`/journal/${entry.id}`}>
                                        <div className="flex items-center justify-between py-2 border-b border-[#1a2e22]/10 hover:border-[#1a2e22]/30 transition-colors group">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm flex-shrink-0">
                                                    {emotionEmojis[entry.emotion_tag || "neutral"] || "📝"}
                                                </span>
                                                <span className="text-xs font-semibold text-[#1a2e22] truncate uppercase tracking-wide">
                                                    {entry.title || "Untitled Entry"}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-[#8ca69e] ml-2 flex-shrink-0">
                                                {formatDate(entry.created_at)}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
