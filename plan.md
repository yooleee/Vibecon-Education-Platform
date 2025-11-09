# EduVoice Quiz Feature — Development Plan

## 1) Objectives
- Add a voice-first quiz system on top of existing lectures: AI asks, user answers via voice, with text fallback.
- On-demand quiz start via button; user-configurable question count (default 5) and mixed types (MCQ/True-False/Open-ended).
- Real-time evaluation with immediate feedback + optional hints; tutor voice via Cartesia.
- Persist quiz results in MongoDB; expose history + lightweight analytics.
- Use Emergent LLM key for quiz generation/evaluation; integrate cleanly with current FastAPI + React + LangGraph stack.

## 2) Implementation Steps (Phased)

Note: This is a Level 3 (Simple LLM/AI integration) → POC required before full build.

### Phase 1 — Core POC (Isolation) [In Progress]
Goal: Prove end-to-end core loop works: generate one question from lecture transcript → speak it → accept short recorded answer → transcribe → evaluate → speak feedback.

Scope
- LLM POC: Generate 1 MCQ and 1 open-ended question from a short transcript stub using Emergent LLM.
- TTS POC: Convert the question and feedback to audio via existing Cartesia integration.
- STT POC: Reuse existing transcription_service to transcribe a sample audio answer.
- Minimal API: temporary /api/quiz/poc to run the above chain using a fixed lecture.
- Data model draft: QuizQuestion (uuid, type, prompt, options, correct_answer, rubric), QuizEval (is_correct, feedback, hint).

User Stories
1. As a learner, I can click “Run Quiz POC” and hear an AI question in voice.
2. As a learner, I can record a short voice answer and have it transcribed.
3. As a learner, I receive immediate spoken feedback on my answer.
4. As a learner, I can request a hint if I’m unsure.
5. As a learner, I can replay the question audio once.

Exit Criteria
- Single Q/A loop works reliably (question → voice → answer → evaluate → voiced feedback) without crashes.

### Phase 2 — V1 App Development (MVP Quiz Flow) [Next]
Goal: Ship a working quiz experience per lecture with configurable settings.

Backend
- Endpoints (all prefixed with /api):
  - POST /api/quiz/session/start {lecture_id, num_questions=5, types=[mcq,t_f,open], voice_mode=true}
  - GET  /api/quiz/session/{session_id}/next → returns next question (+ TTS audio URL)
  - POST /api/quiz/session/{session_id}/answer {question_id, user_answer(text)} → evaluation, feedback (+ TTS)
  - POST /api/quiz/session/{session_id}/answer-voice (multipart) → STT + evaluation
  - POST /api/quiz/session/{session_id}/finish → finalize and persist result (UUIDs, timezone-aware datetimes)
- LLM: Prompt templates for question generation (balanced mix by type) and evaluation with hints; use Emergent LLM key.
- Storage: Persist QuizResult in MongoDB (per user + lecture).

Frontend
- Add Start Quiz button in LectureViewer; QuizConfig modal (count, types, difficulty, voice/text mode).
- QuizInterface: Question card, MCQ options, voice record input, real-time progress, feedback banner, replay audio.
- Results screen: score, breakdown by question, basic charts later.

User Stories
1. As a learner, I can start a quiz from any processed lecture and choose number of questions.
2. As a learner, I hear each question in the lecturer’s cloned voice.
3. As a learner, I answer via microphone or type when voice fails.
4. As a learner, I immediately see/hear correctness and can get a hint.
5. As a learner, I see progress (Q x of N) and my running score.

Exit Criteria
- Complete N-question session runs end-to-end in voice mode with mixed types; data saved; no console/backend errors.

### Phase 3 — History & Analytics + Polish [Next]
Goal: Persist results and provide a simple history/analytics view.

Backend
- GET /api/quiz/history?limit&lecture_id
- GET /api/quiz/analytics?timeframe (aggregate: avg score, quizzes taken, best score)

Frontend
- QuizHistoryDashboard with filters; simple line chart of scores over time.
- Results view shows per-question review and a Retake button.

User Stories
1. As a learner, I can view my past quiz attempts across lectures.
2. As a learner, I can filter history by lecture and timeframe.
3. As a learner, I can review each question with my answer vs. correct.
4. As a learner, I can quickly retake a quiz from history.
5. As a learner, I can see my average score and best score.

Exit Criteria
- History endpoints return data; dashboard renders; retake flow works.

### Phase 4 — Real-Time Conversational Quiz (Streaming) + Enhancements [Next]
Goal: Make the quiz fully conversational with SSE streaming voice (AI asks, listens for “next”, provides hints mid-answer).

Backend
- SSE endpoint mirroring /api/v2/graph/query-stream style for quiz mode (ask → pause → capture answer audio → evaluate → continue).
- Intent detection for “start quiz/next/hint/repeat question”.

Frontend
- Live voice loop UI: speaking/listening states, waveform, phrase-level TTS streaming.
- Optional wake-phrase to start quiz hands-free (if feasible in browser constraints).

User Stories
1. As a learner, I can say “start quiz” to begin hands-free (if enabled).
2. As a learner, I hear the AI question streamed in natural phrases.
3. As a learner, I can interrupt to ask for a hint by voice.
4. As a learner, I can say “repeat” to replay the question.
5. As a learner, I can proceed through all questions without touching the UI.

Exit Criteria
- Stable conversational loop across at least one full 5-question session.

## 3) Next Actions (Immediate)
1. Integration playbook: Request Emergent LLM integration playbook for text generation; confirm model and usage.
2. Create minimal POC endpoint /api/quiz/poc and a tiny React POC button in LectureViewer.
3. Author prompt templates for question generation (MCQ + open-ended) and evaluation with rubric + hints.
4. Wire POC flow: transcript → generate 1 question → TTS → voice answer → STT → evaluate → TTS feedback.
5. Validate POC end-to-end on preview URL; iterate until reliable.

## 4) Success Criteria
- POC: One complete question loop works with voiced Q and voiced feedback (no crashes, sensible outputs).
- MVP: Multi-question session (default 5), mixed types, voice-first flow; results persisted; clean UI per design guidelines.
- Analytics: History list with basic stats (avg/best/volume) and per-quiz review.
- Reliability: No blocking errors in logs; graceful fallbacks from voice→text; endpoints under /api; UUIDs + timezone-aware datetimes.
- UX: Clear progress, immediate feedback, accessible controls; start/finish in under 2 clicks for defaults.
