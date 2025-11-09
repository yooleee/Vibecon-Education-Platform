"""MongoDB models for session and conversation persistence"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


class SessionModel(BaseModel):
    """Session metadata stored in MongoDB"""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lecture_id: str
    voice_id: str  # Cloned professor voice
    language: str = "en"  # Default to English
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active"  # active, completed, expired


class MessageModel(BaseModel):
    """Individual message in a conversation"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Optional[Dict[str, Any]] = None  # Extra info (audio_url, chunks, etc.)


class ConversationModel(BaseModel):
    """Complete conversation history stored in MongoDB"""
    conversation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    messages: List[MessageModel] = []
    summary: Optional[str] = None  # Rolling summary for long conversations
    message_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
