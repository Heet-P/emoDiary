# [FILENAME: app/models/database.py]
# [PURPOSE: Supabase client initialization]
# [DEPENDENCIES: supabase, app.config]
# [PHASE: Phase 1 - Scaffolding]

from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client using service role key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)
