// [FILENAME: src/app/(protected)/journal/new/page.tsx]
// [PURPOSE: New journal entry form with emotion picker and word count]
// [DEPENDENCIES: @/lib/supabase/client]
// [PHASE: Phase 3 - Core Journaling]

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export default function NewJournalEntryPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [emotionTag, setEmotionTag] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Please write something before saving.");
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error("You need to be signed in.");
                return;
            }

            const { error } = await supabase
                .from("journal_entries")
                .insert({
                    user_id: user.id,
                    title: title.trim() || null,
                    content: content.trim(),
                    emotion_tag: emotionTag,
                    word_count: wordCount,
                });

            if (error) {
                console.error("Failed to save entry:", error);
                toast.error("Failed to save. Please try again.");
                return;
            }

            toast.success("Entry saved successfully!");
            router.push("/journal");
            router.refresh();
        } catch (error) {
            console.error("Error saving entry:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/journal"
                        className="inline-flex items-center gap-1 text-sm text-[#8ca69e] hover:text-foreground transition-colors mb-2"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Back to Journal
                    </Link>
                    <h1 className="serif-text text-3xl font-light">New Reflection</h1>
                </div>
            </div>

            {/* Form */}
            <div className="rounded-xl border border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm p-6 md:p-8 space-y-6">
                {/* Title */}
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

                {/* Content */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-2">
                        What&apos;s on your mind?
                    </label>
                    <textarea
                        id="content"
                        placeholder="Let your thoughts flow freely…"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 rounded-lg border border-[#8ca69e]/20 bg-white/80 placeholder:text-[#8ca69e]/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-base leading-relaxed resize-none"
                    />
                    <div className="flex justify-end mt-1.5">
                        <span className="text-xs text-[#8ca69e]">{wordCount} words</span>
                    </div>
                </div>

                {/* Emotion Picker */}
                <div>
                    <label className="block text-sm font-medium mb-3">
                        How are you feeling? <span className="text-[#8ca69e] font-normal">(optional)</span>
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
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Link
                    href="/journal"
                    className="text-sm text-[#8ca69e] hover:text-foreground transition-colors"
                >
                    Discard
                </Link>
                <button
                    onClick={handleSave}
                    disabled={saving || !content.trim()}
                    className="bg-[#064e3b] hover:bg-[#064e3b]/90 text-[#fefcfa] px-8 py-3 rounded-lg font-semibold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                            Saving…
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">save</span>
                            Save Reflection
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
