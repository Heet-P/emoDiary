
# [FILENAME: backend/seed_data.py]
# [PURPOSE: Create demo user and seed 30 days of journal data]

import os
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
from pathlib import Path
env_path = Path(".") / ".env"
print(f"Loading .env from: {env_path.absolute()}")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print(f"SUPABASE_URL found: {bool(SUPABASE_URL)}")
print(f"SUPABASE_KEY found: {bool(SUPABASE_KEY)}")
print(f"SUPABASE_SERVICE_KEY found: {bool(SUPABASE_SERVICE_KEY)}")

if not SUPABASE_URL or not (SUPABASE_KEY or SUPABASE_SERVICE_KEY):
    print("Error: SUPABASE_URL or SUPABASE_KEY/SERVICE_KEY not found in .env")
    exit(1)

# Use Service Key if available for admin tasks, otherwise Anon Key
# Note: creating client with Service Key allows bypassing RLS if needed
key_to_use = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
supabase = create_client(SUPABASE_URL, key_to_use)

DEMO_EMAIL = "demo@emodiary.com"
DEMO_PASSWORD = "DemoUser123!"

MOOD_DATA = [
    {"mood": "Happy", "score": 8, "emotions": ["Hopeful", "Excited", "Grateful"], "content": "Today was a really good day! I managed to finish my project early and spent some quality time with my family. I feel accomplished and loved."},
    {"mood": "Calm", "score": 7, "emotions": ["Relaxed", "Content", "Peaceful"], "content": "A quiet Sunday. Read a book and drank tea. Sometimes doing nothing is exactly what you need to recharge."},
    {"mood": "Stressed", "score": 4, "emotions": ["Overwhelmed", "Anxious", "Tired"], "content": "Work is piling up and I'm not sure how I'm going to get everything done by the deadline. My chest feels tight."},
    {"mood": "Sad", "score": 3, "emotions": ["Lonely", "Disappointed"], "content": "I miss my old friends. It's hard to make new connections in a new city. Feeling a bit isolated today."},
    {"mood": "Energetic", "score": 9, "emotions": ["Motivated", "Strong", "Focused"], "content": "Went for a run this morning and crushed my personal best! I feel like I can take on the world."},
    {"mood": "Anxious", "score": 4, "emotions": ["Nervous", "Uncertain"], "content": "Got a big presentation tomorrow. I'm worried I'll mess it up. Trying to breathe through it."},
    {"mood": "Happy", "score": 8, "emotions": ["Joyful", "Proud"], "content": "Got praised by my manager today for the report I submitted. Feels good to be recognized."},
    {"mood": "Neutral", "score": 5, "emotions": ["Bored", "Indifferent"], "content": "Just a normal day. Nothing special happened. Routine can be comforting but also a bit dull."},
    {"mood": "Grateful", "score": 8, "emotions": ["Appreciative", "Blessed"], "content": "So thankful for my health and my supportive partner. It's the little things that matter most."},
    {"mood": "Frustrated", "score": 3, "emotions": ["Annoyed", "Irritated"], "content": "Stuck in traffic for two hours. Wasted so much time. Why is the infrastructure so bad?"},
]

def authenticate_user():
    print(f"Authenticating demo user: {DEMO_EMAIL}...")
    
    # Using Service Key allow us to use admin API
    try:
        # Try to get user by email (not directly available in python client standardized way, so list users or create)
        # Actually create_user will throw if exists usually.
        # But let's try to sign in first to get the ID if exists.
        response = supabase.auth.sign_in_with_password({"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        print("User signed in successfully.")
        return response.user.id
    except Exception as e:
        print(f"Sign in failed: {e}")
        
    print("Attempting to create user via Admin API...")
    try:
        # Create user with auto-confirmation
        attributes = {
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
            "email_confirm": True
        }
        # Note: In some versions it's supabase.auth.admin.create_user(attributes)
        response = supabase.auth.admin.create_user(attributes)
        if response.user:
            print("User created successfully via Admin API.")
            return response.user.id
        else:
            print("Admin create_user returned no user.")
            exit(1)
    except Exception as create_error:
        print(f"Admin create user failed: {create_error}")
        # Maybe user exists but password was wrong?
        # Try to delete and recreate? Or just Fail.
        exit(1)

def seed_journal_entries(user_id):
    print(f"Seeding 30 days of data for user {user_id}...")
    
    # Check existing entries to avoid duplicates (optional, just clearing for demo)
    # Using Service Role Key for deletion bypasses RLS if needed, but standard client adheres to RLS.
    # If standard user, they can only delete their own.
    
    # Clear existing entries for this user (to keep demo clean)
    try:
        supabase.table("journal_entries").delete().eq("user_id", user_id).execute()
        print("Cleared existing entries.")
    except Exception as e:
        print(f"Warning: Could not clear entries (might be empty): {e}")

    today = datetime.now(timezone.utc)
    entries_to_insert = []
    
    # Generate a pattern: mostly good, dip in middle, recovery at end
    sequence_indices = [0, 1, 0, 4, 8, 1, 2, 5, 2, 3, 3, 9, 2, 5, 7, 7, 1, 0, 8, 4, 0, 1, 2, 0, 4, 8, 8, 0, 1, 4]
    # Length 30 sequence mapping to MOOD_DATA indices
    
    for i in range(30):
        days_ago = 29 - i
        entry_date = today - timedelta(days=days_ago)
        
        # Pick mood data
        mood_idx = sequence_indices[i] if i < len(sequence_indices) else random.randint(0, len(MOOD_DATA)-1)
        data = MOOD_DATA[mood_idx]
        
        # Add some randomness to score and content
        entries_to_insert.append({
            "user_id": user_id,
            "title": f"Entry for {entry_date.strftime('%B %d')}",
            "content": data["content"],
            "emotion_tag": data["mood"],
            "word_count": len(data["content"].split()),
            "created_at": entry_date.isoformat(),
            "updated_at": entry_date.isoformat(),
        })

    # Insert in batches
    try:
        response = supabase.table("journal_entries").insert(entries_to_insert).execute()
        print(f"Successfully inserted {len(response.data)} entries.")
    except Exception as e:
        print(f"Error inserting entries: {e}")

if __name__ == "__main__":
    user_id = authenticate_user()
    if user_id:
        seed_journal_entries(user_id)
        print("\n--- DEMO DATA SEEDED ---")
        print(f"Email:    {DEMO_EMAIL}")
        print(f"Password: {DEMO_PASSWORD}")
        print("You can now log in with these credentials.")
