# [FILENAME: app/routers/health.py]
# [PURPOSE: Health check endpoint for liveness/readiness probes]
# [DEPENDENCIES: fastapi]
# [PHASE: Phase 1 - Scaffolding]

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns 200 OK when the service is running.
    """
    return {"status": "ok", "service": "emoDiary API"}
