# EduVoice LiveKit Real‑Time Voice Agent — Development Plan

## 1) Objectives (Core Outcomes)
- Add a distinct "Start Session" button on each lecture card (separate from existing per‑lecture tutor UI)
- Enable real‑time, bidirectional voice conversation using LiveKit
- Scope the agent’s context strictly to the selected lecture (transcript + key chunks)
- Use GPT‑4 for LLM responses; Cartesia for TTS (existing integration); Deepgram (or existing STT) for STT in agent
- Ship a working POC first, then a V1 app flow, then expand & harden without breaking current features

## 2) Phases & Implementation Steps (POC → V1 → Expansion → Hardening)

### Phase 1: Core POC (WebRTC + Agent) — REQUIRED
Goal: Prove LiveKit token generation + agent joins a room + speaks a greeting using GPT‑4
- Backend
  - Add LiveKit server token generation helper (no external exposure yet)
  - Store LiveKit creds via env (keep MONGO_URL/REACT_APP_BACKEND_URL untouched)
- Agent Worker (separate script/process)
  - Implement minimal LiveKit Agents worker: vad + stt + llm (OpenAI GPT‑4) + tts (Cartesia)
  - Accept lecture_id via job/room metadata; log receipt
  - On connect: greet user; basic echo of user speech as reply (prove RTT path)
- Websearch (best practices)
  - Review: LiveKit Agents voice-ai start; LangChain plugin; Agent dispatch with room metadata
- Manual Test
  - Generate a dev token, join a test room from browser, confirm agent greets and replies

User Stories (Phase 1)
1. As a user, I can click Start Session and see a connect modal with mic permission prompt.
2. As a user, after joining, I hear an immediate welcome from the agent.
3. As a user, I can speak and receive a spoken reply within ~2–3s.
4. As a user, I can end the session cleanly.
5. As a developer, I can see logs confirming lecture_id metadata reached the agent.

### Phase 2: V1 App Development (Minimal but Complete Flow)
Goal: Ship end‑to‑end Start Session flow per lecture with proper UI and backend API
- Backend (FastAPI)
  - POST /api/livekit/session/start { lecture_id } → { token, url, room_name, metadata }
  - Validate lecture_id exists; embed {lecture_id, user_id} in agent dispatch metadata
  - Record basic session doc (session_id, lecture_id, user_id, created_at)
- Frontend (React + MUI, design tokens per guidelines)
  - Add "Start Session" button on each lecture card (LectureList)
  - Implement SessionDialog: connect to LiveKit via livekit-client, show states: Connecting/Connected/Error
  - Controls: Mute/Unmute, Leave; accessible focus/hover states; data-testid on all controls
  - Styling: use accent primary (#007AFF) for primary actions, glass surfaces for dialog
- Error Handling
  - Clear errors for mic denial, token failure, agent offline, disconnects
- Testing
  - Trigger testing agent for: endpoint exists, token returned, UI renders button/modals, join/leave flow callable

User Stories (Phase 2)
1. As a user, I see a Start Session button on every lecture card.
2. As a user, I can join a room and see clear connection status.
3. As a user, I can mute/unmute and leave anytime.
4. As a user, I get readable errors when join fails or mic is blocked.
5. As a user, the UI feels consistent with the app (colors, spacing, glass surfaces).

### Phase 3: Feature Expansion (Context, Transcript, Quality)
Goal: Make the agent lecture‑aware and improve UX
- Agent Context
  - Build system prompt using the lecture’s title + top‑K transcript chunks (vector similarity using existing embeddings)
  - Keep responses concise, educational; include citations (chunk index/time) when helpful
- Frontend Enhancements
  - Lightweight live transcript panel of agent/user (text‑only, optional toggle)
  - Reconnect button; retry logic on failures
- Backend
  - POST /api/livekit/session/end to mark end state; store short conversation summary per session
- Performance
  - Tune VAD/turn detection for lower latency; cap LLM context; summarize long chats
- Testing
  - E2E: ask a factual question from the lecture → contextually correct answer (spoken + text)

User Stories (Phase 3)
1. As a user, I can ask content‑specific questions and get accurate, lecture‑aware answers.
2. As a user, I can view a simple running transcript of the conversation.
3. As a user, I can quickly retry joining if disconnected.
4. As a user, I can switch response language (en → es) for TTS where supported.
5. As a user, I see brief citations (e.g., “from section 02:15–03:05”).

### Phase 4: Hardening & Polish (Production Readiness)
Goal: Stability, security, accessibility, and ops
- Tokens & Security
  - Token TTL/refresh for long sessions; rate‑limit session creation
- Observability
  - Structured logs, error taxonomy; room/session metrics
- UX Polish
  - Device selection; better empty/error states; keyboard navigation; reduced motion
- Compatibility & Docs
  - Document agent worker runbook; environment variables; troubleshooting
- Testing
  - Run full testing agent suite, fix regressions, verify no console errors

User Stories (Phase 4)
1. As a user, long sessions remain active without manual re‑join.
2. As a user, I can select my microphone/speaker devices.
3. As a user, screen reader announces connection and error states.
4. As a user, I can resume a recent session from history.
5. As a user, the UI remains responsive and smooth on mobile.

## 3) Next Actions (Execution Order)
1. Backend: add LiveKit dependencies (livekit-api, livekit-agents + openai/cartesia plugins, deepgram) and env keys (URL, API_KEY, API_SECRET) — keep existing critical env untouched
2. Implement POST /api/livekit/session/start returning {token, url, room_name} with metadata {lecture_id, user_id}
3. Create agent worker script (lecture_agent.py) with GPT‑4 + Cartesia TTS; accepts lecture_id via metadata; greet on join
4. Frontend: yarn add livekit-client; add Start Session button + SessionDialog join/leave flow
5. Manual POC test; then call testing agent for basic e2e

## 4) Success Criteria (Definition of Done)
- Clicking Start Session on any lecture opens a modal, requests mic permission, and joins a room
- Agent greets within ~2–3s and answers at least one spoken question
- Responses are generated by GPT‑4 and use the selected lecture’s context (Phase 3+)
- Backend route /api/livekit/session/start works reliably; tokens scoped to room; metadata includes lecture_id
- UI follows design tokens (accent #007AFF for primary), glass surfaces, clear states; all controls have data-testid
- Testing agent e2e checks pass; no critical console or backend errors

Notes
- Phase 1 is mandatory due to WebRTC + agent worker complexity; do not proceed until the POC succeeds.
- No changes to MONGO_URL or REACT_APP_BACKEND_URL. LiveKit credentials live in backend env only.
