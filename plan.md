# EduVoice LiveKit Real‑Time Voice Agent — Development Plan

## 1) Objectives (Core Outcomes)
- ✅ Add a distinct "Start Session" button on each lecture card (separate from existing per‑lecture tutor UI)
- ✅ Enable real‑time, bidirectional voice conversation using LiveKit
- ✅ Scope the agent's context strictly to the selected lecture (transcript + key chunks)
- ✅ Use GPT‑4 for LLM responses; Cartesia for TTS; Deepgram for STT in agent
- Ship a working POC first, then a V1 app flow, then expand & harden without breaking current features

## 2) Phases & Implementation Steps (POC → V1 → Expansion → Hardening)

### Phase 1: Core POC (WebRTC + Agent) — ✅ COMPLETED
**Status**: COMPLETED on 2025-11-09

**Completed Items**:
- ✅ Backend: LiveKit dependencies installed (livekit-api, livekit-agents with openai/cartesia/deepgram/silero plugins)
- ✅ Backend: LiveKit credentials added to .env (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
- ✅ Backend: POST /api/livekit/session/start endpoint implemented with token generation and metadata
- ✅ Agent Worker: lecture_agent.py created with GPT-4 + Cartesia TTS + Deepgram STT + Silero VAD
- ✅ Agent Worker: Running in dev mode and registered with LiveKit server (ID: AW_irjxK9mbCGMh)
- ✅ Frontend: livekit-client and @livekit/components-react installed
- ✅ Frontend: "Start Session" button added to LectureList component
- ✅ Frontend: LiveKitSessionDialog component created with connection management
- ✅ Services: Backend and frontend running; agent worker active

**Key Files Created/Modified**:
- `/app/backend/lecture_agent.py` - LiveKit agent worker script
- `/app/backend/server.py` - Added LiveKit session endpoint
- `/app/backend/.env` - Added LiveKit credentials
- `/app/frontend/src/components/LectureList.jsx` - Added Start Session button
- `/app/frontend/src/components/LiveKitSessionDialog.jsx` - New dialog component

**User Stories (Phase 1)** - Ready for Testing:
1. ✅ As a user, I can click Start Session and see a connect modal with mic permission prompt.
2. 🔄 As a user, after joining, I hear an immediate welcome from the agent. (Needs user testing)
3. 🔄 As a user, I can speak and receive a spoken reply within ~2–3s. (Needs user testing)
4. ✅ As a user, I can end the session cleanly.
5. ✅ As a developer, I can see logs confirming lecture_id metadata reached the agent.

**Testing Instructions for User**:
1. Sign in with Google at https://smart-quiz-ai-2.preview.emergentagent.com
2. Upload or select an existing lecture
3. Click "Start Session" button on the lecture card
4. Allow microphone permissions when prompted
5. Wait for connection (should see "Connected - Speak now")
6. Speak a question about the lecture
7. Listen for the AI tutor's response
8. Test mute/unmute and leave controls

### Phase 2: V1 App Development (Minimal but Complete Flow) — IN PROGRESS
**Status**: Not Started - Awaiting Phase 1 user testing feedback

Goal: Refine end‑to‑end Start Session flow based on user feedback

**Planned Tasks**:
- Backend (FastAPI)
  - Add session logging to MongoDB (session_id, lecture_id, user_id, created_at, ended_at)
  - Implement GET /api/livekit/session/{session_id} for session status
  - Add error handling for edge cases (no lectures, invalid lecture_id, token expiry)
  
- Frontend (React + MUI, design tokens per guidelines)
  - Refine SessionDialog based on user feedback
  - Add loading states and better error messages
  - Implement reconnection logic for dropped connections
  - Add session duration display
  
- Agent Improvements
  - Optimize system prompt based on lecture context quality
  - Tune VAD sensitivity for better turn detection
  - Add conversation memory within session
  
- Error Handling
  - Handle mic permission denial gracefully
  - Handle token expiry and refresh
  - Handle agent offline scenarios
  - Handle network disconnections
  
- Testing
  - Manual testing with real lectures
  - Test with different lecture lengths and topics
  - Test error scenarios (no mic, network issues, etc.)

**User Stories (Phase 2)**:
1. As a user, I see a Start Session button on every lecture card. ✅
2. As a user, I can join a room and see clear connection status. ✅
3. As a user, I can mute/unmute and leave anytime. ✅
4. As a user, I get readable errors when join fails or mic is blocked. 🔄
5. As a user, the UI feels consistent with the app (colors, spacing, glass surfaces). ✅

### Phase 3: Feature Expansion (Context, Transcript, Quality)
**Status**: Not Started

Goal: Make the agent lecture‑aware and improve UX

**Planned Tasks**:
- Agent Context Enhancement
  - Implement vector similarity search for relevant chunks during conversation
  - Build dynamic system prompt with top-K relevant chunks per question
  - Add citation support (e.g., "According to minute 15:30 of the lecture...")
  - Keep responses concise (under 100 words for voice clarity)
  
- Frontend Enhancements
  - Add optional live transcript panel showing conversation history
  - Implement reconnect button with retry logic
  - Add conversation export feature
  - Show agent "thinking" indicator
  
- Backend
  - POST /api/livekit/session/end to mark end state
  - Store conversation summary per session
  - Add session analytics (duration, questions asked, topics covered)
  
- Performance
  - Tune VAD/turn detection for <2s latency
  - Implement LLM context windowing for long conversations
  - Add conversation summarization for context management
  
- Testing
  - E2E: Ask factual question → verify contextually correct answer
  - Test with various question types (definition, explanation, example)
  - Verify citations are accurate

**User Stories (Phase 3)**:
1. As a user, I can ask content‑specific questions and get accurate, lecture‑aware answers.
2. As a user, I can view a simple running transcript of the conversation.
3. As a user, I can quickly retry joining if disconnected.
4. As a user, I can switch response language (en → es) for TTS where supported.
5. As a user, I see brief citations (e.g., "from section 02:15–03:05").

### Phase 4: Hardening & Polish (Production Readiness)
**Status**: Not Started

Goal: Stability, security, accessibility, and ops

**Planned Tasks**:
- Tokens & Security
  - Implement token TTL/refresh for long sessions (>1 hour)
  - Add rate limiting on session creation (max 5 concurrent per user)
  - Implement session timeout for inactive sessions
  
- Observability
  - Add structured logging with correlation IDs
  - Implement error taxonomy and monitoring
  - Add room/session metrics dashboard
  - Set up alerts for agent failures
  
- UX Polish
  - Add microphone/speaker device selection
  - Improve empty/error states with actionable messages
  - Implement full keyboard navigation
  - Respect prefers-reduced-motion
  - Add mobile-optimized layout
  
- Compatibility & Docs
  - Document agent worker deployment runbook
  - Create troubleshooting guide
  - Document environment variables
  - Add API documentation
  
- Testing
  - Run comprehensive testing agent suite
  - Fix all regressions
  - Verify no console errors
  - Test on multiple browsers and devices

**User Stories (Phase 4)**:
1. As a user, long sessions remain active without manual re‑join.
2. As a user, I can select my microphone/speaker devices.
3. As a user, screen reader announces connection and error states.
4. As a user, I can resume a recent session from history.
5. As a user, the UI remains responsive and smooth on mobile.

## 3) Current Status & Next Actions

**Current Status**:
- ✅ Phase 1 (POC) complete and ready for user testing
- 🔄 Awaiting user feedback to proceed with Phase 2
- LiveKit agent worker running and connected (ID: AW_irjxK9mbCGMh)
- Backend API endpoint functional at POST /api/livekit/session/start
- Frontend UI integrated and deployed

**Immediate Next Actions**:
1. **User Testing** - User should test the POC flow:
   - Sign in → Select lecture → Click Start Session → Speak → Verify response
2. **Collect Feedback** - Gather user feedback on:
   - Connection reliability
   - Audio quality
   - Response accuracy and relevance
   - Latency/responsiveness
   - UI/UX clarity
3. **Bug Fixes** - Address any critical issues found during testing
4. **Phase 2 Planning** - Based on feedback, prioritize Phase 2 tasks

**Deployment Notes**:
- Agent worker running via: `nohup python lecture_agent.py dev > /var/log/livekit-agent.log 2>&1 &`
- Logs available at: `/var/log/livekit-agent.log`
- Backend logs: `/var/log/supervisor/backend.err.log`
- Frontend logs: `/var/log/supervisor/frontend.err.log`

## 4) Success Criteria (Definition of Done)

**Phase 1 (Current)**:
- ✅ Clicking Start Session on any lecture opens a modal, requests mic permission, and joins a room
- 🔄 Agent greets within ~2–3s (needs user verification)
- 🔄 Agent answers at least one spoken question (needs user verification)
- ✅ Backend route /api/livekit/session/start works reliably
- ✅ Tokens scoped to room; metadata includes lecture_id
- ✅ UI follows design tokens (accent #007AFF for primary), glass surfaces, clear states
- ✅ All controls have data-testid attributes
- 🔄 No critical console or backend errors (needs verification)

**Phase 2+ (Future)**:
- Responses use lecture context via vector similarity
- Session data persisted to MongoDB
- Error handling covers all edge cases
- Testing agent e2e checks pass
- Performance meets <2s response time target

## 5) Technical Architecture

**Backend Stack**:
- FastAPI server with LiveKit token generation
- LiveKit Agents framework (v1.2.18)
- OpenAI GPT-4 for LLM
- Cartesia for TTS (using existing integration)
- Deepgram Nova-2 for STT
- Silero VAD for voice activity detection
- MongoDB for session/lecture storage

**Frontend Stack**:
- React with Material-UI components
- livekit-client (v2.15.14) for WebRTC
- @livekit/components-react (v2.9.15)
- Custom LiveKitSessionDialog component

**Agent Worker**:
- Runs as separate Python process
- Connects to LiveKit server via WebSocket
- Receives lecture context from MongoDB
- Processes audio in real-time pipeline: VAD → STT → LLM → TTS

**Data Flow**:
1. User clicks "Start Session" → Frontend requests token from backend
2. Backend generates LiveKit token with metadata (lecture_id, user_id)
3. Frontend connects to LiveKit room using token
4. Agent worker joins room automatically (dispatched by LiveKit)
5. Agent loads lecture context from MongoDB
6. User speaks → VAD detects speech → STT transcribes → LLM generates response → TTS speaks
7. Bidirectional audio streams via WebRTC

## 6) Known Limitations & Future Improvements

**Current Limitations**:
- Agent context uses only first 3000 chars of transcript (Phase 3 will add vector search)
- No conversation memory across sessions
- No session persistence/resume capability
- Single agent instance (no horizontal scaling yet)
- No device selection UI
- No transcript display

**Planned Improvements**:
- Vector similarity search for relevant context (Phase 3)
- Conversation memory and summarization (Phase 3)
- Session history and resume (Phase 4)
- Multi-agent scaling (Phase 4)
- Advanced audio controls (Phase 4)
- Live transcript panel (Phase 3)

## Notes
- Phase 1 POC is complete and ready for user testing
- No changes made to MONGO_URL or REACT_APP_BACKEND_URL (as required)
- LiveKit credentials stored securely in backend .env only
- Agent worker must remain running for sessions to work
- All existing features (existing AI tutor, quiz, etc.) remain unchanged
