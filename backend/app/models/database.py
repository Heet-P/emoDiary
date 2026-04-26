from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    """Service-role client — bypasses RLS. Use only for background tasks and admin ops."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_user_supabase_client(access_token: str) -> Client:
    """User-scoped client — RLS enforced via anon key + user JWT."""
    settings = get_settings()
    if not settings.supabase_anon_key:
        raise RuntimeError("SUPABASE_ANON_KEY is not configured. Add it to your .env file.")
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
