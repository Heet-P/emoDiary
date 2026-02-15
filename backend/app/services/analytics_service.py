# [FILENAME: app/services/analytics_service.py]
# [PURPOSE: Analytical service to aggregate mood trends and generate AI insights]
# [DEPENDENCIES: app.models.database, groq, app.config]
# [PHASE: Phase 7 - Analytics]

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from app.models.database import get_supabase_client
from app.config import get_settings
from groq import Groq

def _get_groq_client() -> Groq:
    settings = get_settings()
    return Groq(api_key=settings.groq_api_key)

async def get_mood_trends(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Fetch mood data for the last 'days' and aggregate emotion counts to visualize trends.
    """
    supabase = get_supabase_client()
    
    # Calculate start date
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Fetch entries
    response = (
        supabase.table("journal_entries")
        .select("created_at, mood, mood_score, emotions")
        .eq("user_id", user_id)
        .gte("created_at", start_date)
        .order("created_at", desc=False)
        .execute()
    )
    
    entries = response.data or []
    
    # Process for chart data
    # We want a list of { date: "YYYY-MM-DD", score: 7, mood: "Happy" }
    trend_data = []
    emotion_counts = {}
    
    for entry in entries:
        # Format date for charts
        created_at = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00"))
        date_str = created_at.strftime("%Y-%m-%d")
        
        trend_data.append({
            "date": date_str,
            "score": entry["mood_score"],
            "mood": entry["mood"],
        })
        
        # Aggregate emotions
        # entry["emotions"] is a list of strings
        if entry.get("emotions"):
            for emotion in entry["emotions"]:
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                
    # Format emotion distribution for pie chart
    emotion_distribution = [
        {"name": k, "value": v} for k, v in emotion_counts.items()
    ]
    # Sort by count desc
    emotion_distribution.sort(key=lambda x: x["value"], reverse=True)
    
    return {
        "trends": trend_data,
        "emotion_distribution": emotion_distribution,
        "entry_count": len(entries)
    }

async def generate_insights(user_id: str, language: str = "en") -> str:
    """
    Generate AI-driven insights based on recent journal entries.
    """
    supabase = get_supabase_client()
    
    # Fetch last 10 entries for context
    response = (
        supabase.table("journal_entries")
        .select("created_at, content, mood, emotions")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    
    entries = response.data or []
    
    if not entries:
        return "Not enough data to generate insights. Keep journaling!" if language == "en" else "अंतर्दृष्टि उत्पन्न करने के लिए पर्याप्त डेटा नहीं है। पत्रिका लिखते रहें!"
        
    # Prepare prompt
    entries_text = ""
    for entry in entries:
        date_str = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00")).strftime("%Y-%m-%d")
        emotions = ", ".join(entry.get("emotions", []) or [])
        entries_text += f"- {date_str} (Mood: {entry['mood']}, Emotions: {emotions}): {entry['content']}\n"
        
    prompt = f"""
    Analyze the following recent journal entries from a user. 
    Identify patterns, emotional triggers, and improvements or declines in their well-being.
    
    Entries:
    {entries_text}
    """

    if language == "hi":
        prompt += """
        Provide 3 concise, actionable, and empathetic insights in bullet points in HINDI (Devanagari script).
        Do not use markdown formatting like bolding * or **. Just plain text bullet points.
        Focus on "You" perspective (use "आप" and respectful tone).
        """
    else:
        prompt += """
        Provide 3 concise, actionable, and empathetic insights in bullet points.
        Do not use markdown formatting like bolding * or **. Just plain text bullet points.
        Focus on "You" perspective.
        """
    
    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an empathetic mental health companion analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        
        return completion.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Error generating insights: {e}")
        return "Unable to generate insights at the moment. Please try again later."
