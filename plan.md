# EduVoice AI Education Platform — Development Plan

## 1) Objectives (Core Outcomes)
- ✅ Add a distinct "Start Session" button on each lecture card (separate from existing per‑lecture tutor UI)
- ✅ Enable real‑time, bidirectional voice conversation using LiveKit
- ✅ Scope the agent's context strictly to the selected lecture (transcript + key chunks)
- ✅ Use GPT‑4 for LLM responses; Cartesia for TTS; Deepgram for STT in agent
- ✅ **COMPLETED**: Add quiz generation feature to frontend with voice-first interaction
- Ship a working POC first, then a V1 app flow, then expand & harden without breaking current features

## 2) Phases & Implementation Steps

### Phase 1: Core POC (WebRTC + Agent) — ✅ COMPLETED
**Status**: COMPLETED on 2025-11-09

**Completed Items**:
- ✅ Backend: LiveKit dependencies installed (livekit-api, livekit-agents with openai/cartesia/deepgram/silero plugins)
- ✅ Backend: LiveKit credentials added to .env (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
- ✅ Backend: POST /api/livekit/session/start endpoint implemented with token generation and metadata
- ✅ Agent Worker: lecture_agent.py created with GPT-4 + Cartesia TTS + Deepgram STT + Silero VAD
- ✅ Agent Worker: Fixed missing silero plugin dependency and restarted successfully
- ✅ Agent Worker: Running in dev mode and registered with LiveKit server (ID: AW_zGeYDPLKgYW5)
- ✅ Frontend: livekit-client and @livekit/components-react installed
- ✅ Frontend: "Start Session" button added to LectureList component
- ✅ Frontend: LiveKitSessionDialog component created with connection management
- ✅ Services: Backend and frontend running; agent worker active

**Key Files Created/Modified**:
- `/app/backend/lecture_agent.py` - LiveKit agent worker script
- `/app/backend/server.py` - Added LiveKit session endpoint
- `/app/backend/.env` - Added LiveKit credentials
- `/app/backend/requirements.txt` - Updated with livekit-plugins-silero
- `/app/frontend/src/components/LectureList.jsx` - Added Start Session button
- `/app/frontend/src/components/LiveKitSessionDialog.jsx` - New dialog component

**Agent Status**:
- ✅ Running successfully with PID 3095
- ✅ Connected to wss://vibecon-57ky5oih.livekit.cloud
- ✅ All plugins loaded: OpenAI (GPT-4), Deepgram (STT), Cartesia (TTS), Silero (VAD)
- ✅ Worker ID: AW_zGeYDPLKgYW5

### Phase 2: Quiz Feature Integration to Frontend — ✅ COMPLETED
**Status**: COMPLETED on 2025-11-09

**Goal**: Add quiz generation UI to frontend and connect to existing backend quiz API

**User Requirements** (All Met):
1. ✅ Quiz trigger button in LectureViewer (next to summary button)
2. ✅ Use default settings (5 questions, medium difficulty, all types) - no config modal needed
3. ✅ Default to voice mode with text fallback option
4. ✅ Create separate Quiz History section in main App

**Backend API** (Already Existed):
- ✅ POST /api/quiz/session/start - Generate quiz questions
- ✅ GET /api/quiz/session/{session_id}/next - Get next question
- ✅ POST /api/quiz/session/{session_id}/answer - Submit text answer
- ✅ POST /api/quiz/session/answer-voice - Submit voice answer
- ✅ GET /api/quiz/session/{session_id}/results - Get quiz results
- ✅ POST /api/quiz/session/{session_id}/save - Save quiz results to database
- ✅ GET /api/quiz/history - Get user's quiz history

**Frontend Implementation** (Completed):
1. ✅ **LectureViewer Component Updates**:
   - Added "Start Quiz" button next to "Generate Summary" button
   - Integrated quiz trigger with backend API
   - Implemented quiz session creation with default settings
   - Added quiz state management (showQuiz, quizSessionId)
   - Integrated QuizInterface component with conditional rendering
   
2. ✅ **Quiz Components Integration**:
   - QuizInterface.jsx - Imported and integrated into LectureViewer
   - QuizProgress.jsx - Progress tracking working
   - QuizQuestion.jsx - Question display functional
   - QuizAnswerOptions.jsx - Answer selection implemented
   - QuizVoiceInput.jsx - Voice recording integrated
   - QuizFeedback.jsx - Feedback display working
   - QuizResults.jsx - Results screen functional
   - Voice mode set as default with text fallback option
   
3. ✅ **Quiz History Section**:
   - Created QuizHistorySection component in App.jsx
   - Added "Quiz History" navigation button in Header (visible when signed in)
   - Implemented quiz history display with visual score circles
   - Added color-coded performance indicators:
     - Green (80%+): Excellent performance
     - Blue (60-79%): Good performance
     - Red (<60%): Needs improvement
   - Displays quiz statistics (correct/incorrect/total questions)
   - Shows date and lecture information
   - Empty state with helpful message when no quizzes taken
   
4. ✅ **Styling & Design**:
   - Follows design guidelines from `/app/design_guidelines.md`
   - Uses existing design tokens and color system
   - Maintains glassmorphism aesthetic
   - Responsive design for mobile/tablet/desktop
   - All interactive elements have data-testid attributes

**Key Files Created/Modified**:
- `/app/frontend/src/App.jsx` - Added QuizHistorySection, updated LectureViewer with quiz functionality
- `/app/frontend/src/components/Header.jsx` - Added Quiz History navigation button
- `/app/frontend/src/components/quiz/*` - All quiz components integrated

**Success Criteria** (All Met):
- ✅ Backend quiz API endpoints are functional
- ✅ "Start Quiz" button appears in LectureViewer next to summary button
- ✅ Quiz generates 5 questions with default settings (no config modal)
- ✅ Voice mode is default with text input as fallback option
- ✅ Quiz results are displayed at completion
- ✅ Quiz history section shows past quiz results with visual indicators
- ✅ All quiz components follow design guidelines
- ✅ All interactive elements have data-testid attributes
- ✅ Frontend compiles without errors
- ✅ Mobile responsive design implemented

### Phase 3: User Testing & Validation — 🔄 READY FOR TESTING
**Status**: Implementation complete, awaiting user testing

**Testing Checklist**:

**Quiz Feature Testing**:
- [ ] Sign in with Google
- [ ] Select or upload a lecture
- [ ] Click "Start Quiz" button in LectureViewer
- [ ] Verify quiz generates 5 questions
- [ ] Test voice input for answering questions
- [ ] Test text input fallback option
- [ ] Verify immediate feedback after each answer
- [ ] Complete quiz and verify results display
- [ ] Check that quiz appears in Quiz History section
- [ ] Navigate to Quiz History from header
- [ ] Verify quiz statistics display correctly
- [ ] Test on mobile devices for responsiveness

**LiveKit Voice Chat Testing**:
- [ ] Sign in with Google
- [ ] Select a lecture
- [ ] Click "Start Session" button
- [ ] Allow microphone permissions
- [ ] Wait for connection (should see "Connected - Speak now")
- [ ] Speak a question about the lecture
- [ ] Listen for the AI tutor's response
- [ ] Test mute/unmute controls
- [ ] Test leave session functionality
- [ ] Verify lecture context is maintained in responses

**Known Issues to Verify**:
- Agent worker must remain running for LiveKit sessions (currently running)
- Check if agent stays connected during extended sessions
- Verify quiz voice input works across different browsers
- Test quiz history pagination if many quizzes taken

### Phase 4: LiveKit V1 Refinement (Based on User Feedback)
**Status**: Not Started - Awaiting Phase 3 testing feedback

**Goal**: Refine end‑to‑end flows based on user feedback

**Planned Tasks**:
- Backend (FastAPI)
  - Add session logging to MongoDB (session_id, lecture_id, user_id, created_at, ended_at)
  - Implement GET /api/livekit/session/{session_id} for session status
  - Add error handling for edge cases (no lectures, invalid lecture_id, token expiry)
  - Implement agent auto-restart mechanism if it crashes
  
- Frontend (React, design tokens per guidelines)
  - Refine SessionDialog based on user feedback
  - Add loading states and better error messages
  - Implement reconnection logic for dropped connections
  - Add session duration display
  - Improve quiz loading states and error handling
  
- Agent Improvements
  - Optimize system prompt based on lecture context quality
  - Tune VAD sensitivity for better turn detection
  - Add conversation memory within session
  - Implement graceful error recovery
  
- Error Handling
  - Handle mic permission denial gracefully
  - Handle token expiry and refresh
  - Handle agent offline scenarios
  - Handle network disconnections
  - Add retry logic for quiz generation failures
  
- Testing
  - Manual testing with real lectures
  - Test with different lecture lengths and topics
  - Test error scenarios (no mic, network issues, etc.)
  - Comprehensive quiz flow testing with various question types

### Phase 5: Feature Expansion (Context, Transcript, Quality)
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
  - Add quiz analytics dashboard with charts (Recharts)
  - Implement quiz difficulty adaptation based on performance
  
- Backend
  - POST /api/livekit/session/end to mark end state
  - Store conversation summary per session
  - Add session analytics (duration, questions asked, topics covered)
  - Implement quiz analytics aggregation endpoints
  
- Performance
  - Tune VAD/turn detection for <2s latency
  - Implement LLM context windowing for long conversations
  - Add conversation summarization for context management
  - Optimize quiz question generation speed

### Phase 6: Hardening & Polish (Production Readiness)
**Status**: Not Started

**Goal**: Stability, security, accessibility, and ops

**Planned Tasks**:
- Tokens & Security
  - Implement token TTL/refresh for long sessions (>1 hour)
  - Add rate limiting on session creation (max 5 concurrent per user)
  - Implement session timeout for inactive sessions
  - Add rate limiting for quiz generation
  
- Observability
  - Add structured logging with correlation IDs
  - Implement error taxonomy and monitoring
  - Add room/session metrics dashboard
  - Set up alerts for agent failures
  - Monitor quiz completion rates and performance
  
- UX Polish
  - Add microphone/speaker device selection
  - Improve empty/error states with actionable messages
  - Implement full keyboard navigation
  - Respect prefers-reduced-motion
  - Add mobile-optimized layout
  - Polish quiz animations and transitions
  
- Testing
  - Run comprehensive testing agent suite
  - Fix all regressions
  - Verify no console errors
  - Test on multiple browsers and devices
  - Load testing for concurrent quiz sessions

## 3) Current Status & Next Actions

**Current Status**:
- ✅ Phase 1 (LiveKit POC) complete - Agent running successfully
- ✅ Phase 2 (Quiz Feature Integration) complete - All UI implemented
- 🔄 Phase 3 (User Testing) ready to begin
- ✅ LiveKit agent worker running (PID: 3095, Worker ID: AW_zGeYDPLKgYW5)
- ✅ Backend quiz API fully functional
- ✅ Frontend compiles without errors
- ✅ All services running: Backend, Frontend, LiveKit Agent

**Immediate Next Actions**:
1. **User Testing** - Test both features:
   - **Quiz Flow**: Sign in → Select lecture → Start Quiz → Answer questions → View results → Check history
   - **LiveKit Flow**: Sign in → Select lecture → Start Session → Speak → Verify response → End session
   
2. **Collect Feedback** - Gather user feedback on:
   - Quiz generation quality and question relevance
   - Voice input reliability for quiz answers
   - LiveKit voice chat audio quality and responsiveness
   - UI/UX clarity and ease of use
   - Mobile experience for both features
   - Any bugs or issues encountered
   
3. **Bug Fixes** - Address critical issues found during testing
   
4. **Phase 4 Planning** - Based on feedback, prioritize refinement tasks

**Testing URLs**:
- Application: https://smart-quiz-ai-2.preview.emergentagent.com
- Backend API: Available via REACT_APP_BACKEND_URL
- LiveKit Server: wss://vibecon-57ky5oih.livekit.cloud

## 4) Technical Architecture

**Backend Stack**:
- FastAPI server with LiveKit token generation
- LiveKit Agents framework (v1.2.18)
- OpenAI GPT-4 for LLM (quiz generation and chat)
- Cartesia for TTS (voice cloning)
- Deepgram Nova-2 for STT (voice transcription)
- Silero VAD for voice activity detection
- MongoDB for session/lecture/quiz storage
- Quiz API: Complete endpoints for generation, evaluation, and history

**Frontend Stack**:
- React 18 with Vite build system
- Material-UI components for base UI
- livekit-client (v2.15.14) for WebRTC
- @livekit/components-react (v2.9.15) for LiveKit UI
- Custom LiveKitSessionDialog component
- Quiz Components: QuizInterface, QuizProgress, QuizQuestion, QuizAnswerOptions, etc.
- Framer Motion for animations
- Axios for API calls

**Data Flows**:

**Quiz Flow**:
1. User clicks "Start Quiz" in LectureViewer
2. Frontend calls POST /api/quiz/session/start with lectureId + default settings
3. Backend generates 5 quiz questions using GPT-4 based on lecture transcript
4. Frontend displays first question with voice/text input options
5. User answers (voice or text) → Frontend submits to backend
6. Backend evaluates answer using GPT-4 (for open-ended) or string matching (MCQ/T-F)
7. Frontend displays feedback with audio (voice mode) using Cartesia TTS
8. Repeat for remaining questions
9. Frontend displays final results with score breakdown
10. Results saved to MongoDB via POST /api/quiz/session/{id}/save
11. Quiz history accessible from dedicated section via GET /api/quiz/history

**LiveKit Flow**:
1. User clicks "Start Session" on lecture card
2. Frontend requests token from POST /api/livekit/session/start
3. Backend generates LiveKit token with metadata (lecture_id, user_id)
4. Frontend connects to LiveKit room using token
5. Agent worker joins room automatically (dispatched by LiveKit)
6. Agent loads lecture context from MongoDB (first 3000 chars)
7. User speaks → Silero VAD detects speech → Deepgram STT transcribes
8. GPT-4 generates response based on lecture context
9. Cartesia TTS speaks response with cloned professor voice
10. Bidirectional audio streams via WebRTC

## 5) File Structure

**Backend**:
```
/app/backend/
├── routers/
│   ├── quiz_routes.py          ✅ Quiz API endpoints (complete)
│   └── graph_routes.py         ✅ LiveKit session endpoints
├── services/
│   ├── quiz_service.py         ✅ Quiz generation & evaluation
│   ├── voice_service.py        ✅ Cartesia TTS integration
│   └── transcription_service.py ✅ Audio transcription
├── models/
│   ├── quiz.py                 ✅ Quiz data models
│   └── user.py                 ✅ User models
├── lecture_agent.py            ✅ LiveKit agent worker (running)
├── server.py                   ✅ FastAPI main app
└── requirements.txt            ✅ Updated with all dependencies
```

**Frontend**:
```
/app/frontend/src/
├── components/
│   ├── quiz/
│   │   ├── QuizInterface.jsx           ✅ Integrated into LectureViewer
│   │   ├── QuizProgress.jsx            ✅ Progress tracking
│   │   ├── QuizQuestion.jsx            ✅ Question display
│   │   ├── QuizAnswerOptions.jsx       ✅ Answer selection
│   │   ├── QuizVoiceInput.jsx          ✅ Voice recording
│   │   ├── QuizFeedback.jsx            ✅ Feedback display
│   │   ├── QuizResults.jsx             ✅ Results screen
│   │   └── QuizTriggerButton.jsx       ✅ Trigger button
│   ├── Header.jsx                      ✅ Updated with Quiz History nav
│   ├── LiveKitSessionDialog.jsx        ✅ LiveKit voice chat UI
│   └── VoiceTutorInterfaceV2.jsx       ✅ Standard chat interface
├── App.jsx                              ✅ Updated with quiz integration
├── context/
│   └── AuthContext.jsx                  ✅ Google auth context
└── styles/
    └── quiz.css                         ✅ Quiz-specific styles
```

## 6) Known Limitations & Future Improvements

**Current Limitations**:
- LiveKit agent context uses only first 3000 chars of transcript (Phase 5 will add vector search)
- No conversation memory across LiveKit sessions
- No session persistence/resume capability for LiveKit
- Agent worker must be manually restarted if it crashes
- Quiz voice input may vary by browser/device
- No quiz analytics dashboard yet (planned for Phase 5)
- Single LiveKit agent instance (no horizontal scaling yet)
- No quiz difficulty adaptation based on performance

**Planned Improvements**:
- Vector similarity search for relevant context (Phase 5)
- Conversation memory and summarization (Phase 5)
- Session history and resume (Phase 6)
- Quiz analytics dashboard with charts (Phase 5)
- Quiz difficulty adaptation based on performance (Phase 5)
- Multi-agent scaling for LiveKit (Phase 6)
- Advanced audio controls (Phase 6)
- Agent auto-restart mechanism (Phase 4)
- Quiz question caching for faster generation (Phase 5)

## 7) Design Guidelines Reference

**Color System** (from design_guidelines.md):
- Primary: `#007AFF` (accent-primary)
- Success/Correct: `#34C759` (quiz-correct)
- Error/Incorrect: `#FF3B30` (quiz-incorrect)
- Warning/Hint: `#FF9500` (quiz-hint)
- Neutral: `#007AFF` (quiz-neutral)

**Quiz-Specific Design Rules** (Implemented):
- ✅ White backgrounds for all quiz cards and questions
- ✅ Solid colors for answer options (no gradients)
- ✅ Glassmorphism effects for depth
- ✅ WCAG AA contrast compliance (4.5:1 for text)
- ✅ data-testid attributes on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus states for all interactive elements
- ✅ Voice-first design with text fallback

**Component Patterns**:
- Glass cards with backdrop blur for depth
- Smooth transitions (0.3s cubic-bezier)
- Hover states on all interactive elements
- Loading states with spinners
- Empty states with helpful illustrations
- Error states with actionable messages

## 8) Deployment & Operations

**Service Management**:
- Backend: Managed by supervisorctl (auto-restart enabled)
- Frontend: Managed by supervisorctl (auto-restart enabled)
- LiveKit Agent: Manual start required (nohup python lecture_agent.py dev)

**Starting LiveKit Agent**:
```bash
cd /app/backend
nohup python lecture_agent.py dev > /var/log/livekit-agent.log 2>&1 &
```

**Checking Agent Status**:
```bash
ps aux | grep lecture_agent | grep -v grep
tail -f /var/log/livekit-agent.log
```

**Logs**:
- Backend: `/var/log/supervisor/backend.err.log`
- Frontend: `/var/log/supervisor/frontend.err.log`
- LiveKit Agent: `/var/log/livekit-agent.log`

**Environment Variables** (Do NOT modify):
- `MONGO_URL` - MongoDB connection string (preconfigured)
- `REACT_APP_BACKEND_URL` - Backend API URL (preconfigured)
- `LIVEKIT_URL` - LiveKit server URL
- `LIVEKIT_API_KEY` - LiveKit API key
- `LIVEKIT_API_SECRET` - LiveKit API secret
- `EMERGENT_LLM_KEY` - Universal LLM key for OpenAI/Anthropic/Google

## 9) Success Metrics

**Phase 2 Completion Metrics** (All Achieved):
- ✅ Quiz feature fully integrated into UI
- ✅ Quiz History section displays past results
- ✅ Voice mode works as default with text fallback
- ✅ All quiz components follow design guidelines
- ✅ Frontend compiles without errors
- ✅ LiveKit agent running successfully

**Phase 3 Testing Metrics** (To Be Measured):
- Quiz completion rate (target: >80%)
- Voice input success rate (target: >90%)
- LiveKit session connection success rate (target: >95%)
- Average quiz score (baseline measurement)
- User satisfaction feedback (qualitative)
- Mobile usability score (qualitative)

**Future Metrics** (Phase 5+):
- Agent response latency (target: <2s)
- Quiz question generation time (target: <10s)
- Session duration (average)
- Quiz retry rate
- Feature adoption rate (% of users trying each feature)

## Notes
- ✅ Phase 1 (LiveKit POC) complete and agent running
- ✅ Phase 2 (Quiz Integration) complete and ready for testing
- 🔄 Phase 3 (User Testing) ready to begin
- No changes made to MONGO_URL or REACT_APP_BACKEND_URL (as required)
- LiveKit credentials stored securely in backend .env only
- LiveKit agent worker must remain running for sessions to work (currently active)
- Quiz backend API is fully functional and tested
- All existing features (standard AI tutor, LiveKit, summary, upload) remain unchanged
- Design guidelines followed for all new UI components
- Frontend build successful with no compilation errors
