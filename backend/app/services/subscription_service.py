from app.models.database import get_supabase_client
from typing import Dict, Any

FREE_JOURNAL_LIMIT = 14
FREE_VOICE_SESSION_LIMIT = 4

async def get_usage_status(user_id: str) -> Dict[str, Any]:
    """Get current usage stats and subscription level for a user."""
    supabase = get_supabase_client()
    
    # 1. Get profile/subscription data
    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    prof_data = profile.data or {}
    
    is_premium = prof_data.get("is_premium", False)
    
    # 2. Get journal entry count
    journal_count_res = supabase.table("journal_entries").select("id", count="exact").eq("user_id", user_id).execute()
    journal_count = journal_count_res.count or 0
    
    # 3. Get voice session count
    # Note: we check all sessions with mode='voice'
    voice_count_res = supabase.table("chat_sessions").select("id", count="exact").eq("user_id", user_id).eq("mode", "voice").execute()
    voice_count = voice_count_res.count or 0
    
    return {
        "is_premium": is_premium,
        "subscription_tier": prof_data.get("subscription_tier", "free"),
        "usage": {
            "journal_entries": {
                "count": journal_count,
                "limit": -1 if is_premium else FREE_JOURNAL_LIMIT,
                "exceeded": not is_premium and journal_count >= FREE_JOURNAL_LIMIT
            },
            "voice_sessions": {
                "count": voice_count,
                "limit": -1 if is_premium else FREE_VOICE_SESSION_LIMIT,
                "exceeded": not is_premium and voice_count >= FREE_VOICE_SESSION_LIMIT
            }
        }
    }

async def can_create_journal(user_id: str) -> bool:
    """Check if user can create another journal entry."""
    status = await get_usage_status(user_id)
    if status["is_premium"]:
        return True
    return status["usage"]["journal_entries"]["count"] < FREE_JOURNAL_LIMIT

async def can_start_voice_session(user_id: str) -> bool:
    """Check if user can start another voice session."""
    status = await get_usage_status(user_id)
    if status["is_premium"]:
        return True
    return status["usage"]["voice_sessions"]["count"] < FREE_VOICE_SESSION_LIMIT
