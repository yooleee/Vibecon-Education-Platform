# EduVoice → LangGraph Migration Plan

## Objectives
- Migrate orchestration to LangGraph while preserving existing FastAPI/React interfaces and feature parity (voice cloning, multilingual, SSE streaming).
- Add robust conversation memory (per-session, per-lecture) with MongoDB persistence (UUID IDs, UTC timestamps).
- Maintain or improve 2–3s time-to-first-token/audio via streaming generation + phrase-level TTS.
- Introduce versioned endpoints to avoid breaking current clients; allow side-by-side v1 and v2.
- Make future agent capability additions (tools/skills) simple via modular graph nodes.

## Architecture Blueprint (Target)
- Graph: StateGraph with nodes: input → retrieve → reason → tts → persist → end.
  - input: normalize text/voice input; voice path uses Whisper; text path passes through.
  - retrieve: embed latest user message → top-k chunk retrieval from existing lecture embeddings.
  - reason: GPT-4o with system+language instruction, uses conversation memory window + retrieved chunks; token streaming out.
  - tts: sentence/phrase buffer → Cartesia Sonic 3 in cloned professor voice; stream audio URLs.
  - persist: append user/assistant turns to Mongo; maintain rolling summary beyond token budget.
- State shape (Mongo + in-graph):
  `{ session_id, lecture_id, language, voice_id, messages[], summary?, relevant_chunks[], response_text? }`
- Storage:
  - Mongo collections: `sessions` (session_id→lecture_id, voice_id, language), `conversations` (session_id, messages, summary, updated_at), all UUID ids.
  - Reuse current filesystem lecture store for chunks/embeddings and cloned voice_id.
- Endpoints (new, versioned):
  - POST /api/v2/session/start {lecture_id, language?} → {session_id, voice_id}
  - POST /api/v2/graph/query {session_id, question} → JSON (non-stream fallback)
  - POST /api/v2/graph/query-stream (SSE) Form or JSON: {session_id, question? | audio? , language?}
  - Keep existing v1 endpoints untouched.
- Libraries: langgraph, langchain, langchain-openai (LLM); retain direct OpenAI for embeddings/whisper; Cartesia SDK for TTS.

## Phased Implementation (POC required)

### Phase 1: Core POC (Isolation) — Status: In Progress
Goal: Prove LangGraph + streaming + memory loop with minimal changes.
- Dependencies: add langgraph, langchain, langchain-openai; restart backend via supervisor.
- Implement `/backend/graph/graph.py` with a minimal StateGraph:
  - MessagesState, nodes: reason (ChatOpenAI gpt-4o), tts buffer (no Cartesia at first → stub), persist (in-memory dict), stream tokens via `graph.stream()`.
- SSE adapter: new FastAPI route `/api/v2/graph/query-stream` that wraps `graph.stream()` and yields SSE {type: start|text|complete}.
- Web research: best practices for (a) LangGraph streaming in FastAPI/SSE, (b) Mongo message history with LangGraph, (c) token-window memory vs summarization.
- Replace TTS stub with Cartesia call and phrase-level buffering (reuse existing SentenceBuffer).
- Persist minimal memory to Mongo (`conversations`), keyed by session_id; create `/api/v2/session/start` to seed session with lecture_id/voice_id.
- POC gating criteria:
  - First SSE text event ≤ 1.5s, first audio event ≤ 3s on a short prompt.
  - Follow-up “What did you just explain?” references prior turn (messages[] length increases in Mongo).
- User stories (Phase 1):
  1) As a student, I start a session and hear the first audio phrase within 3s.
  2) As a student, I ask a follow-up “What did you just say?” and the answer references the prior response.
  3) As a student, I switch to Spanish mid-session and responses speak Spanish.
  4) As an instructor, I can fetch conversation turns stored in Mongo by session_id.
  5) As QA, I see interleaved SSE events: start → text → audio → complete without connection drops.
- Testing: call testing agent for backend-only SSE stream + memory persistence verification.

### Phase 2: V1 App Development (Side-by-Side) — Status: Not Started
Goal: Integrate graph with existing RAG + Cartesia, keep v1 stable.
- Files:
  - `/backend/graph/graph.py` (full), `/backend/graph/memory.py` (Mongo), `/backend/routers/graph_routes.py` (APIRouter), small additions in `server.py` to include router only.
- Retrieval: use existing embeddings/chunks from lecture store; compute query embedding via existing service; k=3.
- Reasoning: GPT-4o with language instruction; maintain rolling window + summary to stay within token limits.
- TTS: replace stub with current Cartesia Sonic 3; use stored cloned `voice_id` from the lecture.
- SSE: reuse existing SentenceBuffer and audio URL serving; emit types: start/text/audio/complete/error.
- Versioning: add `/api/v2/*` routes; keep old `/api/voice-query-stream` operational.
- Frontend: add session handshake and use v2 stream behind a flag; v1 UI continues to work.
- Observability: log timings per node; collect p50/p95 time-to-first-text/audio.
- User stories (Phase 2):
  1) As a student, I upload a lecture (v1) and chat using new v2 stream with the cloned voice.
  2) As a student, I can continue using v1 endpoints; nothing breaks.
  3) As a student, follow-ups correctly reference prior turns in the same session.
  4) As a student, I can speak a question and receive streamed audio back.
  5) As QA, I can cold-start a session and see session/voice mapping created.
- Testing: end-to-end (backend + minimal frontend path), SSE stability, memory correctness; address regressions.

### Phase 3: Feature Expansion & Hardening — Status: Not Started
Goal: Production-ready memory and tooling flexibility.
- Memory: add long-chat summarization node (LangGraph subgraph) when token budget exceeded; TTL on sessions; resume by session_id.
- Tools: prepare plug-in nodes (e.g., code example, definition lookup) to demonstrate easy capability additions.
- Error handling: fallbacks if Cartesia or OpenAI degraded; graceful text-only stream.
- Internationalization: auto-detect question language; maintain language state; allow explicit override.
- Admin/ops: diagnostics endpoint for per-node timings and last error.
- User stories (Phase 3):
  1) As a student, long chats remain coherent via summarization.
  2) As a student, I can change the response language per message.
  3) As a student, I get a clear text response if TTS temporarily fails.
  4) As an admin, I can query latencies and failure counts per node.
  5) As a developer, I can add a “definition lookup” node without editing unrelated code.
- Testing: chaos/failure-path tests; memory window + summary correctness; language switching.

### Phase 4: Performance, Polish, Rollout — Status: Not Started
Goal: Hit latency targets and finalize migration.
- Performance: pre-warm models; parallelize retrieve+prefix prompt; cache frequent chunks; compress audio; tune phrase thresholds (5–7 words).
- Rollout: A/B v1 vs v2; canary enable v2 stream; docs for endpoints and session management.
- Cleanup: de-duplicate legacy logic once v2 proven; keep v1 behind feature flag.
- Security/limits: rate limits per session; max session duration; size caps.
- User stories (Phase 4):
  1) As a student, I consistently get first audio under 3s.
  2) As a student, I can disable memory for a single-turn Q&A mode.
  3) As an admin, I can throttle abusive sessions gracefully.
  4) As QA, I can run automated end-to-end tests that pass reliably.
  5) As a developer, I can migrate clients from v1 to v2 using clear docs.
- Testing: final E2E; latency SLO verification; soak tests.

## Implementation Steps (Concise)
1) Phase 1 POC: minimal graph + SSE + in-memory→Mongo persistence; replace TTS stub with Cartesia. Validate latency and follow-up coherence.
2) Add `/api/v2/session/start`, `/api/v2/graph/query(-stream)`; include APIRouter without touching v1 routes.
3) Wire retrieval from existing embedding_service; use current SentenceBuffer for phrase-level TTS.
4) Persist memory in Mongo using UUIDs and UTC datetimes; implement rolling summary.
5) Frontend adapter: add session start and use v2 stream via feature flag; keep existing flows intact.
6) Measure/optimize: precompute, cache, tune thresholds; log per-node durations.

## Next Actions (Immediate)
- Install LangGraph/chain deps and scaffold `/backend/graph` modules.
- Implement `/api/v2/session/start` and in-memory POC `/api/v2/graph/query-stream` returning SSE with text only; then add Cartesia audio.
- Run testing agent for backend streaming + memory; iterate until green.
- After POC passes, integrate real retrieval and finalize v2 endpoints; wire frontend behind flag.

## Success Criteria
- Functional: Multi-turn memory persists in Mongo; follow-ups reference prior answers; multilingual preserved.
- Performance: p95 time-to-first-text ≤ 1.5s, p95 time-to-first-audio ≤ 3.0s (short prompts, warmed).
- Compatibility: All v1 endpoints behave unchanged; v2 endpoints stable and documented.
- Extensibility: New tool node added without touching core nodes; code modular in `/backend/graph/*`.
- Reliability: SSE streams do not stall; recovery/fallback paths exercised; automated tests pass.
