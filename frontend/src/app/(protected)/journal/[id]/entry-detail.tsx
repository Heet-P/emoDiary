// [FILENAME: src/app/(protected)/journal/[id]/entry-detail.tsx]
// [PURPOSE: Client component for viewing, editing, and deleting a journal entry]
// [DEPENDENCIES: @/lib/supabase/client, sonner]
// [PHASE: Phase 3 - Core Journaling]

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const emotionOptions = [
    { value: "joy", emoji: "😊", label: "Joy" },
    { value: "calm", emoji: "😌", label: "Calm" },
    { value: "gratitude", emoji: "🙏", label: "Gratitude" },
    { value: "love", emoji: "❤️", label: "Love" },
    { value: "hopeful", emoji: "🌱", label: "Hopeful" },
    { value: "neutral", emoji: "😐", label: "Neutral" },
    { value: "confused", emoji: "😕", label: "Confused" },
    { value: "anxiety", emoji: "😰", label: "Anxious" },
    { value: "sadness", emoji: "😢", label: "Sad" },
    { value: "anger", emoji: "😠", label: "Angry" },
];

const emotionEmojis: Record<string, string> = Object.fromEntries(
    emotionOptions.map((o) => [o.value, o.emoji])
);

// Emotion colors for the bar chart
const emotionColors: Record<string, string> = {
    joy: "#f59e0b", sadness: "#6366f1", anger: "#ef4444", fear: "#8b5cf6",
    anxiety: "#f97316", calm: "#10b981", gratitude: "#14b8a6", love: "#ec4899",
    hope: "#22c55e", confusion: "#a855f7", loneliness: "#64748b",
    excitement: "#eab308", frustration: "#dc2626", guilt: "#7c3aed", neutral: "#8ca69e",
};

interface EmotionAnalysis {
    sentiment_score: number;
    emotions: Record<string, number>;
    primary_emotion: string;
}

interface Entry {
    id: string;
    title: string | null;
    content: string;
    emotion_tag: string | null;
    word_count: number;
    created_at: string;
    updated_at: string;
}

export default function JournalEntryDetail({ entry }: { entry: Entry }) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(entry.title || "");
    const [content, setContent] = useState(entry.content);
    const [emotionTag, setEmotionTag] = useState<string | null>(entry.emotion_tag);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(true);

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    const createdDate = new Date(entry.created_at).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const createdTime = new Date(entry.created_at).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit",
    });

    // Fetch emotion analysis
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch(
                    `${API_BASE}/api/emotion/source/journal/${entry.id}`,
                    { headers: { Authorization: `Bearer ${session.access_token}` } }
                );

                if (res.ok) {
                    const data = await res.json();
                    setAnalysis(data);
                }
            } catch {
                // Silently fail — analysis is optional
            } finally {
                setAnalysisLoading(false);
            }
        };

        fetchAnalysis();
    }, [entry.id]);

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Content cannot be empty.");
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("journal_entries")
                .update({
                    title: title.trim() || null,
                    content: content.trim(),
                    emotion_tag: emotionTag,
                    word_count: wordCount,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", entry.id);

            if (error) {
                console.error("Failed to update entry:", error);
                toast.error("Failed to save changes.");
                return;
            }

            toast.success("Changes saved!");
            setEditing(false);
            router.refresh();
        } catch (error) {
            console.error("Error updating entry:", error);
            toast.error("Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("journal_entries")
                .delete()
                .eq("id", entry.id);

            if (error) {
                console.error("Failed to delete entry:", error);
                toast.error("Failed to delete entry.");
                return;
            }

            toast.success("Entry deleted.");
            router.push("/journal");
            router.refresh();
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast.error("Something went wrong.");
        } finally {
            setDeleting(false);
        }
    };

    const handleCancel = () => {
        setTitle(entry.title || "");
        setContent(entry.content);
        setEmotionTag(entry.emotion_tag);
        setEditing(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href="/journal"
                    className="inline-flex items-center gap-1 text-sm text-[#8ca69e] hover:text-foreground transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to Journal
                </Link>
                <div className="flex items-center gap-2">
                    {!editing ? (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#8ca69e] hover:text-foreground hover:bg-[#8ca69e]/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">edit</span>
                                Edit
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">delete</span>
                                Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-[#8ca69e] hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !content.trim()}
                                className="bg-[#064e3b] text-[#fefcfa] px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Card */}
            <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-6 md:p-8 space-y-6">
                {editing ? (
                    /* ── Edit Mode ── */
                    <>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium mb-2">
                                Title <span className="text-[#8ca69e] font-normal">(optional)</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                placeholder="Give this reflection a name…"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                                className="w-full px-4 py-3 rounded-lg border border-[#8ca69e]/20 bg-white/80 placeholder:text-[#8ca69e]/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-base"
                            />
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium mb-2">
                                Content
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={12}
                                className="w-full px-4 py-3 rounded-lg border border-[#8ca69e]/20 bg-white/80 placeholder:text-[#8ca69e]/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-base leading-relaxed resize-none"
                            />
                            <div className="flex justify-end mt-1.5">
                                <span className="text-xs text-[#8ca69e]">{wordCount} words</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3">
                                How are you feeling?
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {emotionOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() =>
                                            setEmotionTag(emotionTag === opt.value ? null : opt.value)
                                        }
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all border ${emotionTag === opt.value
                                            ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                            : "bg-white/60 border-[#8ca69e]/20 text-foreground/70 hover:border-[#8ca69e]/40"
                                            }`}
                                    >
                                        <span>{opt.emoji}</span>
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    /* ── View Mode ── */
                    <>
                        <div className="space-y-3">
                            <h1 className="serif-text text-2xl md:text-3xl font-light">
                                {entry.title || "Untitled Reflection"}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-[#8ca69e]">
                                <span>{createdDate}</span>
                                <span>·</span>
                                <span>{createdTime}</span>
                                <span>·</span>
                                <span>{entry.word_count} words</span>
                                {entry.emotion_tag && (
                                    <>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8ca69e]/10 capitalize">
                                            {emotionEmojis[entry.emotion_tag] || "📝"} {entry.emotion_tag}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-lg max-w-none">
                            <div className="text-base leading-relaxed font-light whitespace-pre-wrap">
                                {entry.content}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* AI Emotion Insight */}
            {!editing && (
                <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-5">
                        <span className="material-symbols-outlined text-lg text-[#8ca69e]">psychology</span>
                        <h2 className="serif-text text-lg font-medium">AI Emotion Insight</h2>
                    </div>

                    {analysisLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[#8ca69e]">
                            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                            Analyzing emotions…
                        </div>
                    ) : analysis ? (
                        <div className="space-y-5">
                            {/* Primary Emotion + Sentiment */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                                    <span className="text-lg">{emotionEmojis[analysis.primary_emotion] || "💭"}</span>
                                    <span className="text-sm font-medium capitalize text-primary">{analysis.primary_emotion}</span>
                                </div>
                                <div className="text-sm text-[#8ca69e]">
                                    Sentiment: <span className={`font-medium ${analysis.sentiment_score > 0.1 ? "text-emerald-600" :
                                            analysis.sentiment_score < -0.1 ? "text-red-500" : "text-[#8ca69e]"
                                        }`}>
                                        {analysis.sentiment_score > 0.1 ? "Positive" :
                                            analysis.sentiment_score < -0.1 ? "Negative" : "Neutral"}
                                        {" "}({(analysis.sentiment_score * 100).toFixed(0)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Emotion Breakdown */}
                            <div className="space-y-2.5">
                                {Object.entries(analysis.emotions)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([emotion, confidence]) => (
                                        <div key={emotion} className="flex items-center gap-3">
                                            <span className="text-sm w-24 capitalize text-foreground/70">{emotion}</span>
                                            <div className="flex-1 h-2.5 rounded-full bg-[#8ca69e]/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.round(confidence * 100)}%`,
                                                        backgroundColor: emotionColors[emotion] || "#8ca69e",
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-[#8ca69e] w-10 text-right">
                                                {Math.round(confidence * 100)}%
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[#8ca69e]">
                            No emotion analysis available yet. Save the entry to trigger analysis.
                        </p>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-[#fefcfa] rounded-xl border border-[#8ca69e]/20 p-8 max-w-sm w-full mx-4 shadow-2xl fade-in-up">
                        <div className="text-center space-y-4">
                            <span className="material-symbols-outlined text-4xl text-red-400">
                                warning
                            </span>
                            <h3 className="serif-text text-xl font-medium">
                                Delete this reflection?
                            </h3>
                            <p className="text-sm text-[#8ca69e]">
                                This cannot be undone. Your thoughts will be permanently removed.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#8ca69e]/20 text-sm font-medium hover:bg-[#8ca69e]/5 transition-colors"
                                >
                                    Keep It
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
