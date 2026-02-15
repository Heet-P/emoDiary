# [FILENAME: app/dependencies.py]
# [PURPOSE: FastAPI dependency injection for auth verification via Supabase JWT]
# [DEPENDENCIES: fastapi, httpx, app.config]
# [PHASE: Phase 2 - Authentication]

from fastapi import Depends, HTTPException, Header
from typing import Optional
import httpx

from app.config import get_settings, Settings


def get_settings_dep() -> Settings:
    """Dependency to inject settings."""
    return get_settings()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings_dep),
) -> str:
    """
    Verify Supabase JWT and return user ID.
    Uses Supabase's /auth/v1/user endpoint to validate the token.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token format")

    try:
        # Verify token by calling Supabase's user endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_service_key,
                },
            )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_data = response.json()
        user_id = user_data.get("id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Could not extract user ID")

        return user_id

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Auth service unavailable: {str(e)}"
        )
