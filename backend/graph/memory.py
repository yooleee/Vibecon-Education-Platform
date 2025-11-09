"""MongoDB-based conversation memory management"""
import os
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from graph.models import SessionModel, ConversationModel, MessageModel
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
_mongo_client = None
_db = None


def get_mongo_client():
    """Get MongoDB client (singleton)"""
    global _mongo_client, _db
    if _mongo_client is None:
        mongo_url = os.getenv("MONGO_URL")
        _mongo_client = AsyncIOMotorClient(mongo_url)
        _db = _mongo_client.eduvoice
    return _db


class ConversationMemory:
    """Manage conversation memory with MongoDB persistence"""
    
    def __init__(self):
        self.db = get_mongo_client()
        self.sessions = self.db.sessions
        self.conversations = self.db.conversations
    
    async def create_session(self, lecture_id: str, voice_id: str, language: str = "en") -> SessionModel:
        """Create a new conversation session"""
        session = SessionModel(
            lecture_id=lecture_id,
            voice_id=voice_id,
            language=language
        )
        
        # Store in MongoDB
        await self.sessions.insert_one(session.model_dump())
        
        # Create initial conversation document
        conversation = ConversationModel(session_id=session.session_id)
        await self.conversations.insert_one(conversation.model_dump())
        
        return session
    
    async def get_session(self, session_id: str) -> Optional[SessionModel]:
        """Retrieve session metadata"""
        doc = await self.sessions.find_one({"session_id": session_id})
        if doc:
            return SessionModel(**doc)
        return None
    
    async def get_conversation(self, session_id: str) -> Optional[ConversationModel]:
        """Retrieve full conversation history"""
        doc = await self.conversations.find_one({"session_id": session_id})
        if doc:
            return ConversationModel(**doc)
        return None
    
    async def add_message(self, session_id: str, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to the conversation"""
        message = MessageModel(
            role=role,
            content=content,
            metadata=metadata
        )
        
        # Update conversation
        await self.conversations.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message.model_dump()},
                "$inc": {"message_count": 1},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
    
    async def update_summary(self, session_id: str, summary: str):
        """Update conversation summary for long conversations"""
        await self.conversations.update_one(
            {"session_id": session_id},
            {"$set": {"summary": summary, "updated_at": datetime.now(timezone.utc)}}
        )
    
    async def get_recent_messages(self, session_id: str, limit: int = 10) -> List[MessageModel]:
        """Get recent messages (for context window)"""
        conversation = await self.get_conversation(session_id)
        if conversation and conversation.messages:
            return conversation.messages[-limit:]
        return []
