from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.services import subscription_service

router = APIRouter(prefix="/api/subscription", tags=["subscription"])

@router.get("/usage")
async def get_usage(user_id: str = Depends(get_current_user)):
    """Return current usage stats and subscription status."""
    try:
        status = await subscription_service.get_usage_status(user_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
