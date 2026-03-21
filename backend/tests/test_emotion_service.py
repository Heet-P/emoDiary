"""
Tests for app/services/emotion_service.py

Covers:
- TextBlob sentiment scoring
- Fallback emotion analysis (polarity branches)
- AI emotion analysis with mocked Groq response
"""

import pytest
from unittest.mock import patch, MagicMock
from app.services.emotion_service import (
    _textblob_sentiment,
    _fallback_analysis,
    analyze_emotions_with_ai,
    EMOTION_LIST,
)


# ── TextBlob sentiment ─────────────────────────────────────────────────────

class TestTextBlobSentiment:
    def test_positive_text(self):
        score = _textblob_sentiment("I am so happy and grateful today!")
        assert score > 0

    def test_negative_text(self):
        score = _textblob_sentiment("Everything feels hopeless and terrible.")
        assert score < 0

    def test_neutral_text(self):
        score = _textblob_sentiment("I went to the store.")
        assert -0.2 <= score <= 0.2

    def test_returns_float(self):
        score = _textblob_sentiment("Hello world")
        assert isinstance(score, float)


# ── Fallback analysis ──────────────────────────────────────────────────────

class TestFallbackAnalysis:
    def test_positive_polarity_returns_joy(self):
        result = _fallback_analysis("I'm absolutely wonderful and ecstatic!")
        assert result["primary_emotion"] == "joy"
        assert "joy" in result["emotions"]

    def test_negative_polarity_returns_sadness(self):
        result = _fallback_analysis("Everything is terrible and I feel awful.")
        assert result["primary_emotion"] == "sadness"
        assert "sadness" in result["emotions"]

    def test_neutral_polarity_returns_neutral(self):
        result = _fallback_analysis("I went to the store today.")
        assert result["primary_emotion"] == "neutral"

    def test_emotions_dict_not_empty(self):
        result = _fallback_analysis("This is fine.")
        assert isinstance(result["emotions"], dict)
        assert len(result["emotions"]) > 0

    def test_primary_emotion_in_emotion_list(self):
        result = _fallback_analysis("I feel terrible and hopeless.")
        assert result["primary_emotion"] in EMOTION_LIST


# ── AI emotion analysis (mocked Groq) ─────────────────────────────────────

class TestAnalyzeEmotionsWithAI:
    @pytest.mark.asyncio
    async def test_returns_valid_structure_on_success(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(
                content='{"emotions": {"joy": 0.85, "gratitude": 0.6}, "primary_emotion": "joy"}'
            ))]
        )
        with patch("app.services.emotion_service.get_groq_client", return_value=mock_groq_client):
            result = await analyze_emotions_with_ai("I feel so happy and thankful today!")

        assert "emotions" in result
        assert "primary_emotion" in result
        assert result["primary_emotion"] == "joy"
        assert isinstance(result["emotions"], dict)

    @pytest.mark.asyncio
    async def test_falls_back_on_groq_failure(self):
        with patch("app.services.emotion_service.get_groq_client", side_effect=Exception("API down")):
            result = await analyze_emotions_with_ai("I feel terrible.")

        # Should use TextBlob fallback — result must still be valid
        assert "primary_emotion" in result
        assert "emotions" in result

    @pytest.mark.asyncio
    async def test_validates_primary_emotion_against_list(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(
                content='{"emotions": {"joy": 0.9}, "primary_emotion": "UNKNOWN_INVALID"}'
            ))]
        )
        with patch("app.services.emotion_service.get_groq_client", return_value=mock_groq_client):
            result = await analyze_emotions_with_ai("Some text here.")

        # Should correct the invalid primary to the highest-scoring emotion
        assert result["primary_emotion"] in EMOTION_LIST
