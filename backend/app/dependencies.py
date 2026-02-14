# [FILENAME: app/dependencies.py]
# [PURPOSE: FastAPI dependency injection for auth, DB, and caching]
# [DEPENDENCIES: fastapi, supabase, app.config]
# [PHASE: Phase 1 - Scaffolding (auth will be added in Phase 2)]

from fastapi import Depends, HTTPException, Header
from typing import Optional

from app.config import get_settings, Settings
from app.models.database import get_supabase_client


def get_settings_dep() -> Settings:
    """Dependency to inject settings."""
    return get_settings()


# TODO: Phase 2 - Implement Supabase JWT verification
async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> str:
    """
    Verify Supabase JWT and return user ID.
    Placeholder - will be implemented in Phase 2 with Supabase Auth.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    # TODO: Phase 2 - Verify JWT token with Supabase
    # For now, return a placeholder
    token = authorization.replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    return token  # Will return actual user_id after Phase 2
