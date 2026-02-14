// [FILENAME: src/lib/constants.ts]
// [PURPOSE: Application-wide constants]
// [DEPENDENCIES: none]
// [PHASE: Phase 1 - Scaffolding]

export const APP_NAME = "emoDiary";
export const APP_DESCRIPTION = "Your empathetic mental health companion";

export const SUPPORTED_LANGUAGES = ["en", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    en: "English",
    hi: "हिन्दी",
};

// Session limits
export const MAX_SESSION_DURATION_S = 300; // 5 minutes
export const MAX_CONVERSATION_TURNS = 10;

// Emotion tags available for manual selection
export const EMOTION_TAGS = [
    "happy",
    "sad",
    "anxious",
    "angry",
    "calm",
    "grateful",
    "confused",
    "hopeful",
    "tired",
    "neutral",
] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];
