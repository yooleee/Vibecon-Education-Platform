"""
LiveKit Agent Worker for EduVoice
This agent provides real-time voice tutoring for individual lectures
"""

import os
import json
import logging
import asyncio
from typing import Optional
from datetime import datetime

# LiveKit imports
from livekit import agents, rtc
from livekit.agents import (
    JobContext,
    WorkerOptions,
    cli,
    tokenize,
    tts,
    AutoSubscribe,
)
from livekit.plugins import openai, deepgram, cartesia, silero

# Local imports
from utils.storage import load_lecture
from services.embedding_service import generate_embeddings, compute_similarity

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LectureAssistant:
    """Assistant for answering questions about a specific lecture"""
    
    def __init__(self, lecture_id: str):
        self.lecture_id = lecture_id
        self.lecture_data = None
        self.load_lecture()
    
    def load_lecture(self):
        """Load lecture data from storage"""
        try:
            self.lecture_data = load_lecture(self.lecture_id)
            if self.lecture_data:
                logger.info(f"✅ Loaded lecture: {self.lecture_data.get('filename', 'Unknown')}")
            else:
                logger.warning(f"⚠️ Lecture {self.lecture_id} not found")
        except Exception as e:
            logger.error(f"❌ Error loading lecture: {str(e)}")
    
    def get_system_prompt(self) -> str:
        """Generate system prompt with lecture context"""
        if not self.lecture_data:
            return "You are a helpful AI teaching assistant."
        
        filename = self.lecture_data.get('filename', 'this lecture')
        transcript = self.lecture_data.get('transcript', '')
        
        # Use first 3000 chars of transcript for context
        transcript_preview = transcript[:3000] + "..." if len(transcript) > 3000 else transcript
        
        prompt = f"""You are an AI teaching assistant helping a student understand lecture material.

**Lecture**: {filename}

**Lecture Content Preview**:
{transcript_preview}

**Your Role**:
- Answer questions clearly and concisely about the lecture content
- Help clarify concepts from the material
- Provide examples when helpful
- Keep responses under 100 words for voice clarity
- Be encouraging and supportive
- If a question is outside the lecture scope, politely redirect to the material

**Important**: Respond naturally in a conversational tone suitable for voice interaction."""
        
        return prompt
    
    async def get_relevant_context(self, question: str) -> str:
        """Get relevant chunks from lecture for question"""
        if not self.lecture_data or 'embeddings' not in self.lecture_data:
            return ""
        
        try:
            # Generate embedding for question
            question_embedding = await generate_embeddings([question])
            
            # Find most relevant chunks
            similarities = compute_similarity(question_embedding[0], self.lecture_data["embeddings"])
            
            # Get top 2 most relevant chunks
            top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:2]
            relevant_chunks = [self.lecture_data["chunks"][i] for i in top_indices]
            
            context = "\n\n".join(relevant_chunks)
            logger.info(f"📚 Retrieved {len(relevant_chunks)} relevant chunks")
            return context
        except Exception as e:
            logger.error(f"❌ Error retrieving context: {str(e)}")
            return ""


async def entrypoint(ctx: JobContext):
    """Main entrypoint for LiveKit agent"""
    
    logger.info(f"🚀 Agent starting - Room: {ctx.room.name}")
    
    # Extract lecture_id from room metadata or participant metadata
    lecture_id = None
    
    # Try to get from room participants
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait a moment for participants to join
    await asyncio.sleep(1)
    
    # Get lecture_id from first participant metadata
    for participant in ctx.room.remote_participants.values():
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                lecture_id = metadata.get('lecture_id')
                if lecture_id:
                    logger.info(f"📚 Got lecture_id from participant metadata: {lecture_id}")
                    break
            except json.JSONDecodeError:
                pass
    
    # Fallback: try to parse from room name (format: lecture-{id}-{user}-{timestamp})
    if not lecture_id:
        parts = ctx.room.name.split('-')
        if len(parts) >= 2 and parts[0] == 'lecture':
            lecture_id = parts[1]
            logger.info(f"📚 Extracted lecture_id from room name: {lecture_id}")
    
    if not lecture_id:
        logger.error("❌ Could not determine lecture_id")
        lecture_id = "demo"  # Fallback
    
    # Initialize lecture assistant
    assistant = LectureAssistant(lecture_id)
    
    # Get system prompt with lecture context
    system_prompt = assistant.get_system_prompt()
    
    # Initialize chat context
    initial_ctx = agents.llm.ChatContext()
    initial_ctx.append(
        role="system",
        text=system_prompt
    )
    
    # Create voice pipeline agent
    agent = agents.VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-2-general"),
        llm=openai.LLM(model="gpt-4"),
        tts=cartesia.TTS(voice="a0e99841-438c-4a64-b679-ae501e7d6091"),  # Default Cartesia voice
        chat_ctx=initial_ctx,
        allow_interruptions=True,
        interrupt_speech_duration=0.5,
        interrupt_min_words=0,
        min_endpointing_delay=0.3
    )
    
    # Event handlers
    @agent.on("user_speech_committed")
    def on_user_speech(msg: agents.llm.ChatMessage):
        logger.info(f"👤 User said: {msg.content[:100]}...")
    
    @agent.on("agent_speech_committed")
    def on_agent_speech(msg: agents.llm.ChatMessage):
        logger.info(f"🤖 Agent replied: {msg.content[:100]}...")
    
    # Start the agent
    agent.start(ctx.room)
    
    # Greet the user
    lecture_title = assistant.lecture_data.get('filename', 'this lecture') if assistant.lecture_data else 'this lecture'
    greeting = f"Hello! I'm your AI tutor for {lecture_title}. Feel free to ask me any questions about the material."
    
    await agent.say(greeting, allow_interruptions=True)
    logger.info(f"👋 Greeted user in room {ctx.room.name}")


if __name__ == "__main__":
    """Run the agent worker"""
    
    # Get LiveKit credentials from environment
    livekit_url = os.getenv("LIVEKIT_URL")
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, livekit_api_key, livekit_api_secret]):
        raise ValueError("Missing LiveKit credentials. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET")
    
    # Configure worker options
    worker_opts = WorkerOptions(
        entrypoint_fnc=entrypoint,
        worker_type=agents.WorkerType.ROOM,
    )
    
    logger.info("🎙️ Starting LiveKit Agent Worker for EduVoice")
    logger.info(f"📡 Connecting to: {livekit_url}")
    
    # Run the agent
    cli.run_app(worker_opts)
