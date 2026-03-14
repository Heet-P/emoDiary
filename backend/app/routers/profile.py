"""
Profile router — avatar config and name persistence.
GET  /api/profile/avatar  → returns avatar_config + avatar_name
PUT  /api/profile/avatar  → saves config to profiles table
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.models.database import get_supabase_client
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


class AvatarConfig(BaseModel):
    skin: str = "warm"
    hair: str = "black"
    headShape: str = "round"
    accentColor: str = "#10b981"


class AvatarSaveRequest(BaseModel):
    avatar_config: AvatarConfig
    avatar_name: str


@router.get("/avatar")
async def get_avatar(user: str = Depends(get_current_user)):
    """Return the current user's avatar config and name."""
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("profiles")
            .select("avatar_config, avatar_name")
            .eq("id", user)
            .single()
            .execute()
        )
        data = result.data or {}
        return {
            "avatar_config": data.get("avatar_config") or {
                "skin": "warm",
                "hair": "black",
                "headShape": "round",
                "accentColor": "#10b981",
            },
            "avatar_name": data.get("avatar_name") or "emoDiary",
        }
    except Exception as e:
        # Profile might not have avatar columns yet — return defaults
        return {
            "avatar_config": {
                "skin": "warm",
                "hair": "black",
                "headShape": "round",
                "accentColor": "#10b981",
            },
            "avatar_name": "emoDiary",
        }


@router.put("/avatar")
async def update_avatar(payload: AvatarSaveRequest, user: str = Depends(get_current_user)):
    """Save avatar config and name to profiles table."""
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("profiles")
            .update({
                "avatar_config": payload.avatar_config.model_dump(),
                "avatar_name": payload.avatar_name,
            })
            .eq("id", user)
            .execute()
        )
        return {"ok": True, "avatar_name": payload.avatar_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
