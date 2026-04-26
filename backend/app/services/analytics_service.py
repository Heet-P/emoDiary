# [FILENAME: app/services/analytics_service.py]
# [PURPOSE: Analytical service to aggregate mood trends and generate AI insights]
# [DEPENDENCIES: app.models.database, groq, app.config]
# [PHASE: Phase 7 - Analytics]

from datetime import datetime, timedelta, timezone
import json
from typing import List, Dict, Any
from app.models.database import get_supabase_client
from app.services.ai_client import get_groq_client


EMOTION_SCORES = {
    "Happy": 8,
    "Calm": 7,
    "Stressed": 4,
    "Sad": 3,
    "Energetic": 9,
    "Anxious": 4,
    "Neutral": 5,
    "Grateful": 8,
    "Frustrated": 3,
    "Angry": 2,
    "Excited": 9,
    "Relaxed": 7,
    "Tired": 4,
    "Lonely": 3,
}

async def get_mood_trends(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Fetch mood data and aggregate analytics for the extended insights dashboard.
    """
    supabase = get_supabase_client()
    
    # We fetch 84 days (12 weeks) to support the heatmap, even if 'days' is 30.
    fetch_days = max(days, 84)
    start_date = (datetime.now(timezone.utc) - timedelta(days=fetch_days)).isoformat()
    
    # Fetch entries
    response = (
        supabase.table("journal_entries")
        .select("id, title, content, created_at, emotion_tag, ai_multi_tags, word_count")
        .eq("user_id", user_id)
        .gte("created_at", start_date)
        .order("created_at", desc=False)
        .execute()
    )
    
    entries = response.data or []
    
    # Processing variables
    trend_data = []
    emotion_counts = {}
    activity_heatmap = {}
    word_count_trend = []
    
    # Radar dimensions
    radar_scores = {
        "Positivity": [],
        "Energy": [],
        "Calm": [],
        "Resilience": [],
        "Openness": []
    }
    
    # Date bound for 30-day specific metrics (if days=30)
    cutoff_30_days = datetime.now(timezone.utc) - timedelta(days=days)
    
    total_score = 0
    scored_entries = 0
    total_words = 0
    
    # Calculate streak
    # Unique days set
    entry_dates = set()
    
    for entry in entries:
        dt = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00"))
        date_str = dt.strftime("%Y-%m-%d")
        entry_dates.add(date_str)
        
        # Heatmap tracking (for all 84 days)
        activity_heatmap[date_str] = activity_heatmap.get(date_str, 0) + 1
        
        emotion = entry.get("emotion_tag") or "Neutral"
        score = EMOTION_SCORES.get(emotion, 5)
        wc = entry.get("word_count") or len(entry.get("content", "").split())
        
        total_words += wc

        # Only process metrics for the requested 'days' window (e.g., 30 days)
        if dt >= cutoff_30_days:
            trend_data.append({
                "date": date_str,
                "score": score,
                "mood": emotion,
            })
            
            # Aggregate emotions
            if emotion:
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            
            # Word counts
            word_count_trend.append({
                "date": date_str,
                "words": wc
            })
            
            total_score += score
            scored_entries += 1
            
            # Radar scores heuristic mapping
            pos_emotions = ["Happy", "Excited", "Grateful", "Proud"]
            en_emotions = ["Energetic", "Excited", "Stressed", "Angry", "Anxious", "Frustrated"]
            calm_emotions = ["Calm", "Relaxed", "Neutral"]
            res_emotions = ["Motivated", "Reflective", "Hopeful"]
            open_emotions = ["Reflective", "Neutral", "Sad", "Lonely", "Vulnerable"]
            
            base_score = score * 10 # scale 0-10 to 0-100
            fallback_score = 50
            
            ai_tags = entry.get("ai_multi_tags", []) or []
            all_tags = [emotion] + (ai_tags if ai_tags else [])
            
            pos_match = any(t in pos_emotions for t in all_tags)
            en_match = any(t in en_emotions for t in all_tags)
            calm_match = any(t in calm_emotions for t in all_tags)
            res_match = any(t in res_emotions for t in all_tags)
            open_match = any(t in open_emotions for t in all_tags)
            
            radar_scores["Positivity"].append(base_score if pos_match else fallback_score)
            radar_scores["Energy"].append((base_score + 20) if en_match else fallback_score)
            radar_scores["Calm"].append((base_score + 10) if calm_match else fallback_score)
            radar_scores["Resilience"].append((base_score + 15) if res_match else fallback_score)
            radar_scores["Openness"].append(base_score if open_match else fallback_score)

    # Format emotion distribution
    emotion_distribution = [{"name": k, "value": v} for k, v in emotion_counts.items()]
    emotion_distribution.sort(key=lambda x: x["value"], reverse=True)
    
    # Format Heatmap
    heatmap_data = [{"date": k, "count": v} for k, v in activity_heatmap.items()]
    
    # Format Radar
    radar_data = []
    for trait, scores in radar_scores.items():
        avg = sum(scores) / len(scores) if scores else 50
        radar_data.append({"subject": trait, "A": min(100, int(avg)), "fullMark": 100})
        
    # Overall score (0 to 10)
    overall_score = round(total_score / scored_entries, 1) if scored_entries > 0 else 0
    
    # Calculate day streak
    current_streak = 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    
    check_date = datetime.now(timezone.utc)
    if today in entry_dates or yesterday in entry_dates:
        # Start counting
        curr = check_date
        # If no entry today, start from yesterday
        if today not in entry_dates:
            curr = curr - timedelta(days=1)
            
        while curr.strftime("%Y-%m-%d") in entry_dates:
            current_streak += 1
            curr = curr - timedelta(days=1)
    
    # Recent entries (last 3)
    recent_entries = []
    for entry in reversed(entries[-3:]):
        dt = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00"))
        emotion = entry.get("emotion_tag") or "Neutral"
        score = EMOTION_SCORES.get(emotion, 5)
        wc = entry.get("word_count") or len(entry.get("content", "").split())
        tags = entry.get("ai_multi_tags", []) or [emotion]
        recent_entries.append({
            "id": entry["id"],
            "title": entry.get("title") or "Journal Entry",
            "date": dt.strftime("%Y-%m-%d"),
            "word_count": wc,
            "score": score,
            "tags": tags[:3]
        })
    
    return {
        "trends": trend_data,
        "emotion_distribution": emotion_distribution,
        "activity_heatmap": heatmap_data,
        "radar_data": radar_data,
        "word_count_trend": word_count_trend,
        "overall_score": overall_score,
        "current_streak": current_streak,
        "total_words": total_words,
        "recent_entries": recent_entries,
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
        .select("created_at, content, emotion_tag")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    
    entries = response.data or []
    
    if not entries:
        if language == "en":
            return json.dumps([{"observation": "Not enough data to generate insights. Keep journaling!", "actions": ["Write your first entry!", "Try journaling daily for a week"]}])
        else:
            return json.dumps([{"observation": "अंतर्दृष्टि के लिए पर्याप्त डेटा नहीं है। लिखते रहें!", "actions": ["अपनी पहली प्रविष्टि लिखें", "एक सप्ताह तक दैनिक जर्नलिंग करें"]}])
        
    # Prepare prompt
    entries_text = ""
    for entry in entries:
        date_str = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00")).strftime("%Y-%m-%d")
        emotion = entry.get("emotion_tag") or "Unknown"
        entries_text += f"- {date_str} (Mood: {emotion}): {entry['content']}\n"
        
    if language == "hi":
        prompt = f"""
    आप एक सहानुभूतिपूर्ण मानसिक स्वास्थ्य विश्लेषक हैं। निम्नलिखित जर्नल प्रविष्टियों का विश्लेषण करें और 3 अंतर्दृष्टि उत्पन्न करें।
    प्रत्येक अंतर्दृष्टि में एक अवलोकन और 2-3 सुझाव होने चाहिए।

    प्रविष्टियां:
    {entries_text}

    STRICT: Return ONLY a valid JSON array. No other text. No markdown. No explanation.
    Format:
    [
      {{"observation": "आपका अवलोकन यहाँ...", "actions": ["सुझाव 1", "सुझाव 2"]}},
      {{"observation": "दूसरा अवलोकन...", "actions": ["सुझाव 1", "सुझाव 2"]}}
    ]
    """
    else:
        prompt = f"""
    You are an empathetic mental health companion analyst.
    Analyze the following recent journal entries and produce exactly 3 structured insights.
    Each insight must have:
    - A short observation (1-2 sentences, written in 2nd person, no bold, no markdown)
    - 2-3 concrete, actionable suggestions the user can take based on that observation

    Entries:
    {entries_text}

    STRICT: Return ONLY a valid JSON array. No other text. No markdown. No explanation.
    Format:
    [
      {{"observation": "Your observation here...", "actions": ["Action 1", "Action 2"]}},
      {{"observation": "Another observation...", "actions": ["Action 1", "Action 2"]}}
    ]
    """
    
    try:
        client = get_groq_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a mental health companion. You output ONLY valid JSON arrays, nothing else."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.65,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        
        raw = completion.choices[0].message.content.strip()
        parsed = json.loads(raw)
        # Handle if the model wraps in an object {"insights": [...]}
        if isinstance(parsed, dict):
            for key in ["insights", "data", "result", "items"]:
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
            else:
                parsed = list(parsed.values())[0] if parsed else []
        return json.dumps(parsed)
        
    except Exception as e:
        print(f"Error generating insights: {e}")
        return json.dumps([{"observation": "Unable to generate insights at the moment. Please try again later.", "actions": ["Keep journaling daily", "Come back in a few days"]}])


async def calculate_therapist_score(user_id: str) -> dict:
    """
    Analyze the user's recent journal entries and generate a Therapist Need Score (0-100)
    and a short justification. Saves it to user_settings.
    """
    supabase = get_supabase_client()
    
    # Calculate start date (last 14 days)
    start_date = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    
    # Fetch entries
    response = (
        supabase.table("journal_entries")
        .select("created_at, content, emotion_tag, ai_multi_tags")
        .eq("user_id", user_id)
        .gte("created_at", start_date)
        .order("created_at", desc=False)
        .execute()
    )
    
    entries = response.data or []
    
    if not entries:
        return {
            "therapist_score": 0,
            "therapist_justification": "Not enough data to calculate a score."
        }
        
    # Prepare transcript
    entries_text = ""
    for entry in entries:
        date_str = datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00")).strftime("%Y-%m-%d")
        
        # Handle tags carefully to avoid TypeError if emotion_tag is None
        ai_tags = entry.get("ai_multi_tags") or []
        fallback_tag = entry.get("emotion_tag")
        
        tags = ai_tags if ai_tags else ([fallback_tag] if fallback_tag else ["Unknown"])
        
        # Ensure all tags are converted to string just in case, and filter out Nones
        clean_tags = [str(t) for t in tags if t is not None]
        if not clean_tags:
            clean_tags = ["Unknown"]
            
        entries_text += f"[{date_str}] Tags: {', '.join(clean_tags)} | Content: {entry['content'][:500]}\n"
        
    prompt = (
        "You are an expert psychological triage AI. Review the following recent journal entries from a user over the past 14 days. "
        "Your goal is to determine a 'Therapist Need Score' from 0 to 100, where 0 means perfect mental health (no intervention needed) "
        "and 100 means severe distress requiring immediate professional help. "
        "Also provide a 1-2 sentence justification for the score.\n\n"
        f"Entries:\n{entries_text[:8000]}\n\n"
        "Respond ONLY with a valid JSON object containing exactly these keys: 'therapist_score' (integer 0-100) and 'therapist_justification' (string)."
    )
    
    try:
        client = get_groq_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        
        result_text = completion.choices[0].message.content.strip()
        result_json = json.loads(result_text)
        
        score = result_json.get("therapist_score", 0)
        justification = result_json.get("therapist_justification", "Unable to determine.")
        
        # Save to user_settings
        supabase.table("user_settings").update({
            "therapist_score": score,
            "therapist_justification": justification
        }).eq("user_id", user_id).execute()
        
        return {
            "therapist_score": score,
            "therapist_justification": justification
        }
        
    except Exception as e:
        print(f"Error calculating therapist score: {e}")
        return {
            "therapist_score": 0,
            "therapist_justification": "Error calculating score."
        }


async def get_user_patterns(user_id: str, limit: int = 20) -> list[dict]:
    """
    Fetch detected patterns for a user from the patterns table.
    Returns the most recently detected patterns, newest first.
    """
    supabase = get_supabase_client()
    result = (
        supabase.table("patterns")
        .select("id, pattern_type, description, data, detected_at")
        .eq("user_id", user_id)
        .order("detected_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


async def get_therapist_score(user_id: str) -> dict:
    """Retrieve the stored therapist need score for a user."""
    supabase = get_supabase_client()
    result = supabase.table("user_settings") \
        .select("therapist_score, therapist_justification") \
        .eq("user_id", user_id) \
        .execute()
    if not result.data:
        return {"therapist_score": None, "therapist_justification": None}
    return result.data[0]
