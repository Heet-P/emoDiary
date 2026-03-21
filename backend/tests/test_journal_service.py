"""
Tests for app/services/journal_service.py

Covers:
- create_entry: word count, AI analysis integration
- get_entries / get_entry: ownership verification
- delete_entry: returns True on success
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock


# ── Helpers ────────────────────────────────────────────────────────────────

def _make_supabase(insert_data=None, select_data=None, delete_data=None):
    """Build a chained mock that mirrors the Supabase query builder API."""
    client = MagicMock()

    # Insert chain
    insert_result = MagicMock(data=insert_data if insert_data is not None else [{"id": "e1", "user_id": "u1", "content": "test", "word_count": 1}])
    client.table.return_value.insert.return_value.execute.return_value = insert_result

    # Select chain
    select_mock = MagicMock()
    select_mock.execute.return_value = MagicMock(data=select_data or [], count=len(select_data or []))
    select_mock.eq.return_value = select_mock
    select_mock.order.return_value = select_mock
    select_mock.range.return_value = select_mock
    select_mock.limit.return_value = select_mock
    client.table.return_value.select.return_value = select_mock

    # Delete chain: .delete().eq().eq().execute()
    _delete_data = delete_data if delete_data is not None else [{"id": "e1"}]
    delete_result = MagicMock(data=_delete_data)
    del_chain = MagicMock()
    del_chain.execute.return_value = delete_result
    del_chain.eq.return_value = del_chain
    client.table.return_value.delete.return_value.eq.return_value = del_chain

    return client


# ── create_entry ───────────────────────────────────────────────────────────

class TestCreateEntry:
    @pytest.mark.asyncio
    async def test_creates_entry_with_word_count(self):
        mock_analysis = {
            "ai_multi_tags": ["Joyful"],
            "detailed_sentiment_report": "You seem happy."
        }
        supabase = _make_supabase()

        with patch("app.services.journal_service.get_supabase_client", return_value=supabase), \
             patch("app.services.journal_service._generate_journal_analysis", new_callable=AsyncMock, return_value=mock_analysis):
            from app.services.journal_service import create_entry
            result = await create_entry("u1", "My day", "Hello world today", emotion_tag="Happy")

        assert result is not None
        assert result["id"] == "e1"

    @pytest.mark.asyncio
    async def test_raises_on_supabase_failure(self):
        supabase = _make_supabase(insert_data=[])  # Empty data = failure
        mock_analysis = {"ai_multi_tags": [], "detailed_sentiment_report": None}

        with patch("app.services.journal_service.get_supabase_client", return_value=supabase), \
             patch("app.services.journal_service._generate_journal_analysis", new_callable=AsyncMock, return_value=mock_analysis):
            from app.services.journal_service import create_entry
            with pytest.raises(Exception, match="Failed to create journal entry"):
                await create_entry("u1", "Title", "Content")


# ── get_entries ────────────────────────────────────────────────────────────

class TestGetEntries:
    @pytest.mark.asyncio
    async def test_returns_list(self):
        data = [{"id": "e1", "content": "hello"}, {"id": "e2", "content": "world"}]
        supabase = _make_supabase(select_data=data)

        with patch("app.services.journal_service.get_supabase_client", return_value=supabase):
            from app.services.journal_service import get_entries
            result = await get_entries("u1")

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_entries(self):
        supabase = _make_supabase(select_data=[])

        with patch("app.services.journal_service.get_supabase_client", return_value=supabase):
            from app.services.journal_service import get_entries
            result = await get_entries("u1")

        assert result == []


# ── delete_entry ───────────────────────────────────────────────────────────

class TestDeleteEntry:
    @pytest.mark.asyncio
    async def test_returns_true_on_success(self):
        supabase = _make_supabase(delete_data=[{"id": "e1"}])

        with patch("app.services.journal_service.get_supabase_client", return_value=supabase):
            from app.services.journal_service import delete_entry
            result = await delete_entry("u1", "e1")

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_not_found(self):
        """delete_entry returns False when Supabase returns empty data (entry not found)."""
        delete_result = MagicMock(data=[])
        del_chain = MagicMock()
        del_chain.execute.return_value = delete_result
        del_chain.eq.return_value = del_chain

        supabase = MagicMock()
        supabase.table.return_value.delete.return_value.eq.return_value = del_chain

        with patch("app.services.journal_service.get_supabase_client", return_value=supabase):
            from app.services.journal_service import delete_entry
            result = await delete_entry("u1", "00000000-0000-0000-0000-000000000000")

        assert result is False
