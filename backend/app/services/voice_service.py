# [FILENAME: app/services/voice_service.py]
# [PURPOSE: Voice processing service using Groq Whisper (STT) and Google Cloud TTS]
# [DEPENDENCIES: groq, google-cloud-texttospeech, app.config]
# [PHASE: Phase 6 - Voice Chat]

import base64
import os
from groq import Groq
from google.cloud import texttospeech
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
        print(f"Transcription failed: {str(e)}")
        # Start cleanup if it failed before
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        raise e


async def synthesize_speech(text: str, language: str = "en") -> str:
    """
    Convert text to speech using Google Cloud TTS.
    Returns base64 encoded audio string.
    """
    try:
        settings = get_settings()
        # Explicitly set the env var for Google Cloud client library
        if settings.google_application_credentials:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials

        # Initialize client
        # It automatically picks up GOOGLE_APPLICATION_CREDENTIALS from env
        client = texttospeech.TextToSpeechClient()

        # Set text input
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Build the voice request
        # English: en-US-Journey-F (Female, expressive)
        # Hindi: hi-IN-Neural2-A (Female, natural)
        voice_params = {
            "en": {"language_code": "en-US", "name": "en-US-Chirp3-HD-Zephyr"},
            "hi": {"language_code": "hi-IN", "name": "hi-IN-Chirp3-HD-Zephyr"},
        }
        
        selected_voice = voice_params.get(language, voice_params["en"])
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=selected_voice["language_code"],
            name=selected_voice["name"]
        )

        # Select the type of audio file you want returned
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=0.9,
        )

        # Perform the text-to-speech request    
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # Encode to base64 for frontend
        audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
        return audio_base64

    except Exception as e:
        print(f"TTS synthesis failed: {str(e)}")
        raise e
