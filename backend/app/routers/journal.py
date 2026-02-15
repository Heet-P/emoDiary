# [FILENAME: app/routers/journal.py]
# [PURPOSE: REST API endpoints for journal entry CRUD]
# [DEPENDENCIES: fastapi, app.dependencies, app.services.journal_service, app.models.schemas]
# [PHASE: Phase 3 - Core Journaling]

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.dependencies import get_current_user
from app.models.schemas import (
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
)
from app.services import journal_service, emotion_service
import asyncio

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=JournalEntryResponse, status_code=201)
async def create_journal_entry(
    body: JournalEntryCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a new journal entry."""
    try:
        entry = await journal_service.create_entry(
            user_id=user_id,
            title=body.title,
            content=body.content,
            emotion_tag=body.emotion_tag,
        )
        # Trigger emotion analysis in background (non-blocking)
        asyncio.create_task(
            emotion_service.analyze_and_store(user_id, "journal", entry["id"], body.content)
        )
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create entry: {str(e)}")


@router.get("", response_model=list[JournalEntryResponse])
async def list_journal_entries(
    user_id: str = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List journal entries for the authenticated user, newest first."""
    entries = await journal_service.get_entries(user_id, limit=limit, offset=offset)
    return entries


@router.get("/count")
async def get_journal_count(
    user_id: str = Depends(get_current_user),
):
    """Get total count of journal entries."""
    count = await journal_service.get_entry_count(user_id)
    return {"count": count}


@router.get("/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get a single journal entry by ID."""
    entry = await journal_service.get_entry(user_id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.put("/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: str,
    body: JournalEntryUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update a journal entry."""
    entry = await journal_service.update_entry(
        user_id=user_id,
        entry_id=entry_id,
        title=body.title,
        content=body.content,
        emotion_tag=body.emotion_tag,
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    # Re-analyze emotions if content changed
    if body.content:
        asyncio.create_task(
            emotion_service.analyze_and_store(user_id, "journal", entry_id, body.content)
        )
    return entry


@router.delete("/{entry_id}", status_code=204)
async def delete_journal_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a journal entry."""
    deleted = await journal_service.delete_entry(user_id, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return None
