from app.models.database import get_supabase_client
from typing import Dict, Any

async def get_usage_status(user_id: str) -> Dict[str, Any]:
    """Get current usage stats and subscription level for a user."""
    supabase = get_supabase_client()
    
    # Usage counts are still computed for display/analytics,
    # but the product is now completely free: no limits, no paywall.
    
    # Get journal entry count
    journal_count_res = supabase.table("journal_entries").select("id", count="exact").eq("user_id", user_id).execute()
    journal_count = journal_count_res.count or 0
    
    # Get voice session count
    # Note: we check all sessions with mode='voice'
    voice_count_res = supabase.table("chat_sessions").select("id", count="exact").eq("user_id", user_id).eq("mode", "voice").execute()
    voice_count = voice_count_res.count or 0
    
    return {
        "is_premium": True,
        "subscription_tier": "free",
        "usage": {
            "journal_entries": {
                "count": journal_count,
                "limit": -1,
                "exceeded": False
            },
            "voice_sessions": {
                "count": voice_count,
                "limit": -1,
                "exceeded": False
            }
        }
    }

async def can_create_journal(user_id: str) -> bool:
    """Completely free: always allow journal creation."""
    return True

async def can_start_voice_session(user_id: str) -> bool:
    """Completely free: always allow voice sessions."""
    return True
