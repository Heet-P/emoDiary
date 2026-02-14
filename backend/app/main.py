# [FILENAME: app/main.py]
# [PURPOSE: FastAPI application entry point with CORS, lifespan, and router registration]
# [DEPENDENCIES: fastapi, app.config, app.routers]
# [PHASE: Phase 1 - Scaffolding]

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    settings = get_settings()
    print(f"🚀 emoDiary API starting in {settings.environment} mode")
    yield
    # Shutdown
    print("👋 emoDiary API shutting down")


app = FastAPI(
    title="emoDiary API",
    description="Voice-enabled bilingual mental health companion API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)

# TODO: Phase 2 - Add auth dependency
# TODO: Phase 3 - Add journal router
# TODO: Phase 4 - Add chat router
# TODO: Phase 5 - Add emotion router
# TODO: Phase 6 - Add voice router
# TODO: Phase 7 - Add insights router
