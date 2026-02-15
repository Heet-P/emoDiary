# [FILENAME: app/routers/analytics.py]
# [PURPOSE: API endpoints for analytics and insights]
# [DEPENDENCIES: fastapi, app.services.analytics_service, app.dependencies]
# [PHASE: Phase 7 - Analytics]

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.dependencies import get_current_user
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/trends")
async def get_trends(
    days: int = 30,
    user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get mood trends and emotion distribution for the last 'days'.
    """
    try:
        return await analytics_service.get_mood_trends(user_id, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
async def get_insights(
    language: str = "en",
    user_id: str = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Get AI-generated insights based on recent journal entries.
    """
    try:
        insights = await analytics_service.generate_insights(user_id, language)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
