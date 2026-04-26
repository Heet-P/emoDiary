# [FILENAME: app/routers/analytics.py]
# [PURPOSE: API endpoints for analytics and insights]
# [DEPENDENCIES: fastapi, app.services.analytics_service, app.dependencies]
# [PHASE: Phase 7 - Analytics]

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any
from supabase import Client
from app.dependencies import get_current_user, get_user_db
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

ALLOWED_LANGUAGES = {"en", "hi", "hinglish", "gu"}

@router.get("/trends")
async def get_trends(
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> Dict[str, Any]:
    """
    Get mood trends and emotion distribution for the last 'days'.
    """
    try:
        return await analytics_service.get_mood_trends(user_id, days, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
async def get_insights(
    language: str = Query("en"),
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> Dict[str, str]:
    """
    Get AI-generated insights based on recent journal entries.
    """
    if language not in ALLOWED_LANGUAGES:
        raise HTTPException(status_code=422, detail=f"language must be one of {sorted(ALLOWED_LANGUAGES)}")
    try:
        insights = await analytics_service.generate_insights(user_id, language, db=db)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/therapist-score")
async def generate_therapist_score(
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> Dict[str, Any]:
    """
    Calculate and save a new Therapist Need Score based on recent entries.
    """
    try:
        score_data = await analytics_service.calculate_therapist_score(user_id, db=db)
        return score_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/therapist-score")
async def get_therapist_score(
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> Dict[str, Any]:
    """
    Get the user's current Therapist Need Score from user_settings.
    """
    try:
        return await analytics_service.get_therapist_score(user_id, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patterns")
async def get_patterns(
    limit: int = 20,
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> list:
    """
    Get the user's detected behavioural and emotional patterns.
    """
    try:
        return await analytics_service.get_user_patterns(user_id, limit, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
