"""
Shared pytest fixtures for emoDiary backend tests.
Mocks out Supabase and Groq so tests run without real credentials.
"""

import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_groq_client():
    """Return a MagicMock that quacks like a Groq client."""
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content='{"emotions": {"joy": 0.9}, "primary_emotion": "joy"}'))]
    )
    return client


@pytest.fixture
def mock_supabase():
    """Return a MagicMock that quacks like a Supabase client."""
    client = MagicMock()
    # Default: any table insert returns a sample row
    client.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "test-uuid", "user_id": "user-1", "content": "test"}]
    )
    client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    return client
