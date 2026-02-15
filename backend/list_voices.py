import os
import sys
from google.cloud import texttospeech
from app.config import get_settings

# Setup env for credentials
settings = get_settings()
if settings.google_application_credentials:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials

def list_voices():
    client = texttospeech.TextToSpeechClient()
    
    # List voices
    response = client.list_voices()
    
    print("--- Hindi (India) Voices ---")
    for voice in response.voices:
        if "hi-IN" in voice.language_codes:
            print(f"Name: {voice.name}, SSML Gender: {texttospeech.SsmlVoiceGender(voice.ssml_gender).name}")
            
    print("\n--- English (US) Chirp Voices ---")
    for voice in response.voices:
        if "en-US" in voice.language_codes and "Chirp" in voice.name:
            print(f"Name: {voice.name}, SSML Gender: {texttospeech.SsmlVoiceGender(voice.ssml_gender).name}")

if __name__ == "__main__":
    # Add parent dir to path to import app.config
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir) # backend
    sys.path.append(parent_dir)
    
    list_voices()
