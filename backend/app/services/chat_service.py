# [FILENAME: app/services/chat_service.py]
# [PURPOSE: AI chat service using Groq Llama 3.1 with Supabase session storage]
# [DEPENDENCIES: groq, supabase, app.config, app.prompts.system_prompts]
# [PHASE: Phase 4 - AI Integration]

from typing import Optional
from groq import Groq
from app.config import get_settings
from app.models.database import get_supabase_client
from app.prompts.system_prompts import (
    SYSTEM_PROMPTS,
    GREETING_PROMPTS,
    is_prompt_injection,
    INJECTION_REFUSAL,
)


def _get_groq_client() -> Groq:
    """Create a Groq client with the configured API key."""
    settings = get_settings()
    return Groq(api_key=settings.groq_api_key)


async def start_session(user_id: str, mode: str = "text", language: str = "en") -> dict:
    """
    Create a new chat session in the database and return session info
    with an initial greeting from the AI companion.
    """
    supabase = get_supabase_client()

    # Create session record
    result = supabase.table("chat_sessions").insert({
        "user_id": user_id,
        "mode": mode,
        "language": language,
    }).execute()

    if not result.data:
        raise Exception("Failed to create chat session")

    session = result.data[0]
    session_id = session["id"]

    # Save the AI greeting as the first message
    greeting = GREETING_PROMPTS.get(language, GREETING_PROMPTS["en"])

    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": greeting,
    }).execute()

    return {
        "session_id": session_id,
        "greeting": greeting,
        "language": language,
    }


async def send_message(
    user_id: str,
    session_id: str,
    message: str,
    language: str = "en",
) -> dict:
    """
    Process a user message:
    1. Verify session ownership
    2. Save user message to DB
    3. Load conversation history
    4. Call Groq Llama 3.1 for AI response
    5. Save AI response to DB
    6. Return AI response
    """
    supabase = get_supabase_client()

    # Verify session belongs to user
    session_check = (
        supabase.table("chat_sessions")
        .select("id, language")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not session_check.data:
        raise ValueError("Session not found or not owned by user")

    # Use the session's language if available
    session_lang = session_check.data[0].get("language", language)

    # ── Security: check for prompt injection BEFORE saving or sending ──
    if is_prompt_injection(message):
        refusal = INJECTION_REFUSAL.get(session_lang, INJECTION_REFUSAL["en"])

        # Save the user message (for audit trail)
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": "user",
            "content": message,
        }).execute()

        # Save refusal response
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": "assistant",
            "content": refusal,
        }).execute()

        return {
            "response": refusal,
            "session_id": session_id,
        }

    # Save user message
    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": message,
    }).execute()

    # Load conversation history (last 20 messages for context window management)
    history_result = (
        supabase.table("chat_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(20)
        .execute()
    )

    conversation_history = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in (history_result.data or [])
    ]

    # Build messages for Groq
    system_prompt = SYSTEM_PROMPTS.get(session_lang, SYSTEM_PROMPTS["en"])
    messages = [
        {"role": "system", "content": system_prompt},
        *conversation_history,
    ]

    # Call Groq Llama 3.1
    try:
        client = _get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.8,
        )
        ai_response = response.choices[0].message.content
    except Exception as e:
        # Fallback response if Groq fails
        ai_response = (
            "I'm having a moment of difficulty connecting. Could you try sharing that again?"
            if session_lang == "en"
            else "मुझे अभी जुड़ने में थोड़ी कठिनाई हो रही है। क्या आप फिर से बता सकते हैं?"
        )
        print(f"Groq API error: {e}")

    # Save AI response
    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": ai_response,
    }).execute()

    return {
        "response": ai_response,
        "session_id": session_id,
    }


async def get_session_messages(user_id: str, session_id: str) -> list[dict]:
    """Retrieve all messages for a session, verifying ownership."""
    supabase = get_supabase_client()

    # Verify session ownership
    session_check = (
        supabase.table("chat_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not session_check.data:
        return []

    result = (
        supabase.table("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )

    return result.data or []


async def end_session(user_id: str, session_id: str) -> Optional[dict]:
    """Mark a session as ended and compute duration."""
    supabase = get_supabase_client()

    # Get session to compute duration
    session_result = (
        supabase.table("chat_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not session_result.data:
        return None

    session = session_result.data[0]
    started_at = session["started_at"]

    # Update session with end time
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    started = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
    duration_s = int((now - started).total_seconds())

    update_result = (
        supabase.table("chat_sessions")
        .update({
            "ended_at": now.isoformat(),
            "duration_s": duration_s,
        })
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not update_result.data:
        return None

    return update_result.data[0]
