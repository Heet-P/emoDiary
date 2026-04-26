# [FILENAME: app/routers/emotion.py]
# [PURPOSE: API endpoints for emotion analysis and history]
# [DEPENDENCIES: fastapi, app.services.emotion_service, app.dependencies]
# [PHASE: Phase 5 - Emotion Detection]

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.dependencies import get_current_user, get_user_db
from app.models.schemas import EmotionAnalysisRequest, EmotionAnalysisResponse
from app.services import emotion_service

router = APIRouter(prefix="/api/emotion", tags=["emotion"])


@router.post("/analyze", response_model=EmotionAnalysisResponse)
async def analyze_text(
    body: EmotionAnalysisRequest,
    user_id: str = Depends(get_current_user),
):
    """Analyze text for emotions and sentiment. Stores result in DB."""
    try:
        result = await emotion_service.analyze_and_store(
            user_id=user_id,
            source_type=body.source_type,
            source_id=body.source_id,
            text=body.text,
        )
        return {
            "sentiment_score": result["sentiment_score"],
            "emotions": result["emotions"],
            "primary_emotion": result["primary_emotion"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/source/{source_type}/{source_id}")
async def get_source_analysis(
    source_type: str,
    source_id: str,
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
):
    """Get the emotion analysis for a specific journal entry or chat session."""
    result = await emotion_service.get_analysis_for_source(source_type, source_id, db=db)
    if not result:
        raise HTTPException(status_code=404, detail="No analysis found for this source")
    return result


@router.get("/history")
async def get_emotion_history(
    limit: int = 30,
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_user_db),
):
    """Get recent emotion analyses for the current user (for trends)."""
    history = await emotion_service.get_user_emotion_history(user_id, limit, db=db)
    return {"analyses": history, "count": len(history)}
