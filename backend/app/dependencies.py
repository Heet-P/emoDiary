# [FILENAME: app/dependencies.py]
# [PURPOSE: FastAPI dependency injection for auth verification via local JWT decode]
# [DEPENDENCIES: fastapi, python-jose, app.config]
# [PHASE: Phase 2 - Authentication (Performance: local decode, no HTTP call)]

from fastapi import Depends, HTTPException, Header
from typing import Optional
from jose import jwt, JWTError

from app.config import get_settings, Settings


def get_settings_dep() -> Settings:
    """Dependency to inject settings."""
    return get_settings()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings_dep),
) -> str:
    """
    Verify Supabase JWT locally and return user ID.

    Decodes the token using the project's JWT secret — no outbound HTTP call.
    Falls back to the Supabase /auth/v1/user endpoint if the secret is not configured.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token format")

    # Preferred path: local decode (zero latency)
    if settings.supabase_jwt_secret:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},  # Supabase sets aud="authenticated"
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Could not extract user ID from token")
            return user_id
        except JWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")

    # Fallback path: remote Supabase call (for local dev without JWT secret set)
    import httpx
    try:
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
