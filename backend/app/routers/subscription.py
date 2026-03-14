from fastapi import APIRouter, Depends, HTTPException, Body
from app.dependencies import get_current_user
from app.services import subscription_service, razorpay_service
from app.models.schemas import PaymentVerify
from typing import Dict, Any

router = APIRouter(prefix="/api/subscription", tags=["subscription"])

@router.get("/usage")
async def get_usage(user_id: str = Depends(get_current_user)):
    """Return current usage and subscription status."""
    try:
        status = await subscription_service.get_usage_status(user_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/key")
async def get_razorpay_key():
    """Return the Razorpay public Key ID."""
    from app.config import get_settings
    settings = get_settings()
    return {"key_id": settings.razorpay_key_id}

@router.post("/create-order")
async def create_subscription_order(
    tier: str = Body(..., embed=True),
    user_id: str = Depends(get_current_user)
):
    """Create a Razorpay order for subscription."""
    # Monthly: 299 INR (29900 paise), Yearly: 2499 INR (249900 paise)
    amount = 29900 if tier == "monthly" else 249900
    try:
        order = await razorpay_service.create_order(amount)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "tier": tier
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")



@router.post("/verify-payment")
async def verify_subscription_payment(
    payload: PaymentVerify,
    user_id: str = Depends(get_current_user)
):
    """Verify payment and upgrade user."""
    is_valid = await razorpay_service.verify_payment(
        payload.razorpay_payment_id,
        payload.razorpay_order_id,
        payload.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Upgrade user in DB
    from app.models.database import get_supabase_client
    supabase = get_supabase_client()
    try:
        supabase.table("profiles").update({
            "is_premium": True,
            "subscription_tier": "premium", # In real app, detect from meta or amount
            "razorpay_subscription_id": payload.razorpay_payment_id # Simplified for MVP
        }).eq("id", user_id).execute()
        
        return {"status": "success", "message": "Payment verified and account upgraded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
