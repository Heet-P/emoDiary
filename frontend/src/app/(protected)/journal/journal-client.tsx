"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language-context";

interface JournalEntry {
    id: string;
    title: string | null;
    content: string;
    emotion_tag: string | null;
    word_count: number;
    created_at: string;
}

const emotionEmojis: Record<string, string> = {
    joy: "😊", sadness: "😢", anxiety: "😰", anger: "😠",
    calm: "😌", gratitude: "🙏", love: "❤️", confused: "😕",
    hopeful: "🌱", neutral: "📝",
};

function truncate(text: string, max: number) {
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + "…";
}

export default function JournalClient({ entries }: { entries: JournalEntry[] }) {
    const { t, language } = useLanguage();
    const locale = language === 'hi' ? 'hi-IN' : 'en-US';

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale, {
            month: "short", day: "numeric", year: "numeric",
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="serif-text text-3xl md:text-4xl font-light">{t.journal.title}</h1>
                    <p className="text-[#8ca69e] text-sm mt-1">
                        {entries.length} {entries.length === 1 ? (language === 'hi' ? "प्रविष्टि" : "reflection") : (language === 'hi' ? "प्रविष्टियां" : "reflections")}
                    </p>
                </div>
                <Link
                    href="/journal/new"
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    {t.dashboard.newEntry}
                </Link>
            </div>

            {/* Entries */}
            {entries.length === 0 ? (
                <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-[#8ca69e]/30 mb-4 block">
                        auto_stories
                    </span>
                    <h2 className="serif-text text-xl font-light mb-2">{t.dashboard.noEntries}</h2>
                    <p className="text-[#8ca69e] text-sm mb-6">
                        {t.journal.subtitle}
                    </p>
                    <Link
                        href="/journal/new"
                        className="inline-flex items-center gap-2 bg-[#064e3b] text-[#fefcfa] px-6 py-3 rounded-lg font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        {t.journal.title}
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <Link
                            key={entry.id}
                            href={`/journal/${entry.id}`}
                            className="group block rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-6 transition-all hover:border-[#8ca69e]/40 hover:shadow-lg hover:shadow-[#8ca69e]/5"
                        >
                            <div className="flex items-start gap-4">
                                {/* Emotion icon */}
                                <div className="w-11 h-11 rounded-full bg-[#8ca69e]/10 flex items-center justify-center text-xl shrink-0 mt-0.5">
                                    {entry.emotion_tag
                                        ? emotionEmojis[entry.emotion_tag] || "📝"
                                        : "📝"}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className="font-medium text-base group-hover:text-primary transition-colors truncate">
                                            {entry.title || (language === 'hi' ? "शीर्षकहीन" : "Untitled Reflection")}
                                        </h3>
                                        {entry.emotion_tag && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#8ca69e]/10 text-[#8ca69e] capitalize shrink-0">
                                                {entry.emotion_tag}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground/60 font-light leading-relaxed">
                                        {truncate(entry.content, 150)}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-[#8ca69e]">
                                        <span>{formatDate(entry.created_at)}</span>
                                        <span>·</span>
                                        <span>{entry.word_count} {language === 'hi' ? "शब्द" : "words"}</span>
                                    </div>
                                </div>

                                <span className="material-symbols-outlined text-[#8ca69e]/40 group-hover:text-primary/60 transition-colors shrink-0 mt-1">
                                    arrow_forward
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
