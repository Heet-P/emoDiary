# [FILENAME: app/services/voice_service.py]
# [PURPOSE: Voice processing service using Groq Whisper (STT) and Google Cloud TTS]
# [DEPENDENCIES: groq, google-cloud-texttospeech, app.config]
# [PHASE: Phase 6 - Voice Chat]

import base64
import os
from groq import Groq
from app.config import get_settings


def _get_groq_client() -> Groq:
    settings = get_settings()
    return Groq(api_key=settings.groq_api_key)


async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribe audio using Groq's distil-whisper-large-v3-en model.
    """
    client = _get_groq_client()
    
    # Write bytes to a temporary file because Groq client expects a file-like object with a name
    # or a path. Using a dummy filename helps Groq detect format.
    # In production, consider using io.BytesIO with a 'name' attribute.
    
    try:
        # Create a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name

        with open(temp_audio_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(temp_audio_path, file.read()),
                model="whisper-large-v3",
                response_format="json",
                language="en",
                temperature=0.0
            )
        
        # Cleanup
        os.remove(temp_audio_path)
        
        return transcription.text.strip()
            
    except Exception as e:
        # Start cleanup if it failed before
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
            
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

        # Determine language code for Sarvam TTS
        sarvam_lang = "hi-IN" if language in ["hi", "hinglish"] else "en-IN"
        
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
