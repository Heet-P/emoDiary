# [FILENAME: app/services/journal_service.py]
# [PURPOSE: Supabase CRUD operations for journal entries]
# [DEPENDENCIES: supabase, app.models.database]
# [PHASE: Phase 3 - Core Journaling]

from typing import Optional
from app.models.database import get_supabase_client


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
