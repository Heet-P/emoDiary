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

    # Groq AI
    groq_api_key: str = ""

    # Google Cloud TTS
    google_application_credentials: str = ""

    # Upstash Redis
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""

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
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
