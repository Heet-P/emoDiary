# [FILENAME: app/routers/chat.py]
# [PURPOSE: REST API endpoints for AI chat sessions and messages]
# [DEPENDENCIES: fastapi, app.dependencies, app.services.chat_service, app.models.schemas]
# [PHASE: Phase 4 - AI Integration]

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import Optional

from app.dependencies import get_current_user
from app.models.schemas import ChatMessageRequest, ChatMessageResponse, SessionStartResponse, SessionStartRequest
from app.services import chat_service, voice_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/voice")
async def process_voice_message(
    session_id: str = Form(...),
    language: str = Form("en"),
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Process a voice message:
    1. Transcribe audio (Groq Whisper)
    2. Get AI response (Groq Llama)
    3. Synthesize speech (Google Cloud TTS)
    4. Return transcript, AI text, and AI audio
    """
    try:
        # 1. Transcribe
        audio_content = await audio.read()
        transcript = await voice_service.transcribe_audio(audio_content)

        if not transcript:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")

        # 2. Get AI response (reusing chat service logic)
        chat_response = await chat_service.send_message(
            user_id=user_id,
            session_id=session_id,
            message=transcript,
            language=language
        )
        
        ai_text = chat_response["response"]

        # 3. Synthesize speech
        audio_base64 = await voice_service.synthesize_speech(ai_text, language)

        return {
            "user_transcript": transcript,
            "ai_response": ai_text,
            "ai_audio": audio_base64,
            "session_id": session_id,
            "language": language
        }

    except Exception as e:
        print(f"Voice processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")


@router.post("/session", response_model=dict, status_code=201)
async def start_chat_session(
    body: SessionStartRequest,
    user_id: str = Depends(get_current_user),
):
    """Start a new chat session with the AI companion."""
    try:
        result = await chat_service.start_session(
            user_id=user_id,
            mode="text",
            language=body.language,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    body: ChatMessageRequest,
    user_id: str = Depends(get_current_user),
):
    """Send a message and get the AI companion's response."""
    try:
        result = await chat_service.send_message(
            user_id=user_id,
            session_id=body.session_id,
            message=body.message,
            language=body.language,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")


@router.get("/session/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get all messages for a chat session."""
    messages = await chat_service.get_session_messages(user_id, session_id)
    return {"messages": messages}


@router.post("/session/{session_id}/end")
async def end_chat_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """End a chat session and record its duration."""
    result = await chat_service.end_session(user_id, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "ended", "duration_s": result.get("duration_s", 0)}
