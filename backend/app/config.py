# [FILENAME: app/config.py]
# [PURPOSE: Application settings loaded from environment variables]
# [DEPENDENCIES: pydantic-settings, python-dotenv]
# [PHASE: Phase 1 - Scaffolding]

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Environment
    environment: str = "development"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Supabase JWT Secret (for local token verification)
    supabase_jwt_secret: str = ""

    # Groq AI
    groq_api_key: str = ""

    # Sarvam AI TTS
    sarvam_api_key: str = ""

    # Upstash Redis
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""
    
    # Admin bypass
    admin_email: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        # Allow legacy environment variables (e.g. Razorpay keys) to exist
        # without crashing the app after removing the Razorpay integration.
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
