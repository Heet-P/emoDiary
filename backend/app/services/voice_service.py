# [FILENAME: app/services/voice_service.py]
# [PURPOSE: Voice processing service using Groq Whisper (STT) and Sarvam AI (TTS)]
# [DEPENDENCIES: groq, sarvamai, app.services.ai_client]
# [PHASE: Phase 6 - Voice Chat]

import base64
import io
from app.services.ai_client import get_groq_client
from app.config import get_settings


async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribe audio using Groq's whisper-large-v3 model.
    Uses BytesIO to avoid temp file disk I/O.
    """
    client = get_groq_client()

    try:
        audio_buffer = io.BytesIO(audio_bytes)
        audio_buffer.name = "audio.webm"  # Groq uses this to detect format

        transcription = client.audio.transcriptions.create(
            file=(audio_buffer.name, audio_buffer),
            model="whisper-large-v3",
            response_format="json",
            language="en",
            temperature=0.0,
        )

        return transcription.text.strip()

    except Exception as e:
        err_msg = str(e).lower()
        if getattr(e, "status_code", None) == 400 or "valid media file" in err_msg or "could not process file" in err_msg:
            # Groq rejects pure silence files with 400
            return ""

        print(f"Transcription failed: {str(e)}")
        raise e


from sarvamai import SarvamAI

async def synthesize_speech(text: str, language: str = "en") -> str:
    """
    Convert text to speech using official SarvamAI SDK.
    Returns base64 encoded WAV audio string.
    """
    try:
        settings = get_settings()
        if not settings.sarvam_api_key:
            raise Exception("SARVAM_API_KEY is not set.")

        # Determine language code for Sarvam `1 65`
        if language in ["hi", "hinglish"]:
            sarvam_lang = "hi-IN"
        elif language == "gu":
            sarvam_lang = "gu-IN"
        else:
            sarvam_lang = "en-IN"
        
        # Initialize Sarvam AI Client
        client = SarvamAI(api_subscription_key=settings.sarvam_api_key)

        # Use the official SDK to convert text to speech
        # It handles the base64 conversion and endpoint formatting automatically
        response = client.text_to_speech.convert(
            text=text,
            target_language_code=sarvam_lang,
            speaker="shubh",
            pace=1.00,
            speech_sample_rate=22050,
            enable_preprocessing=True,
            model="bulbul:v3"
        )
        
        # The response is typically a string of base64 audio depending on the SDK version formatting
        # We need to extract the base64 string
        # Assuming response returns an object with 'audios' attribute based on their REST spec
        if hasattr(response, 'audios') and len(response.audios) > 0:
            return response.audios[0]
        
        # If it returns a dict-like object
        if isinstance(response, dict) and 'audios' in response and len(response['audios']) > 0:
            return response['audios'][0]

        # If it returns the string directly
        if isinstance(response, str):
            return response

        raise Exception("Unrecognized response format from Sarvam AI SDK.")

    except Exception as e:
        print(f"TTS synthesis failed: {str(e)}")
        raise e
