# [FILENAME: app/models/schemas.py]
# [PURPOSE: Pydantic request/response models for all API endpoints]
# [DEPENDENCIES: pydantic]
# [PHASE: Phase 1 - Scaffolding (stubs for future phases)]

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ─── Health ───────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str


# ─── Journal (Phase 3) ───────────────────────────────────

class JournalEntryCreate(BaseModel):
    title: Optional[str] = None
    content: str
    emotion_tag: Optional[str] = None

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    emotion_tag: Optional[str] = None

class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str]
    content: str
    emotion_tag: Optional[str]
    word_count: int
    created_at: datetime
    updated_at: datetime


# ─── Chat (Phase 4) ──────────────────────────────────────

class ChatMessageRequest(BaseModel):
    message: str
    session_id: str
    language: str = "en"

class ChatMessageResponse(BaseModel):
    response: str
    session_id: str

class SessionStartRequest(BaseModel):
    language: str = "en"

class SessionStartResponse(BaseModel):
    session_id: str


# ─── Emotion (Phase 5) ───────────────────────────────────

class EmotionAnalysisRequest(BaseModel):
    text: str
    source_type: str  # 'journal' or 'chat'
    source_id: str

class EmotionAnalysisResponse(BaseModel):
    sentiment_score: float
    emotions: dict
    primary_emotion: str


# ─── Voice (Phase 6) ─────────────────────────────────────

class VoiceTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str

class VoiceSynthesizeRequest(BaseModel):
    text: str
    language: str = "en"

class VoiceSynthesizeResponse(BaseModel):
    audio_base64: str

class VoiceConversationResponse(BaseModel):
    user_transcript: str
    ai_response: str
    audio_base64: str
    detected_language: str


# ─── User Settings ────────────────────────────────────────

class UserSettingsResponse(BaseModel):
    language: str
    tts_voice: str
    tts_speed: float
    data_retention_days: int

class UserSettingsUpdate(BaseModel):
    language: Optional[str] = None
    tts_voice: Optional[str] = None
    tts_speed: Optional[float] = None
    data_retention_days: Optional[int] = None
