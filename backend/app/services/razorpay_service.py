import razorpay
from app.config import get_settings
from typing import Dict, Any

settings = get_settings()

client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

async def create_order(amount: int, currency: str = "INR") -> Dict[str, Any]:
    """
    Create a Razorpay order.
    Amount should be in paise (e.g. 29900 for 299 INR).
    """
    data = {
        "amount": amount,
        "currency": currency,
        "payment_capture": 1 # Auto capture
    }
    order = client.order.create(data=data)
    return order

async def verify_payment(payment_id: str, order_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature."""
    params_dict = {
        'razorpay_order_id': order_id,
        'razorpay_payment_id': payment_id,
        'razorpay_signature': signature
    }
    try:
        client.utility.verify_payment_signature(params_dict)
        return True
    except Exception:
        return False
