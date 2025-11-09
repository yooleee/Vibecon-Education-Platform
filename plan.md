# EduVoice AI Education Platform — Development Plan

## 1) Objectives (Core Outcomes)
- ✅ Add a distinct "Start Session" button on each lecture card (separate from existing per‑lecture tutor UI)
- ✅ Enable real‑time, bidirectional voice conversation using LiveKit
- ✅ Scope the agent's context strictly to the selected lecture (transcript + key chunks)
- ✅ Use GPT‑4 for LLM responses; Cartesia for TTS; Deepgram for STT in agent
- 🔄 **NEW**: Add quiz generation feature to frontend with voice-first interaction
- Ship a working POC first, then a V1 app flow, then expand & harden without breaking current features

## 2) Phases & Implementation Steps

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

### Phase 2: Quiz Feature Integration to Frontend — 🔄 IN PROGRESS
**Status**: Starting Implementation

**Goal**: Add quiz generation UI to frontend and connect to existing backend quiz API

**User Requirements**:
1. Quiz trigger button in LectureViewer (next to summary button)
2. Use default settings (5 questions, medium difficulty, all types) - no config modal needed
3. Default to voice mode with text fallback option
4. Create separate Quiz History section in main App

**Backend API (Already Exists)**:
- ✅ POST /api/quiz/session/start - Generate quiz questions
- ✅ GET /api/quiz/session/{session_id}/next - Get next question
- ✅ POST /api/quiz/session/{session_id}/answer - Submit text answer
- ✅ POST /api/quiz/session/answer-voice - Submit voice answer
- ✅ GET /api/quiz/session/{session_id}/results - Get quiz results
- ✅ POST /api/quiz/session/{session_id}/save - Save quiz results to database
- ✅ GET /api/quiz/history - Get user's quiz history

**Frontend Tasks**:
1. **LectureViewer Component Updates**:
   - Add "Start Quiz" button next to "Generate Summary" button
   - Integrate quiz trigger with backend API
   - Handle quiz session creation
   
2. **Quiz Components** (Already exist in `/app/frontend/src/components/quiz/`):
   - ✅ QuizInterface.jsx - Main quiz container
   - ✅ QuizProgress.jsx - Progress tracking
   - ✅ QuizQuestion.jsx - Question display
   - ✅ QuizAnswerOptions.jsx - Answer selection
   - ✅ QuizVoiceInput.jsx - Voice recording
   - ✅ QuizFeedback.jsx - Feedback display
   - ✅ QuizResults.jsx - Results screen
   - ✅ QuizTriggerButton.jsx - Trigger button component
   - **Tasks**: 
     - Import and integrate these components into LectureViewer
     - Add quiz state management
     - Connect to backend quiz API endpoints
     - Ensure voice mode is default with text fallback
   
3. **Quiz History Section**:
   - Create new QuizHistorySection in App.jsx
   - Add navigation to Quiz History from header
   - Display user's past quiz results
   - Show quiz analytics (average score, total quizzes, etc.)
   - Allow filtering by lecture
   
4. **Styling & Design**:
   - Follow design guidelines from `/app/design_guidelines.md`
   - Use existing design tokens and color system
   - Maintain glassmorphism aesthetic
   - Ensure responsive design for mobile
   - Add proper data-testid attributes for all interactive elements

**Implementation Steps**:
1. Update LectureViewer.jsx:
   - Add "Start Quiz" button in header actions (next to summary button)
   - Add quiz state management (showQuiz, quizSession, etc.)
   - Implement handleStartQuiz function to call backend API
   - Add QuizInterface component integration
   
2. Integrate QuizInterface:
   - Import QuizInterface component
   - Pass necessary props (lectureId, sessionId, voiceMode, onClose)
   - Handle quiz completion and results display
   - Implement error handling for API failures
   
3. Create Quiz History Section:
   - Add new section in App.jsx after AI Tutor section
   - Create QuizHistoryDashboard component
   - Fetch quiz history from backend API
   - Display quiz results with filtering options
   - Show analytics and statistics
   
4. Testing:
   - Test quiz generation with different lectures
   - Test voice input functionality
   - Test text input fallback
   - Verify quiz results are saved correctly
   - Test quiz history display and filtering
   - Ensure mobile responsiveness

**User Stories (Phase 2)**:
1. As a user, I can click "Start Quiz" button in LectureViewer to begin a quiz
2. As a user, I can answer quiz questions using voice (default) or text
3. As a user, I see immediate feedback after each answer
4. As a user, I see my final quiz results with score and breakdown
5. As a user, I can view my quiz history in a dedicated section
6. As a user, I can filter quiz history by lecture
7. As a user, the quiz UI follows the same design language as the rest of the app

**Success Criteria**:
- ✅ Backend quiz API endpoints are functional
- 🔄 "Start Quiz" button appears in LectureViewer next to summary button
- 🔄 Quiz generates 5 questions with default settings (no config modal)
- 🔄 Voice mode is default with text input as fallback option
- 🔄 Quiz results are displayed at completion
- 🔄 Quiz history section shows past quiz results
- 🔄 All quiz components follow design guidelines
- 🔄 All interactive elements have data-testid attributes
- 🔄 Mobile responsive design works correctly

### Phase 3: LiveKit V1 App Development (Minimal but Complete Flow)
**Status**: Not Started - Awaiting Phase 1 user testing feedback

**Goal**: Refine end‑to‑end Start Session flow based on user feedback

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

### Phase 4: Feature Expansion (Context, Transcript, Quality)
**Status**: Not Started

**Goal**: Make the agent lecture‑aware and improve UX

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

### Phase 5: Hardening & Polish (Production Readiness)
**Status**: Not Started

**Goal**: Stability, security, accessibility, and ops

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
  
- Testing
  - Run comprehensive testing agent suite
  - Fix all regressions
  - Verify no console errors
  - Test on multiple browsers and devices

## 3) Current Status & Next Actions

**Current Status**:
- ✅ Phase 1 (LiveKit POC) complete and ready for user testing
- 🔄 Phase 2 (Quiz Feature Integration) starting implementation
- LiveKit agent worker running and connected (ID: AW_irjxK9mbCGMh)
- Backend quiz API fully functional
- Frontend quiz components exist but not integrated into main UI

**Immediate Next Actions**:
1. **Phase 2 Implementation** - Add quiz feature to frontend:
   - Update LectureViewer with "Start Quiz" button
   - Integrate existing QuizInterface components
   - Create Quiz History section
   - Test quiz flow end-to-end
   
2. **LiveKit Testing** - User should test the POC flow:
   - Sign in → Select lecture → Click Start Session → Speak → Verify response
   
3. **Quiz Testing** - After implementation:
   - Sign in → Select lecture → Click Start Quiz → Answer questions → View results
   - Test voice mode and text fallback
   - Verify quiz history displays correctly

## 4) Technical Architecture

**Backend Stack**:
- FastAPI server with LiveKit token generation
- LiveKit Agents framework (v1.2.18)
- OpenAI GPT-4 for LLM
- Cartesia for TTS (using existing integration)
- Deepgram Nova-2 for STT
- Silero VAD for voice activity detection
- MongoDB for session/lecture/quiz storage
- **Quiz API**: Existing endpoints for quiz generation, evaluation, and history

**Frontend Stack**:
- React with Material-UI components
- livekit-client (v2.15.14) for WebRTC
- @livekit/components-react (v2.9.15)
- Custom LiveKitSessionDialog component
- **Quiz Components**: QuizInterface, QuizProgress, QuizQuestion, QuizAnswerOptions, etc.
- Framer Motion for animations
- Axios for API calls

**Quiz Data Flow**:
1. User clicks "Start Quiz" in LectureViewer
2. Frontend calls POST /api/quiz/session/start with lectureId
3. Backend generates 5 quiz questions using LLM
4. Frontend displays first question with voice/text input options
5. User answers (voice or text) → Frontend submits to backend
6. Backend evaluates answer and returns feedback
7. Frontend displays feedback with audio (voice mode)
8. Repeat for remaining questions
9. Frontend displays final results
10. Results saved to MongoDB via backend API
11. Quiz history accessible from dedicated section

## 5) File Structure

**Backend** (Existing):
```
/app/backend/
├── routers/
│   ├── quiz_routes.py          ✅ Quiz API endpoints
│   └── graph_routes.py         ✅ LiveKit routes
├── services/
│   ├── quiz_service.py         ✅ Quiz generation & evaluation
│   ├── voice_service.py        ✅ Cartesia TTS
│   └── transcription_service.py ✅ Audio transcription
├── models/
│   ├── quiz.py                 ✅ Quiz data models
│   └── user.py                 ✅ User models
├── lecture_agent.py            ✅ LiveKit agent worker
└── server.py                   ✅ FastAPI main app
```

**Frontend** (To be updated):
```
/app/frontend/src/
├── components/
│   ├── quiz/
│   │   ├── QuizInterface.jsx           ✅ Exists, needs integration
│   │   ├── QuizProgress.jsx            ✅ Exists
│   │   ├── QuizQuestion.jsx            ✅ Exists
│   │   ├── QuizAnswerOptions.jsx       ✅ Exists
│   │   ├── QuizVoiceInput.jsx          ✅ Exists
│   │   ├── QuizFeedback.jsx            ✅ Exists
│   │   ├── QuizResults.jsx             ✅ Exists
│   │   ├── QuizTriggerButton.jsx       ✅ Exists
│   │   └── QuizConfigModal.jsx         ✅ Exists (won't use per requirements)
│   ├── LectureViewer.jsx               🔄 Needs update (add quiz button)
│   ├── Header.jsx                      🔄 Needs update (add quiz history nav)
│   └── LiveKitSessionDialog.jsx        ✅ Complete
├── App.jsx                              🔄 Needs update (add quiz history section)
└── styles/
    └── quiz.css                         ✅ Exists
```

## 6) Known Limitations & Future Improvements

**Current Limitations**:
- LiveKit agent context uses only first 3000 chars of transcript (Phase 4 will add vector search)
- No conversation memory across LiveKit sessions
- No session persistence/resume capability for LiveKit
- Quiz results not yet displayed in LectureViewer (Phase 2 will add)
- No quiz analytics dashboard (Phase 2 will add)
- Single LiveKit agent instance (no horizontal scaling yet)

**Planned Improvements**:
- Vector similarity search for relevant context (Phase 4)
- Conversation memory and summarization (Phase 4)
- Session history and resume (Phase 5)
- Quiz analytics dashboard with charts (Phase 2)
- Quiz difficulty adaptation based on performance (Future)
- Multi-agent scaling for LiveKit (Phase 5)
- Advanced audio controls (Phase 5)

## 7) Design Guidelines Reference

**Color System** (from design_guidelines.md):
- Primary: `#007AFF` (accent-primary)
- Success/Correct: `#34C759` (quiz-correct)
- Error/Incorrect: `#FF3B30` (quiz-incorrect)
- Warning/Hint: `#FF9500` (quiz-hint)
- Neutral: `#007AFF` (quiz-neutral)

**Quiz-Specific Design Rules**:
- Use white backgrounds for all quiz cards and questions
- Use solid colors for answer options (no gradients)
- Apply glassmorphism effects for depth
- Ensure WCAG AA contrast compliance (4.5:1 for text)
- Add data-testid attributes to all interactive elements
- Support keyboard navigation
- Provide focus states for all interactive elements
- Use voice-first design with text fallback

## Notes
- Phase 1 (LiveKit POC) is complete and ready for user testing
- Phase 2 (Quiz Integration) is starting implementation
- No changes made to MONGO_URL or REACT_APP_BACKEND_URL (as required)
- LiveKit credentials stored securely in backend .env only
- LiveKit agent worker must remain running for sessions to work
- Quiz backend API is fully functional and tested
- All existing features (existing AI tutor, LiveKit, summary) remain unchanged
- Design guidelines must be followed for all new UI components
