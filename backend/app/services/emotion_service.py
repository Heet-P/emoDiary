# [FILENAME: app/services/emotion_service.py]
# [PURPOSE: Emotion detection & sentiment analysis using TextBlob + Groq]
# [DEPENDENCIES: textblob, groq, supabase]
# [PHASE: Phase 5 - Emotion Detection]

import json
from typing import Optional
from textblob import TextBlob
from groq import Groq

from app.config import get_settings
from app.models.database import get_supabase_client


# ── Emotion vocabulary ──
EMOTION_LIST = [
    "joy", "sadness", "anger", "fear", "anxiety",
    "calm", "gratitude", "love", "hope", "confusion",
    "loneliness", "excitement", "frustration", "guilt", "neutral",
]


def _get_groq_client() -> Groq:
    settings = get_settings()
    return Groq(api_key=settings.groq_api_key)


def _textblob_sentiment(text: str) -> float:
    """Get sentiment polarity from TextBlob (-1.0 to 1.0)."""
    blob = TextBlob(text)
    return round(blob.sentiment.polarity, 3)


async def analyze_emotions_with_ai(text: str) -> dict:
    """
    Use Groq Llama to detect nuanced emotions from text.
    Returns dict with emotions (name -> confidence) and primary_emotion.
    Falls back to TextBlob-only analysis if Groq fails.
    """
    try:
        client = _get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an emotion analysis engine. Analyze the given text and output "
                        "ONLY a JSON object with exactly two keys:\n"
                        '1. "emotions": an object mapping emotion names to confidence scores (0.0-1.0). '
                        f"Use ONLY these emotions: {', '.join(EMOTION_LIST)}. "
                        "Include only emotions with confidence > 0.1.\n"
                        '2. "primary_emotion": the single most dominant emotion.\n'
                        "Output ONLY valid JSON, no markdown, no explanation."
                    ),
                },
                {"role": "user", "content": text[:1500]},  # cap input length
            ],
            max_tokens=200,
            temperature=0.1,  # low temp for consistent structured output
        )

        raw = response.choices[0].message.content.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        result = json.loads(raw)
        emotions = result.get("emotions", {})
        primary = result.get("primary_emotion", "neutral")

        # Validate primary_emotion is in our list
        if primary not in EMOTION_LIST:
            primary = max(emotions, key=emotions.get, default="neutral")

        return {"emotions": emotions, "primary_emotion": primary}

    except Exception as e:
        print(f"Groq emotion analysis failed, using TextBlob fallback: {e}")
        return _fallback_analysis(text)


def _fallback_analysis(text: str) -> dict:
    """TextBlob-only fallback for emotion detection."""
    polarity = _textblob_sentiment(text)

    if polarity > 0.3:
        primary = "joy"
        emotions = {"joy": round(polarity, 2), "calm": round(polarity * 0.5, 2)}
    elif polarity < -0.3:
        primary = "sadness"
        emotions = {"sadness": round(abs(polarity), 2), "anxiety": round(abs(polarity) * 0.4, 2)}
    elif polarity < -0.1:
        primary = "frustration"
        emotions = {"frustration": round(abs(polarity), 2)}
    else:
        primary = "neutral"
        emotions = {"neutral": 0.8}

    return {"emotions": emotions, "primary_emotion": primary}


async def analyze_and_store(
    user_id: str,
    source_type: str,
    source_id: str,
    text: str,
) -> dict:
    """
    Full pipeline: sentiment + AI emotion detection → store in DB.
    Called automatically when journal entries are created/updated.
    """
    supabase = get_supabase_client()

    # Get sentiment score
    sentiment_score = _textblob_sentiment(text)

    # Get AI emotion analysis
    emotion_result = await analyze_emotions_with_ai(text)

    # Upsert — delete existing analysis for this source, then insert fresh
    supabase.table("emotion_analyses").delete().eq(
        "source_id", source_id
    ).eq("source_type", source_type).execute()

    result = supabase.table("emotion_analyses").insert({
        "user_id": user_id,
        "source_type": source_type,
        "source_id": source_id,
        "sentiment_score": sentiment_score,
        "emotions": emotion_result["emotions"],
        "primary_emotion": emotion_result["primary_emotion"],
    }).execute()

    if not result.data:
        raise Exception("Failed to store emotion analysis")

    return result.data[0]


async def get_analysis_for_source(source_type: str, source_id: str) -> Optional[dict]:
    """Get emotion analysis for a specific journal entry or chat session."""
    supabase = get_supabase_client()
    result = (
        supabase.table("emotion_analyses")
        .select("*")
        .eq("source_type", source_type)
        .eq("source_id", source_id)
        .execute()
    )
    return result.data[0] if result.data else None


async def get_user_emotion_history(user_id: str, limit: int = 30) -> list[dict]:
    """Get recent emotion analyses for a user, for trends/visualization."""
    supabase = get_supabase_client()
    result = (
        supabase.table("emotion_analyses")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []
