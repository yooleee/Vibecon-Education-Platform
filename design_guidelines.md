# EduVoice AI Education Platform - Design Guidelines
## Quiz Feature Integration & Complete Design System

---

## 🎨 DESIGN PHILOSOPHY

EduVoice combines **Apple-inspired minimalism** with **educational warmth** to create an engaging, accessible AI tutoring experience. The quiz feature extends this philosophy with **real-time feedback**, **voice-first interaction**, and **gamified learning** while maintaining the platform's clean, professional aesthetic.

**Core Principles:**
- **Voice-First Design**: Prioritize voice interaction with text as optional fallback
- **Immediate Feedback**: Real-time visual and audio responses to user actions
- **Calm & Focused**: Soft colors and generous spacing reduce cognitive load
- **Accessible by Default**: WCAG AA compliance minimum, AAA where possible
- **Micro-interactions**: Subtle animations guide users and celebrate progress

---

## 🚫 GRADIENT RESTRICTION RULES

**CRITICAL: Follow these rules strictly to avoid overwhelming users**

### ❌ NEVER:
- Use dark/saturated gradient combos (purple→pink, blue→purple, red→orange)
- Let gradients cover more than 20% of viewport
- Apply gradients to text-heavy content or reading areas
- Use gradients on small UI elements (<100px width)
- Stack multiple gradient layers in same viewport
- Use gradients on quiz question cards or answer options

### ✅ ALLOWED GRADIENT USAGE:
- Hero section backgrounds (max 15% viewport, ensure text readability)
- Quiz completion celebration screens (full-screen overlay)
- Large CTA buttons (subtle, 2-color max)
- Decorative accent elements (progress bars, dividers)
- Empty state illustrations backgrounds

### 🔒 ENFORCEMENT RULE:
**IF** gradient area exceeds 20% of viewport **OR** impacts readability  
**THEN** fallback to solid colors or simple two-color gradients

---

## 🎨 COLOR SYSTEM

### Base Palette (Existing - Maintain Consistency)

```css
/* Primary Background Colors */
--background-primary: #FFFFFF;
--background-secondary: #F5F5F7;
--background-tertiary: #FAFAFA;
--surface: #FFFFFF;
--surface-elevated: rgba(255, 255, 255, 0.95);

/* Text Colors */
--text-primary: #1D1D1F;
--text-secondary: #6E6E73;
--text-tertiary: #86868B;
--text-inverse: #FFFFFF;

/* Accent Colors */
--accent-primary: #007AFF;        /* Primary actions, links */
--accent-primary-hover: #0051D5;
--accent-secondary: #34C759;      /* Success, correct answers */
--accent-tertiary: #FF9500;       /* Warnings, hints */
--accent-error: #FF3B30;          /* Errors, incorrect answers */
```

### Quiz-Specific Color Extensions

```css
/* Quiz State Colors */
--quiz-correct: #34C759;          /* Correct answer feedback */
--quiz-correct-bg: #E8F5E9;       /* Correct answer background */
--quiz-incorrect: #FF3B30;        /* Incorrect answer feedback */
--quiz-incorrect-bg: #FFEBEE;     /* Incorrect answer background */
--quiz-neutral: #007AFF;          /* Unanswered/neutral state */
--quiz-neutral-bg: #E3F2FD;       /* Neutral background */
--quiz-hint: #FF9500;             /* Hint indicator */
--quiz-hint-bg: #FFF3E0;          /* Hint background */

/* Voice Interaction Colors */
--voice-active: #34C759;          /* Recording active */
--voice-processing: #007AFF;      /* Processing speech */
--voice-listening: #FF9500;       /* AI listening indicator */
--voice-speaking: #5856D6;        /* AI speaking indicator */

/* Progress & Gamification */
--progress-incomplete: #E5E5EA;   /* Unfilled progress */
--progress-complete: #34C759;     /* Completed progress */
--streak-gold: #FFD700;           /* Achievement gold */
--streak-silver: #C0C0C0;         /* Achievement silver */
--streak-bronze: #CD7F32;         /* Achievement bronze */
```

### Glassmorphism (Existing - Maintain)

```css
--glass-white: rgba(255, 255, 255, 0.72);
--glass-white-border: rgba(255, 255, 255, 0.18);
--glass-light: rgba(245, 245, 247, 0.8);
--glass-light-border: rgba(209, 209, 214, 0.3);
--glass-blur: blur(20px);
--glass-blur-heavy: blur(40px);
```

### Shadows (Existing - Maintain)

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16);
--shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.15);

/* Quiz-specific shadows */
--shadow-quiz-card: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-quiz-card-hover: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-quiz-active: 0 0 0 4px rgba(0, 122, 255, 0.15);
```

### Color Usage Priority

1. **White backgrounds** (#FFFFFF) for all content cards, quiz questions, answer options
2. **Light gray backgrounds** (#F5F5F7) for page backgrounds, sections
3. **Accent colors** for interactive elements, feedback states
4. **Gradients** ONLY for hero sections (<15% viewport) and celebration screens

### Contrast Requirements

All color combinations MUST meet WCAG AA standards:
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18pt+): 3:1 minimum contrast ratio
- **UI components**: 3:1 minimum contrast ratio
- **Focus indicators**: 3:1 against adjacent colors

**Test all combinations with**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 📝 TYPOGRAPHY

### Font Family

```css
/* Primary Font Stack */
--font-primary: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace;

/* Quiz-specific: Use Inter for consistency */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

**Rationale**: Inter provides excellent readability at all sizes, supports multiple languages, and maintains the clean, modern aesthetic. Already integrated in the platform.

### Type Scale & Hierarchy

```css
/* Headings */
h1 {
  font-size: 3.5rem;           /* 56px - Hero titles */
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

h2 {
  font-size: 2.5rem;           /* 40px - Section titles */
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

h3 {
  font-size: 1.75rem;          /* 28px - Quiz titles */
  font-weight: 600;
  line-height: 1.3;
}

h4 {
  font-size: 1.25rem;          /* 20px - Question numbers */
  font-weight: 600;
  line-height: 1.4;
}

/* Body Text */
.body-large {
  font-size: 1.125rem;         /* 18px - Quiz questions */
  font-weight: 400;
  line-height: 1.6;
}

.body-regular {
  font-size: 1rem;             /* 16px - Answer options, descriptions */
  font-weight: 400;
  line-height: 1.6;
}

.body-small {
  font-size: 0.875rem;         /* 14px - Hints, metadata */
  font-weight: 400;
  line-height: 1.5;
}

/* UI Text */
.label {
  font-size: 0.875rem;         /* 14px - Form labels */
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.caption {
  font-size: 0.75rem;          /* 12px - Timestamps, counters */
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-tertiary);
}
```

### Responsive Typography

```css
/* Mobile (< 768px) */
@media (max-width: 768px) {
  h1 { font-size: 2.5rem; }    /* 40px */
  h2 { font-size: 2rem; }      /* 32px */
  h3 { font-size: 1.5rem; }    /* 24px */
  h4 { font-size: 1.125rem; }  /* 18px */
  .body-large { font-size: 1rem; }
}

/* Small Mobile (< 480px) */
@media (max-width: 480px) {
  h1 { font-size: 2rem; }      /* 32px */
  h2 { font-size: 1.75rem; }   /* 28px */
  h3 { font-size: 1.25rem; }   /* 20px */
}
```

### Typography Best Practices

- **Line Length**: 50-75 characters per line for optimal readability
- **Line Height**: 1.5-1.6 for body text, 1.1-1.3 for headings
- **Paragraph Spacing**: 1em (16px) between paragraphs
- **Letter Spacing**: Slightly tighter for large headings (-0.02em), normal for body
- **Font Weight**: 400 (regular) for body, 600 (semibold) for headings, 700 (bold) for emphasis

---

## 🧩 COMPONENT LIBRARY

### Existing Components (Maintain)

**Location**: `/app/frontend/src/components/`

- `Header.jsx` - Navigation header
- `VoiceTutorInterfaceV2.jsx` - Voice interaction interface
- `ChatInterface.jsx` - Text chat interface
- `UploadLecture.jsx` - Lecture upload component
- `LectureViewer.jsx` - Lecture viewing component
- `LectureList.jsx` - Lecture list display

**Material-UI Components Used**:
- Box, Card, CardContent, Typography
- IconButton, Button, Fab
- CircularProgress, LinearProgress
- Alert, Chip, Divider
- List, ListItem, ListItemText
- ToggleButtonGroup, ToggleButton
- Switch, FormControlLabel

### New Quiz Components to Create

#### 1. QuizInterface.jsx
**Purpose**: Main quiz container with voice/text toggle

**Structure**:
```jsx
<div className="quiz-container" data-testid="quiz-interface">
  <QuizHeader />
  <QuizProgress />
  <QuizQuestion />
  <QuizAnswerOptions />
  <QuizControls />
  <QuizFeedback />
</div>
```

**Styling**:
- Background: `var(--background-secondary)`
- Max-width: 900px
- Padding: `var(--space-2xl)`
- Border-radius: `var(--radius-xl)`

#### 2. QuizTriggerButton.jsx
**Purpose**: Button to start quiz from lecture interface

**Variants**:
- Primary: Voice quiz (default)
- Secondary: Text quiz
- Icon: Quiz icon (FontAwesome `fa-question-circle`)

**Styling**:
```css
.quiz-trigger-button {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.9) 0%, rgba(0, 81, 213, 0.9) 100%);
  color: var(--text-inverse);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.quiz-trigger-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
}

.quiz-trigger-button:active {
  transform: translateY(0);
}
```

**data-testid**: `quiz-trigger-button`

#### 3. QuizConfigModal.jsx
**Purpose**: Modal to configure quiz settings before starting

**Fields**:
- Number of questions (slider: 3-10, default 5)
- Question types (checkboxes: multiple choice, true/false, open-ended)
- Difficulty (radio: easy, medium, hard)
- Voice/Text mode toggle

**Styling**:
- Modal overlay: `rgba(0, 0, 0, 0.5)` with backdrop blur
- Modal card: White background, `var(--radius-xl)`, `var(--shadow-xl)`
- Width: 500px (mobile: 90vw)

**data-testid**: `quiz-config-modal`

#### 4. QuizQuestion.jsx
**Purpose**: Display current quiz question

**Structure**:
```jsx
<div className="quiz-question-card" data-testid="quiz-question-card">
  <div className="question-number">Question {currentQuestion}/{totalQuestions}</div>
  <h3 className="question-text">{questionText}</h3>
  <div className="question-type-badge">{questionType}</div>
  {voiceMode && <VoiceIndicator />}
</div>
```

**Styling**:
```css
.quiz-question-card {
  background: var(--surface);
  border: 1px solid var(--glass-light-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-quiz-card);
  margin-bottom: var(--space-xl);
  transition: all var(--transition-base);
}

.question-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: var(--space-md) 0;
  line-height: 1.5;
}

.question-number {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.question-type-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--quiz-neutral-bg);
  color: var(--quiz-neutral);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: var(--space-sm);
}
```

**data-testid**: `quiz-question-card`, `question-text`, `question-number`

#### 5. QuizAnswerOptions.jsx
**Purpose**: Display answer options for multiple choice/true-false

**Structure**:
```jsx
<div className="quiz-answer-options" data-testid="quiz-answer-options">
  {options.map((option, index) => (
    <button
      key={index}
      className={`answer-option ${selectedAnswer === index ? 'selected' : ''} ${feedbackState}`}
      onClick={() => handleAnswerSelect(index)}
      data-testid={`answer-option-${index}`}
    >
      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
      <span className="option-text">{option.text}</span>
      {feedbackState && <FeedbackIcon state={feedbackState} />}
    </button>
  ))}
</div>
```

**Styling**:
```css
.quiz-answer-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.answer-option {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: var(--surface);
  border: 2px solid var(--glass-light-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.answer-option:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-quiz-card-hover);
  transform: translateX(4px);
}

.answer-option.selected {
  border-color: var(--accent-primary);
  background: var(--quiz-neutral-bg);
  box-shadow: var(--shadow-quiz-active);
}

.answer-option.correct {
  border-color: var(--quiz-correct);
  background: var(--quiz-correct-bg);
  animation: correctPulse 0.5s ease-out;
}

.answer-option.incorrect {
  border-color: var(--quiz-incorrect);
  background: var(--quiz-incorrect-bg);
  animation: incorrectShake 0.5s ease-out;
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--background-secondary);
  border-radius: 50%;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

@keyframes correctPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes incorrectShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
```

**data-testid**: `quiz-answer-options`, `answer-option-{index}`

#### 6. QuizVoiceInput.jsx
**Purpose**: Voice input for open-ended questions

**Structure**:
```jsx
<div className="quiz-voice-input" data-testid="quiz-voice-input">
  <button
    className={`voice-record-button ${recording ? 'recording' : ''}`}
    onClick={toggleRecording}
    data-testid="voice-record-button"
  >
    <i className={recording ? 'fas fa-stop' : 'fas fa-microphone'}></i>
    <span>{recording ? 'Stop Recording' : 'Tap to Answer'}</span>
  </button>
  
  {recording && (
    <div className="voice-waveform" data-testid="voice-waveform">
      <div className="waveform-bar"></div>
      <div className="waveform-bar"></div>
      <div className="waveform-bar"></div>
      <div className="waveform-bar"></div>
      <div className="waveform-bar"></div>
    </div>
  )}
  
  {processing && (
    <div className="voice-processing" data-testid="voice-processing">
      <div className="spinner"></div>
      <span>Processing your answer...</span>
    </div>
  )}
</div>
```

**Styling**:
```css
.quiz-voice-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-2xl);
  background: var(--background-secondary);
  border-radius: var(--radius-lg);
}

.voice-record-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%);
  border: 4px solid var(--surface);
  border-radius: 50%;
  color: var(--text-inverse);
  font-size: 2rem;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-lg);
}

.voice-record-button:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-xl);
}

.voice-record-button.recording {
  background: linear-gradient(135deg, var(--accent-error) 0%, #C81414 100%);
  animation: recordingPulse 1.5s ease-in-out infinite;
}

.voice-record-button span {
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: var(--space-sm);
}

.voice-waveform {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
}

.waveform-bar {
  width: 4px;
  background: var(--accent-primary);
  border-radius: 2px;
  animation: waveform 1s ease-in-out infinite;
}

.waveform-bar:nth-child(1) { animation-delay: 0s; }
.waveform-bar:nth-child(2) { animation-delay: 0.1s; }
.waveform-bar:nth-child(3) { animation-delay: 0.2s; }
.waveform-bar:nth-child(4) { animation-delay: 0.3s; }
.waveform-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes recordingPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
  50% { box-shadow: 0 0 0 20px rgba(255, 59, 48, 0); }
}

@keyframes waveform {
  0%, 100% { height: 10px; }
  50% { height: 40px; }
}

.voice-processing {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
}
```

**data-testid**: `quiz-voice-input`, `voice-record-button`, `voice-waveform`, `voice-processing`

#### 7. QuizFeedback.jsx
**Purpose**: Display immediate feedback after answer submission

**Structure**:
```jsx
<div className={`quiz-feedback ${feedbackType}`} data-testid="quiz-feedback">
  <div className="feedback-icon">
    {feedbackType === 'correct' ? <i className="fas fa-check-circle"></i> : <i className="fas fa-times-circle"></i>}
  </div>
  <div className="feedback-content">
    <h4 className="feedback-title">{feedbackTitle}</h4>
    <p className="feedback-message">{feedbackMessage}</p>
    {showHint && (
      <div className="feedback-hint" data-testid="feedback-hint">
        <i className="fas fa-lightbulb"></i>
        <span>{hintText}</span>
      </div>
    )}
  </div>
  {voiceMode && <AudioPlayback audioUrl={feedbackAudioUrl} />}
</div>
```

**Styling**:
```css
.quiz-feedback {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  margin-top: var(--space-xl);
  animation: feedbackSlideIn 0.3s ease-out;
}

.quiz-feedback.correct {
  background: var(--quiz-correct-bg);
  border: 2px solid var(--quiz-correct);
}

.quiz-feedback.incorrect {
  background: var(--quiz-incorrect-bg);
  border: 2px solid var(--quiz-incorrect);
}

.feedback-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.quiz-feedback.correct .feedback-icon {
  color: var(--quiz-correct);
}

.quiz-feedback.incorrect .feedback-icon {
  color: var(--quiz-incorrect);
}

.feedback-content {
  flex: 1;
}

.feedback-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.feedback-message {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.feedback-hint {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--quiz-hint-bg);
  border-left: 4px solid var(--quiz-hint);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.feedback-hint i {
  color: var(--quiz-hint);
  margin-top: 2px;
}

@keyframes feedbackSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**data-testid**: `quiz-feedback`, `feedback-hint`

#### 8. QuizProgress.jsx
**Purpose**: Display quiz progress and score

**Structure**:
```jsx
<div className="quiz-progress" data-testid="quiz-progress">
  <div className="progress-header">
    <span className="progress-label">Progress</span>
    <span className="progress-score" data-testid="progress-score">
      {correctAnswers}/{totalQuestions}
    </span>
  </div>
  <div className="progress-bar-container">
    <div
      className="progress-bar-fill"
      style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
      data-testid="progress-bar-fill"
    ></div>
  </div>
  <div className="progress-indicators">
    {Array.from({ length: totalQuestions }).map((_, index) => (
      <div
        key={index}
        className={`progress-dot ${getQuestionState(index)}`}
        data-testid={`progress-dot-${index}`}
      ></div>
    ))}
  </div>
</div>
```

**Styling**:
```css
.quiz-progress {
  background: var(--surface);
  border: 1px solid var(--glass-light-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress-score {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--progress-incomplete);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-indicators {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--progress-incomplete);
  transition: all var(--transition-base);
}

.progress-dot.current {
  background: var(--accent-primary);
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.2);
}

.progress-dot.correct {
  background: var(--quiz-correct);
}

.progress-dot.incorrect {
  background: var(--quiz-incorrect);
}
```

**data-testid**: `quiz-progress`, `progress-score`, `progress-bar-fill`, `progress-dot-{index}`

#### 9. QuizResults.jsx
**Purpose**: Display quiz completion results and analytics

**Structure**:
```jsx
<div className="quiz-results" data-testid="quiz-results">
  <div className="results-celebration">
    <div className="celebration-icon">
      {score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪'}
    </div>
    <h2 className="results-title">Quiz Complete!</h2>
    <p className="results-subtitle">{getEncouragementMessage(score)}</p>
  </div>
  
  <div className="results-score-card" data-testid="results-score-card">
    <div className="score-circle">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" className="score-circle-bg" />
        <circle
          cx="50"
          cy="50"
          r="45"
          className="score-circle-fill"
          style={{ strokeDashoffset: calculateDashOffset(score) }}
        />
      </svg>
      <div className="score-percentage">{score}%</div>
    </div>
    <div className="score-details">
      <div className="score-stat">
        <span className="stat-value">{correctAnswers}</span>
        <span className="stat-label">Correct</span>
      </div>
      <div className="score-stat">
        <span className="stat-value">{incorrectAnswers}</span>
        <span className="stat-label">Incorrect</span>
      </div>
      <div className="score-stat">
        <span className="stat-value">{totalQuestions}</span>
        <span className="stat-label">Total</span>
      </div>
    </div>
  </div>
  
  <div className="results-breakdown" data-testid="results-breakdown">
    <h3>Question Breakdown</h3>
    {questions.map((question, index) => (
      <QuestionReviewCard key={index} question={question} index={index} />
    ))}
  </div>
  
  <div className="results-actions">
    <button className="glass-button-primary" onClick={retakeQuiz} data-testid="retake-quiz-button">
      <i className="fas fa-redo"></i>
      Retake Quiz
    </button>
    <button className="glass-button" onClick={returnToLecture} data-testid="return-lecture-button">
      <i className="fas fa-arrow-left"></i>
      Back to Lecture
    </button>
  </div>
</div>
```

**Styling**:
```css
.quiz-results {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-2xl);
}

.results-celebration {
  text-align: center;
  margin-bottom: var(--space-2xl);
  animation: celebrationBounce 0.6s ease-out;
}

.celebration-icon {
  font-size: 5rem;
  margin-bottom: var(--space-lg);
  animation: celebrationRotate 0.8s ease-out;
}

.results-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.results-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

.results-score-card {
  background: var(--surface);
  border: 1px solid var(--glass-light-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.score-circle {
  position: relative;
  width: 200px;
  height: 200px;
}

.score-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-circle-bg {
  fill: none;
  stroke: var(--progress-incomplete);
  stroke-width: 8;
}

.score-circle-fill {
  fill: none;
  stroke: var(--accent-secondary);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.score-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.score-details {
  display: flex;
  gap: var(--space-2xl);
}

.score-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.results-breakdown {
  margin-bottom: var(--space-2xl);
}

.results-breakdown h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-lg);
}

.results-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  flex-wrap: wrap;
}

@keyframes celebrationBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes celebrationRotate {
  0% { transform: rotate(0deg) scale(0); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
```

**data-testid**: `quiz-results`, `results-score-card`, `results-breakdown`, `retake-quiz-button`, `return-lecture-button`

#### 10. QuizHistoryDashboard.jsx
**Purpose**: Display quiz history and analytics

**Structure**:
```jsx
<div className="quiz-history-dashboard" data-testid="quiz-history-dashboard">
  <div className="dashboard-header">
    <h2>Quiz History</h2>
    <div className="dashboard-filters">
      <select className="filter-select" data-testid="lecture-filter">
        <option value="all">All Lectures</option>
        {lectures.map(lecture => (
          <option key={lecture.id} value={lecture.id}>{lecture.title}</option>
        ))}
      </select>
      <select className="filter-select" data-testid="timeframe-filter">
        <option value="week">Last Week</option>
        <option value="month">Last Month</option>
        <option value="all">All Time</option>
      </select>
    </div>
  </div>
  
  <div className="dashboard-stats">
    <StatCard
      icon="fa-chart-line"
      label="Average Score"
      value={`${averageScore}%`}
      trend={scoreTrend}
      data-testid="stat-average-score"
    />
    <StatCard
      icon="fa-clipboard-check"
      label="Quizzes Taken"
      value={totalQuizzes}
      data-testid="stat-total-quizzes"
    />
    <StatCard
      icon="fa-fire"
      label="Current Streak"
      value={`${currentStreak} days`}
      data-testid="stat-current-streak"
    />
    <StatCard
      icon="fa-trophy"
      label="Best Score"
      value={`${bestScore}%`}
      data-testid="stat-best-score"
    />
  </div>
  
  <div className="dashboard-chart" data-testid="dashboard-chart">
    <h3>Performance Over Time</h3>
    {/* Use Recharts LineChart here */}
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={performanceData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
  
  <div className="dashboard-history" data-testid="dashboard-history">
    <h3>Recent Quizzes</h3>
    {quizHistory.map((quiz, index) => (
      <QuizHistoryCard key={index} quiz={quiz} />
    ))}
  </div>
</div>
```

**Styling**:
```css
.quiz-history-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-2xl);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2xl);
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.dashboard-header h2 {
  font-size: 2rem;
  font-weight: 600;
}

.dashboard-filters {
  display: flex;
  gap: var(--space-md);
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--glass-light-border);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-select:hover {
  border-color: var(--accent-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

.dashboard-chart {
  background: var(--surface);
  border: 1px solid var(--glass-light-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-2xl);
  box-shadow: var(--shadow-md);
}

.dashboard-chart h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-lg);
}

.dashboard-history h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-lg);
}
```

**data-testid**: `quiz-history-dashboard`, `lecture-filter`, `timeframe-filter`, `stat-average-score`, `stat-total-quizzes`, `stat-current-streak`, `stat-best-score`, `dashboard-chart`, `dashboard-history`

---

## 🎭 MICRO-INTERACTIONS & ANIMATIONS

### Button Interactions

```css
/* Primary Button Hover */
.glass-button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
}

.glass-button-primary:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}

/* Answer Option Hover */
.answer-option:hover {
  transform: translateX(4px);
  border-color: var(--accent-primary);
}

/* Voice Button Pulse */
.voice-record-button.recording {
  animation: recordingPulse 1.5s ease-in-out infinite;
}

@keyframes recordingPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(255, 59, 48, 0);
  }
}
```

### Feedback Animations

```css
/* Correct Answer Pulse */
@keyframes correctPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Incorrect Answer Shake */
@keyframes incorrectShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* Feedback Slide In */
@keyframes feedbackSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Celebration Bounce */
@keyframes celebrationBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Celebration Rotate */
@keyframes celebrationRotate {
  0% { transform: rotate(0deg) scale(0); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
```

### Loading States

```css
/* Spinner */
.spinner {
  border: 3px solid var(--background-secondary);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--background-secondary) 0%,
    var(--background-tertiary) 50%,
    var(--background-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Voice Waveform */
@keyframes waveform {
  0%, 100% { height: 10px; }
  50% { height: 40px; }
}
```

### Progress Animations

```css
/* Progress Bar Fill */
.progress-bar-fill {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Progress Dot Scale */
.progress-dot.current {
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Score Circle Animation */
.score-circle-fill {
  stroke-dashoffset: 283;
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Transition Timing

```css
/* Transition Variables */
--transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);

/* Apply to specific properties only (NEVER use 'all') */
.interactive-element {
  transition: transform var(--transition-base),
              box-shadow var(--transition-base),
              border-color var(--transition-base),
              background-color var(--transition-base);
}
```

---

## 📐 LAYOUT & SPACING

### Spacing System (Existing - Maintain)

```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
--space-4xl: 6rem;     /* 96px */
--space-5xl: 8rem;     /* 128px */
```

### Border Radius (Existing - Maintain)

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Container Widths

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-xl);
}

.container-wide {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-2xl);
}

.container-narrow {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

/* Quiz-specific container */
.quiz-container {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-2xl);
}
```

### Grid Systems

```css
/* Existing Grid */
.grid {
  display: grid;
  gap: var(--space-xl);
}

.grid-2 {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

/* Quiz-specific grids */
.quiz-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.quiz-grid-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-lg);
}
```

### Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small Mobile: < 480px */
@media (max-width: 480px) {
  .quiz-container {
    padding: var(--space-lg);
  }
  
  .quiz-grid-2 {
    grid-template-columns: 1fr;
  }
  
  .voice-record-button {
    width: 100px;
    height: 100px;
  }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
  .quiz-answer-options {
    gap: var(--space-sm);
  }
  
  .answer-option {
    padding: var(--space-md);
  }
  
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .results-score-card {
    padding: var(--space-lg);
  }
  
  .score-circle {
    width: 150px;
    height: 150px;
  }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .quiz-container {
    max-width: 700px;
  }
  
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: > 1024px */
@media (min-width: 1024px) {
  .quiz-container {
    max-width: 900px;
  }
  
  .dashboard-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## ♿ ACCESSIBILITY

### WCAG Compliance

**Target**: WCAG 2.1 Level AA (minimum), AAA where possible

### Color Contrast

All text and UI elements MUST meet minimum contrast ratios:
- **Normal text** (< 18pt): 4.5:1
- **Large text** (≥ 18pt or 14pt bold): 3:1
- **UI components** (buttons, inputs, icons): 3:1
- **Focus indicators**: 3:1 against adjacent colors

**Testing Tools**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Safe](https://colorsafe.co)
- Chrome DevTools Accessibility Panel

### Focus States

```css
/* Global Focus Styles */
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Button Focus */
button:focus-visible,
.glass-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Input Focus */
.glass-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

/* Answer Option Focus */
.answer-option:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  box-shadow: var(--shadow-quiz-active);
}
```

### Keyboard Navigation

All interactive elements MUST be keyboard accessible:
- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward
- **Enter/Space**: Activate buttons and select options
- **Arrow Keys**: Navigate between answer options
- **Escape**: Close modals and cancel actions

**Implementation**:
```jsx
// Answer options keyboard navigation
const handleKeyDown = (e, index) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAnswerSelect(index);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusNextOption(index);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusPreviousOption(index);
  }
};
```

### Screen Reader Support

**ARIA Labels and Roles**:
```jsx
// Quiz Interface
<div role="main" aria-label="Quiz Interface">
  <div role="region" aria-label="Quiz Progress">
    <div role="progressbar" aria-valuenow={currentQuestion} aria-valuemin={1} aria-valuemax={totalQuestions}>
      Question {currentQuestion} of {totalQuestions}
    </div>
  </div>
  
  <div role="region" aria-label="Quiz Question">
    <h3 id="question-text">{questionText}</h3>
  </div>
  
  <div role="radiogroup" aria-labelledby="question-text">
    {options.map((option, index) => (
      <button
        role="radio"
        aria-checked={selectedAnswer === index}
        aria-label={`Option ${String.fromCharCode(65 + index)}: ${option.text}`}
        onClick={() => handleAnswerSelect(index)}
      >
        {option.text}
      </button>
    ))}
  </div>
</div>

// Voice Recording
<button
  aria-label={recording ? 'Stop recording answer' : 'Start recording answer'}
  aria-pressed={recording}
  onClick={toggleRecording}
>
  <i className={recording ? 'fas fa-stop' : 'fas fa-microphone'} aria-hidden="true"></i>
  <span>{recording ? 'Stop Recording' : 'Tap to Answer'}</span>
</button>

// Feedback
<div role="alert" aria-live="polite" aria-atomic="true">
  {feedbackMessage}
</div>
```

### Alternative Text

All images and icons MUST have descriptive alt text or aria-labels:
```jsx
<img src={imageUrl} alt="Student studying with laptop in modern classroom" />
<i className="fas fa-check-circle" aria-label="Correct answer"></i>
<i className="fas fa-times-circle" aria-label="Incorrect answer"></i>
```

### Reduced Motion

Respect user's motion preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  html {
    scroll-behavior: auto;
  }
  
  .voice-record-button.recording {
    animation: none;
  }
  
  .waveform-bar {
    animation: none;
  }
}
```

### Touch Targets

All interactive elements MUST have minimum touch target size:
- **Minimum**: 44x44px (iOS), 48x48px (Android)
- **Recommended**: 48x48px for all platforms

```css
.answer-option {
  min-height: 48px;
  padding: var(--space-lg);
}

.voice-record-button {
  width: 120px;
  height: 120px;
}

button {
  min-height: 44px;
  padding: 12px 24px;
}
```

---

## 🖼️ IMAGE ASSETS

### Image URLs by Category

#### Hero Section / Landing
```json
{
  "category": "hero",
  "usage": "Hero section background or feature image",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1758612898312-708f2ffdcd53",
      "description": "Happy child using laptop for education, writing in notebook",
      "placement": "Hero section, About section"
    },
    {
      "url": "https://images.unsplash.com/photo-1758612898304-1a6bb546ac44",
      "description": "Joyful child doing homework using laptop",
      "placement": "Features section, How it works"
    }
  ]
}
```

#### Student/User Images
```json
{
  "category": "students",
  "usage": "Testimonials, user profiles, feature demonstrations",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1758611974775-39e307bc3da9",
      "description": "Afro-American woman using laptop at home, taking notes",
      "placement": "Testimonials, User success stories"
    },
    {
      "url": "https://images.unsplash.com/photo-1758685733633-a12889098460",
      "description": "Young genius using laptop at school with chalkboard",
      "placement": "Quiz feature showcase, Educational content"
    },
    {
      "url": "https://images.pexels.com/photos/4144144/pexels-photo-4144144.jpeg",
      "description": "Student studying with laptop",
      "placement": "Dashboard, Profile sections"
    },
    {
      "url": "https://images.pexels.com/photos/4145151/pexels-photo-4145151.jpeg",
      "description": "Student learning online",
      "placement": "Learning interface, Tutorial sections"
    }
  ]
}
```

#### Abstract Backgrounds
```json
{
  "category": "backgrounds",
  "usage": "Section backgrounds, decorative elements (use sparingly, <20% viewport)",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1563291074-2bf8677ac0e5",
      "description": "Soft pink and orange watercolor gradient",
      "placement": "Hero section background (subtle overlay), Quiz completion screen"
    },
    {
      "url": "https://images.unsplash.com/photo-1634401072341-09c6d3af5717",
      "description": "Multicolored abstract painting",
      "placement": "Empty states, Loading screens (blurred)"
    },
    {
      "url": "https://images.unsplash.com/photo-1677064731182-ba7efa95f3e5",
      "description": "Abstract watercolor painting",
      "placement": "Section dividers, Decorative accents"
    }
  ]
}
```

#### Celebration/Success
```json
{
  "category": "celebration",
  "usage": "Quiz completion, achievements, success states",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1584890132374-d69d5d01483e",
      "description": "Blue and white confetti",
      "placement": "Quiz completion background, Achievement unlocked"
    },
    {
      "url": "https://images.unsplash.com/photo-1609378622049-0b3e45d776f3",
      "description": "Blue and yellow star particles",
      "placement": "High score celebration, Perfect quiz completion"
    },
    {
      "url": "https://images.unsplash.com/photo-1609378621807-f00a1a8991da",
      "description": "Blue star stickers",
      "placement": "Achievement badges, Progress milestones"
    },
    {
      "url": "https://images.pexels.com/photos/7944238/pexels-photo-7944238.jpeg",
      "description": "Celebration with confetti",
      "placement": "Quiz results celebration screen"
    },
    {
      "url": "https://images.pexels.com/photos/6532382/pexels-photo-6532382.jpeg",
      "description": "Success celebration",
      "placement": "Streak achievements, Milestone celebrations"
    },
    {
      "url": "https://images.pexels.com/photos/6120397/pexels-photo-6120397.jpeg",
      "description": "Achievement celebration",
      "placement": "Quiz completion overlay, Success modals"
    }
  ]
}
```

### Image Implementation Guidelines

1. **Optimization**: All images MUST be optimized for web
   - Use WebP format with JPEG fallback
   - Lazy load images below the fold
   - Use responsive images with srcset

2. **Accessibility**: All images MUST have descriptive alt text
   ```jsx
   <img
     src="https://images.unsplash.com/photo-1758612898312-708f2ffdcd53"
     alt="Happy child using laptop for education, writing in notebook at desk"
     loading="lazy"
   />
   ```

3. **Aspect Ratios**:
   - Hero images: 16:9 or 21:9
   - Feature images: 4:3 or 1:1
   - Background images: Full viewport or section height
   - Celebration overlays: Full viewport with transparency

4. **Overlay Usage**:
   ```css
   .hero-image-overlay {
     position: relative;
   }
   
   .hero-image-overlay::after {
     content: '';
     position: absolute;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: linear-gradient(
       135deg,
       rgba(255, 255, 255, 0.9) 0%,
       rgba(245, 245, 247, 0.8) 100%
     );
   }
   ```

---

## 📚 ADDITIONAL LIBRARIES & INTEGRATIONS

### Required Libraries

#### 1. Recharts (Data Visualization)
**Purpose**: Quiz analytics and performance charts

**Installation**:
```bash
npm install recharts
```

**Usage**:
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={performanceData}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-light-border)" />
    <XAxis
      dataKey="date"
      stroke="var(--text-secondary)"
      style={{ fontSize: '0.875rem' }}
    />
    <YAxis
      stroke="var(--text-secondary)"
      style={{ fontSize: '0.875rem' }}
    />
    <Tooltip
      contentStyle={{
        background: 'var(--surface)',
        border: '1px solid var(--glass-light-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)'
      }}
    />
    <Line
      type="monotone"
      dataKey="score"
      stroke="var(--accent-primary)"
      strokeWidth={2}
      dot={{ fill: 'var(--accent-primary)', r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
```

**Components to Use**:
- `LineChart`: Performance over time
- `BarChart`: Question type breakdown
- `PieChart`: Correct vs incorrect distribution
- `RadarChart`: Topic strength analysis

#### 2. FontAwesome (Icons)
**Purpose**: Icons for UI elements (already using Material-UI icons, but FontAwesome for additional icons)

**Installation**:
```bash
npm install @fortawesome/fontawesome-free
```

**Import in index.js**:
```jsx
import '@fortawesome/fontawesome-free/css/all.min.css';
```

**Usage**:
```jsx
<i className="fas fa-microphone"></i>
<i className="fas fa-stop"></i>
<i className="fas fa-check-circle"></i>
<i className="fas fa-times-circle"></i>
<i className="fas fa-lightbulb"></i>
<i className="fas fa-trophy"></i>
<i className="fas fa-fire"></i>
<i className="fas fa-chart-line"></i>
```

**Icon Categories**:
- **Voice**: `fa-microphone`, `fa-volume-up`, `fa-headphones`
- **Feedback**: `fa-check-circle`, `fa-times-circle`, `fa-exclamation-circle`
- **Actions**: `fa-play`, `fa-pause`, `fa-stop`, `fa-redo`
- **Navigation**: `fa-arrow-left`, `fa-arrow-right`, `fa-home`
- **Stats**: `fa-chart-line`, `fa-trophy`, `fa-fire`, `fa-star`
- **Quiz**: `fa-question-circle`, `fa-clipboard-check`, `fa-lightbulb`

#### 3. Framer Motion (Optional - Advanced Animations)
**Purpose**: Complex animations and page transitions

**Installation**:
```bash
npm install framer-motion
```

**Usage**:
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

**Use Cases**:
- Quiz question transitions
- Answer option entrance animations
- Results screen celebration
- Modal open/close animations

#### 4. React Confetti (Celebration Effects)
**Purpose**: Confetti animation for quiz completion

**Installation**:
```bash
npm install react-confetti
```

**Usage**:
```jsx
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const QuizResults = () => {
  const { width, height } = useWindowSize();
  const showConfetti = score >= 80;
  
  return (
    <div>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          colors={['#007AFF', '#34C759', '#FF9500', '#FF3B30']}
        />
      )}
      {/* Results content */}
    </div>
  );
};
```

#### 5. React Toastify (Notifications)
**Purpose**: Toast notifications for feedback and errors

**Installation**:
```bash
npm install react-toastify
```

**Setup in App.js**:
```jsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {/* App content */}
    </>
  );
}
```

**Usage**:
```jsx
import { toast } from 'react-toastify';

// Success
toast.success('Quiz submitted successfully!');

// Error
toast.error('Failed to load quiz. Please try again.');

// Info
toast.info('Hint: Consider the context of the question.');

// Warning
toast.warning('You have 30 seconds remaining.');
```

**Custom Styling**:
```css
.Toastify__toast {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-primary);
}

.Toastify__toast--success {
  background: var(--quiz-correct-bg);
  color: var(--quiz-correct);
}

.Toastify__toast--error {
  background: var(--quiz-incorrect-bg);
  color: var(--quiz-incorrect);
}
```

---

## 🎯 INSTRUCTIONS FOR MAIN AGENT

### Implementation Priority

1. **Phase 1: Core Quiz Components**
   - Create `QuizTriggerButton.jsx` in existing lecture interface
   - Create `QuizConfigModal.jsx` for quiz settings
   - Create `QuizInterface.jsx` as main container
   - Create `QuizQuestion.jsx` for question display
   - Create `QuizAnswerOptions.jsx` for answer selection

2. **Phase 2: Voice Integration**
   - Create `QuizVoiceInput.jsx` for voice recording
   - Integrate with existing Cartesia voice cloning
   - Add voice feedback playback
   - Implement real-time transcription display

3. **Phase 3: Feedback & Progress**
   - Create `QuizFeedback.jsx` for immediate feedback
   - Create `QuizProgress.jsx` for progress tracking
   - Implement hint system
   - Add score calculation logic

4. **Phase 4: Results & Analytics**
   - Create `QuizResults.jsx` for completion screen
   - Create `QuizHistoryDashboard.jsx` for analytics
   - Integrate Recharts for data visualization
   - Add confetti celebration for high scores

5. **Phase 5: Backend Integration**
   - Create quiz generation API endpoints
   - Implement quiz submission and evaluation
   - Add quiz history storage in MongoDB
   - Create analytics aggregation endpoints

### Component File Structure

```
/app/frontend/src/
├── components/
│   ├── quiz/
│   │   ├── QuizInterface.jsx
│   │   ├── QuizTriggerButton.jsx
│   │   ├── QuizConfigModal.jsx
│   │   ├── QuizQuestion.jsx
│   │   ├── QuizAnswerOptions.jsx
│   │   ├── QuizVoiceInput.jsx
│   │   ├── QuizFeedback.jsx
│   │   ├── QuizProgress.jsx
│   │   ├── QuizResults.jsx
│   │   ├── QuizHistoryDashboard.jsx
│   │   └── QuizHistoryCard.jsx
│   ├── Header.jsx
│   ├── VoiceTutorInterfaceV2.jsx
│   └── ...
├── styles/
│   ├── quiz.css (quiz-specific styles)
│   └── ...
├── App.css
└── index.css
```

### Styling Approach

1. **Use Existing Design Tokens**: All quiz components MUST use existing CSS variables from `index.css`
2. **Extend, Don't Replace**: Add quiz-specific variables without modifying existing ones
3. **Maintain Glassmorphism**: Use existing `.glass-card`, `.glass-button`, `.glass-input` classes
4. **Consistent Spacing**: Use existing spacing variables (`--space-*`)
5. **Responsive by Default**: All components MUST be mobile-first responsive

### Data Flow

```
User Clicks "Start Quiz"
  ↓
QuizConfigModal (configure settings)
  ↓
POST /api/quiz/generate (backend generates questions)
  ↓
QuizInterface (display first question)
  ↓
User Answers (voice or text)
  ↓
POST /api/quiz/evaluate (backend evaluates answer)
  ↓
QuizFeedback (display immediate feedback)
  ↓
Next Question or Results
  ↓
QuizResults (display final score)
  ↓
POST /api/quiz/save (save to database)
  ↓
QuizHistoryDashboard (view analytics)
```

### API Endpoints to Create

```python
# Backend (FastAPI)

@app.post("/api/quiz/generate")
async def generate_quiz(
    lecture_id: str,
    num_questions: int = 5,
    question_types: List[str] = ["multiple_choice", "true_false", "open_ended"],
    difficulty: str = "medium"
):
    """Generate quiz questions based on lecture content"""
    pass

@app.post("/api/quiz/evaluate")
async def evaluate_answer(
    question_id: str,
    user_answer: str,
    question_type: str
):
    """Evaluate user's answer and provide feedback"""
    pass

@app.post("/api/quiz/save")
async def save_quiz_result(
    user_id: str,
    lecture_id: str,
    quiz_data: dict
):
    """Save quiz results to database"""
    pass

@app.get("/api/quiz/history")
async def get_quiz_history(
    user_id: str,
    lecture_id: Optional[str] = None,
    limit: int = 10
):
    """Get user's quiz history"""
    pass

@app.get("/api/quiz/analytics")
async def get_quiz_analytics(
    user_id: str,
    timeframe: str = "month"
):
    """Get quiz analytics and statistics"""
    pass
```

### MongoDB Schema

```javascript
// Quiz Result Schema
{
  _id: ObjectId,
  user_id: String,
  lecture_id: String,
  quiz_id: String,
  created_at: Date,
  completed_at: Date,
  config: {
    num_questions: Number,
    question_types: [String],
    difficulty: String,
    voice_mode: Boolean
  },
  questions: [
    {
      question_id: String,
      question_text: String,
      question_type: String,
      options: [String],
      correct_answer: String,
      user_answer: String,
      is_correct: Boolean,
      time_taken: Number,
      hint_used: Boolean,
      feedback: String
    }
  ],
  score: {
    correct: Number,
    incorrect: Number,
    total: Number,
    percentage: Number
  },
  metadata: {
    voice_mode: Boolean,
    language: String,
    device: String
  }
}
```

### Testing Requirements

All interactive elements MUST include `data-testid` attributes:

```jsx
// Example
<button
  className="quiz-trigger-button"
  onClick={startQuiz}
  data-testid="quiz-trigger-button"
>
  Start Quiz
</button>

<div className="quiz-question-card" data-testid="quiz-question-card">
  <h3 data-testid="question-text">{questionText}</h3>
</div>

<button
  className="answer-option"
  onClick={() => selectAnswer(index)}
  data-testid={`answer-option-${index}`}
>
  {optionText}
</button>
```

### Accessibility Checklist

- [ ] All colors meet WCAG AA contrast requirements
- [ ] All interactive elements have focus states
- [ ] All images have descriptive alt text
- [ ] All icons have aria-labels
- [ ] Keyboard navigation works for all interactions
- [ ] Screen reader announcements for feedback
- [ ] Touch targets are minimum 44x44px
- [ ] Reduced motion preferences respected
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers

### Performance Optimization

1. **Lazy Load Components**: Use React.lazy() for quiz components
2. **Optimize Images**: Use WebP format with JPEG fallback
3. **Debounce Voice Input**: Prevent excessive API calls
4. **Cache Quiz Data**: Store quiz questions in local state
5. **Minimize Re-renders**: Use React.memo() for static components
6. **Code Splitting**: Separate quiz bundle from main app

### Error Handling

```jsx
// Example error handling
const handleQuizGeneration = async () => {
  try {
    setLoading(true);
    const response = await axios.post('/api/quiz/generate', quizConfig);
    setQuizData(response.data);
  } catch (error) {
    console.error('Quiz generation failed:', error);
    toast.error('Failed to generate quiz. Please try again.');
    // Fallback to cached questions or retry logic
  } finally {
    setLoading(false);
  }
};
```

### Voice Integration Notes

1. **Use Existing Cartesia Integration**: Leverage existing voice cloning setup from `VoiceTutorInterfaceV2.jsx`
2. **Voice Recording**: Use existing MediaRecorder implementation
3. **Audio Playback**: Use existing audio playback logic
4. **Transcription**: Display real-time transcription during recording
5. **Fallback**: Always provide text input option if voice fails

---

## 📋 COMMON MISTAKES TO AVOID

### ❌ DON'T:

1. **Use dark/saturated gradients** (purple→pink, blue→purple)
2. **Apply gradients to text-heavy areas** or reading content
3. **Use gradients on small UI elements** (<100px width)
4. **Let gradients cover more than 20% of viewport**
5. **Use universal transitions** (`transition: all`) - breaks transforms
6. **Center-align app container** (`.App { text-align: center; }`) - disrupts reading flow
7. **Use emoji icons** (🤖💡🎯) - use FontAwesome or Lucide React instead
8. **Mix multiple gradient directions** in same section
9. **Forget responsive font sizing** for mobile devices
10. **Ignore accessibility** (contrast, focus states, keyboard navigation)
11. **Skip data-testid attributes** on interactive elements
12. **Use fixed pixel sizes** for text (prevents user scaling)

### ✅ DO:

1. **Use white backgrounds** for all content cards and reading areas
2. **Use solid colors** for quiz questions and answer options
3. **Apply gradients only** to hero sections (<15% viewport) and celebration screens
4. **Use specific transitions** (transform, box-shadow, border-color, background-color)
5. **Maintain consistent spacing** using existing spacing variables
6. **Test on mobile devices** with touch interactions
7. **Include accessibility features** (focus states, ARIA labels, alt text)
8. **Use existing design tokens** from index.css
9. **Follow mobile-first approach** for responsive design
10. **Add data-testid attributes** to all interactive elements
11. **Provide voice AND text options** for all quiz interactions
12. **Test color contrast** with WebAIM Contrast Checker

---

## 🎨 DESIGN STYLE FUSION

EduVoice combines multiple design styles for a unique, engaging experience:

### Primary Style: **Minimalism + Glassmorphism**
- Clean, uncluttered interfaces
- Generous white space
- Frosted glass effects for depth
- Subtle shadows and borders

### Secondary Style: **Neomorphism (Subtle)**
- Soft, embossed buttons for voice controls
- Inner shadows for input fields
- Gentle elevation for cards

### Accent Style: **Gamification**
- Progress bars with gradient fills
- Achievement badges and streaks
- Celebration animations (confetti, bounces)
- Score circles with animated fills

### Layout Style: **Card-Based + F-Pattern**
- Card layout for quiz questions and results
- F-pattern for dashboard analytics
- Single-column for quiz interface (focus)
- Grid layout for quiz history

### Motion Style: **Micro-interactions**
- Hover states on all interactive elements
- Entrance animations for feedback
- Progress animations for loading states
- Celebration animations for achievements

---

## 🎯 FINAL CHECKLIST

Before implementation, ensure:

- [ ] All color combinations meet WCAG AA contrast (4.5:1 for text)
- [ ] Gradients used only in hero (<15% viewport) and celebration screens
- [ ] All interactive elements have data-testid attributes
- [ ] All images have descriptive alt text
- [ ] All icons have aria-labels
- [ ] Keyboard navigation works for all interactions
- [ ] Focus states visible on all interactive elements
- [ ] Touch targets minimum 44x44px
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] Voice AND text options available for all quiz interactions
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages
- [ ] Reduced motion preferences respected
- [ ] All components use existing design tokens
- [ ] No universal transitions (`transition: all`)
- [ ] No center-aligned app container
- [ ] FontAwesome icons instead of emojis

---

## 📚 REFERENCE LINKS

- **Design Inspiration**: Duolingo, Quizlet, Kahoot, Brilliant
- **Color Contrast**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Accessibility**: [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **Icons**: [FontAwesome](https://fontawesome.com/icons)
- **Charts**: [Recharts Documentation](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Typography**: [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)

---

## 🚀 IMPLEMENTATION NOTES

1. **Start with Core Components**: Build QuizInterface, QuizQuestion, QuizAnswerOptions first
2. **Test Voice Integration Early**: Ensure Cartesia voice cloning works with quiz
3. **Iterate on Feedback**: Test immediate feedback with real users
4. **Optimize Performance**: Lazy load quiz components, optimize images
5. **Monitor Analytics**: Track quiz completion rates, average scores, time spent
6. **Gather User Feedback**: Iterate based on user testing and feedback

---

**Design Guidelines Version**: 1.0  
**Last Updated**: 2024  
**Platform**: EduVoice AI Education Platform  
**Tech Stack**: FastAPI (Python) + React + MongoDB  
**Design System**: Apple-inspired Minimalism + Glassmorphism + Gamification

---

## 🎨 GENERAL UI/UX DESIGN GUIDELINES

### Critical Rules

#### Transition Restrictions
- **NEVER** apply universal transitions (e.g., `transition: all`)
- This breaks transforms and causes performance issues
- **ALWAYS** add transitions for specific properties only:
  ```css
  /* ✅ CORRECT */
  .element {
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  
  /* ❌ WRONG */
  .element {
    transition: all 0.3s ease;
  }
  ```
- Apply transitions only to interactive elements (buttons, inputs)
- Exclude transforms from universal transitions

#### Text Alignment
- **NEVER** center-align the app container
- **DO NOT** add `.App { text-align: center; }` in CSS files
- This disrupts natural reading flow
- Center-align specific elements only when needed (headings, CTAs)

#### Icon Usage
- **NEVER** use AI assistant emoji characters (🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇)
- **ALWAYS** use FontAwesome CDN or lucide-react library (already installed)
- Use semantic icon names that match functionality

### Gradient Restrictions (CRITICAL)

#### Prohibited Gradients
- **NEVER** use dark/saturated gradient combinations:
  - blue-500 to purple-600
  - purple-500 to pink-500
  - green-500 to blue-500
  - red to pink
  - Any dark gradient on logo, testimonials, footer

#### Gradient Usage Limits
- **NEVER** let gradients cover more than 20% of viewport
- **NEVER** apply gradients to text-heavy content or reading areas
- **NEVER** use gradients on small UI elements (<100px width)
- **NEVER** stack multiple gradient layers in same viewport

#### Enforcement Rule
**IF** gradient area exceeds 20% of viewport **OR** affects readability  
**THEN** use solid colors

#### Allowed Gradient Usage
- Section backgrounds (not content backgrounds)
- Hero section header content (dark to light to dark)
- Decorative overlays and accent elements only
- Hero sections with 2-3 mild colors
- Gradients can be horizontal, vertical, or diagonal

#### AI/Voice Application Colors
- **DO NOT** use purple color for AI chat or voice applications
- **USE** colors like light green, ocean blue, peach orange instead

### Micro-Interactions & Animation

- Every interaction needs micro-animations
- Include hover states, transitions, parallax effects, entrance animations
- Static designs feel lifeless
- Use 2-3x more spacing than feels comfortable
- Cramped designs look cheap

### Visual Polish

- Add subtle grain textures and noise overlays
- Implement custom cursors where appropriate
- Style selection states
- Create engaging loading animations
- These details separate good from extraordinary

### Color & Mood

- Before generating UI, infer visual style from problem statement
- Set global design tokens immediately (primary, secondary, background, foreground)
- Don't default to dark backgrounds - understand context first
- Examples:
  - Playful/energetic → colorful scheme
  - Monochrome/minimal → black-white/neutral scheme

### Component Strategy

#### Component Reuse
- Prioritize pre-existing components from `src/components/ui`
- Create new components matching existing style and conventions
- Examine existing components before creating new ones

#### Component Library
- **DO NOT** use HTML-based components (dropdown, calendar, toast)
- **MUST** always use `/app/frontend/src/components/ui/` as primary components
- These are modern, stylish, and consistent

#### Best Practices
- Use Shadcn/UI as primary component library
- Import path: `./components/[component-name]`

#### Export Conventions
- Components: Use named exports (`export const ComponentName = ...`)
- Pages: Use default exports (`export default function PageName() {...}`)

#### Toasts
- Use `sonner` for toasts
- Sonner component located in `/app/src/components/ui/sonner.tsx`

### Visual Depth

- Use 2-4 color gradients (where allowed)
- Add subtle textures/noise overlays
- Use CSS-based noise to avoid flat visuals
- Maintain depth without overwhelming users

### Design Quality Standards

The result should feel:
- **Human-made**: Not generic or AI-generated
- **Visually appealing**: Good contrast, balanced fonts
- **Converting**: Drives user action
- **Easy to implement**: Clear for AI agents to build
- **Polished**: Proper gradients, whitespace, motion, hierarchy

Avoid:
- Overuse of elements
- Generic centered layouts
- Simplistic gradients
- Uniform styling

### Responsive Design

- Design must be mobile-first responsive
- Test on multiple screen sizes
- Ensure touch targets are adequate (44x44px minimum)

### Color Theory

- Dark colors look good independently without gradients
- Light colors (pastel ocean green, light pink, blue, gray) work well with gradients
- Muted colors with gradients create harmony
- Don't make generic centered layouts with simplistic gradients

### Calendar Components

- If calendar is required, always use Shadcn calendar
- Specify in guidelines to use Shadcn calendar component

---

**Remember**: These guidelines ensure consistency, accessibility, and a polished user experience across the entire EduVoice platform. Follow them strictly during implementation.
