# [FILENAME: app/services/ai_client.py]
# [PURPOSE: Shared Groq client singleton — avoids re-instantiation on every request]
# [DEPENDENCIES: groq, app.config]

from functools import lru_cache
from groq import Groq
from app.config import get_settings


@lru_cache(maxsize=1)
def get_groq_client() -> Groq:
    """Return the shared Groq client instance (created once, reused forever)."""
    settings = get_settings()
    return Groq(api_key=settings.groq_api_key)
