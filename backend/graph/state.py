"""State definitions for the conversation graph"""
from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage


class ConversationState(TypedDict):
    """State schema for the conversation graph"""
    
    # Session identifiers
    session_id: str
    lecture_id: str
    
    # Voice and language configuration
    voice_id: str  # Cloned professor voice ID
    language: str  # en, es, hi
    
    # Conversation messages with LangChain's add_messages reducer
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Retrieval context
    relevant_chunks: Optional[List[str]]
    
    # Response building
    response_text: Optional[str]
    audio_chunks: Optional[List[dict]]  # [{"text": "...", "audio_url": "..."}]
    
    # Memory management
    summary: Optional[str]  # Rolling summary for long conversations
    message_count: int  # Track when to summarize
