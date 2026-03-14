# [FILENAME: app/services/journal_service.py]
# [PURPOSE: Supabase CRUD operations for journal entries]
# [DEPENDENCIES: supabase, app.models.database]
# [PHASE: Phase 3 - Core Journaling]

from typing import Optional
from app.models.database import get_supabase_client
from app.services.emotion_service import _get_groq_client
import json

async def _generate_journal_analysis(content: str) -> dict:
    """Uses Groq to generate ai_multi_tags and a detailed_sentiment_report."""
    try:
        client = _get_groq_client()
        prompt = (
            "You are an empathetic psychological analyzer. Read the following journal entry "
            "and provide two things:\n"
            "1. 'ai_multi_tags': An array of 1 to 4 nuanced emotion tags (e.g., ['Joyful', 'Nostalgic', 'Anxious']).\n"
            "2. 'detailed_sentiment_report': A 2-3 sentence narrative summarizing the emotional arc of the entry in the second person (e.g., 'You started the day feeling anxious, but found peace by the evening.').\n"
            "Respond ONLY with a valid JSON object containing these two exact keys and nothing else."
        )
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": content[:2000]}
            ],
            temperature=0.3,
            max_tokens=250,
            response_format={"type": "json_object"}
        )
        
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        return {
            "ai_multi_tags": result.get("ai_multi_tags", []),
            "detailed_sentiment_report": result.get("detailed_sentiment_report", "Unable to generate report.")
        }
    except Exception as e:
        print(f"Error generating journal analysis: {e}")
        return {"ai_multi_tags": [], "detailed_sentiment_report": None}


async def create_entry(user_id: str, title: Optional[str], content: str, emotion_tag: Optional[str] = None) -> dict:
    """Create a new journal entry and return the created record."""
    supabase = get_supabase_client()
    word_count = len(content.split())

    data = {
        "user_id": user_id,
        "content": content,
        "word_count": word_count,
    }
    if title is not None:
        data["title"] = title
    if emotion_tag is not None:
        data["emotion_tag"] = emotion_tag

    # Generate AI insights
    analysis = await _generate_journal_analysis(content)
    data["ai_multi_tags"] = analysis["ai_multi_tags"]
    data["detailed_sentiment_report"] = analysis["detailed_sentiment_report"]

    result = supabase.table("journal_entries").insert(data).execute()

    if not result.data:
        raise Exception("Failed to create journal entry")

    return result.data[0]


async def get_entries(user_id: str, limit: int = 20, offset: int = 0) -> list[dict]:
    """List journal entries for a user, newest first."""
    supabase = get_supabase_client()

    result = (
        supabase.table("journal_entries")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return result.data or []


async def get_entry(user_id: str, entry_id: str) -> Optional[dict]:
    """Get a single journal entry. Returns None if not found or not owned by user."""
    supabase = get_supabase_client()

    result = (
        supabase.table("journal_entries")
        .select("*")
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        return None

    return result.data[0]


async def update_entry(
    user_id: str,
    entry_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    emotion_tag: Optional[str] = None,
) -> Optional[dict]:
    """Update a journal entry. Returns updated record or None if not found."""
    supabase = get_supabase_client()

    updates: dict = {}
    if title is not None:
        updates["title"] = title
    if content is not None:
        updates["content"] = content
        updates["word_count"] = len(content.split())
    if emotion_tag is not None:
        updates["emotion_tag"] = emotion_tag

    # Re-analyze if content changed
    if content is not None:
        analysis = await _generate_journal_analysis(content)
        updates["ai_multi_tags"] = analysis["ai_multi_tags"]
        updates["detailed_sentiment_report"] = analysis["detailed_sentiment_report"]

    if not updates:
        return await get_entry(user_id, entry_id)

    updates["updated_at"] = "now()"

    result = (
        supabase.table("journal_entries")
        .update(updates)
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        return None

    return result.data[0]


async def delete_entry(user_id: str, entry_id: str) -> bool:
    """Delete a journal entry. Returns True if deleted."""
    supabase = get_supabase_client()

    result = (
        supabase.table("journal_entries")
        .delete()
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )

    return bool(result.data)


async def get_entry_count(user_id: str) -> int:
    """Get total count of journal entries for a user."""
    supabase = get_supabase_client()

    result = (
        supabase.table("journal_entries")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )

    return result.count or 0
