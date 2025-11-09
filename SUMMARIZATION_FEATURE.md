# Lecture Summarization Feature

## Overview
The lecture summarization feature generates AI-powered summaries of uploaded lectures and provides audio playback in the professor's cloned voice.

## How It Works

### Backend (`/api/lectures/{lecture_id}/summary`)
1. **Summary Generation**: Uses GPT-4o to create a concise, structured summary
2. **Audio Synthesis**: Converts summary to speech using Cartesia with the cloned professor voice
3. **Caching**: Saves generated summaries to avoid regeneration

### Frontend (LectureViewer Component)
1. **Generate Button**: Click to generate summary
2. **Text Display**: Shows the AI-generated summary
3. **Audio Player**: Listen to the summary in the professor's voice
4. **Loading States**: Visual feedback during generation

## API Details

### Endpoint
```
POST /api/lectures/{lecture_id}/summary
```

### Response
```json
{
  "summary": "Full summary text...",
  "audio_url": "/api/audio/voice_xxx.mp3",
  "word_count": 315,
  "detail_level": "moderate",
  "cached": false
}
```

### Summary Length (Adaptive)
- Short lectures (<1000 chars): ~150 words (brief)
- Medium lectures (1000-5000 chars): ~300 words (moderate)
- Long lectures (>5000 chars): ~500 words (comprehensive)

## Features

✅ **AI-Powered**: Uses GPT-4o for intelligent summarization
✅ **Voice Cloning**: Audio in the professor's cloned voice
✅ **Caching**: Summaries are cached for instant retrieval
✅ **Adaptive Length**: Summary length adapts to lecture length
✅ **Structured Output**: Well-organized summaries with key points
✅ **Audio Controls**: Full audio player with play/pause/seek

## Performance

### First Generation (Uncached)
- Summary generation: ~5-10 seconds
- Audio synthesis: ~30-60 seconds (depends on length)
- **Total**: ~35-70 seconds

### Subsequent Requests (Cached)
- **Total**: <1 second (instant retrieval)

## User Experience

### Before Summary
```
┌─────────────────────────────────────┐
│ Lecture Summary                     │
│ [Generate Summary Button]           │
└─────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────┐
│ Lecture Summary                     │
│ ⏳ Generating summary with AI...    │
└─────────────────────────────────────┘
```

### After Generation
```
┌─────────────────────────────────────┐
│ Lecture Summary                     │
├─────────────────────────────────────┤
│ [Summary text displayed here]       │
│                                     │
│ 315 words • Cached                  │
│ [──────◉──────] Audio Player        │
│ 🔊 Listen in professor's voice      │
└─────────────────────────────────────┘
```

## Example Output

### Summary Text
```
**Summary of "Python in 100 Seconds" Lecture**

**Introduction to Python:**
Python is a high-level, interpreted programming language renowned 
for its readability and simplicity...

**Applications and Popularity:**
Python is widely used for building server-side applications...

**Key Takeaways:**
1. Python emphasizes code readability
2. Extensive library ecosystem
3. Cross-platform compatibility
```

## Storage

Summaries are stored in the lecture JSON file:
```json
{
  "id": "lecture-id",
  "filename": "lecture.mp4",
  "transcript": "...",
  "summary": {
    "text": "Summary text...",
    "audio_url": "/api/audio/voice_xxx.mp3",
    "audio_path": "/app/data/uploads/voice_xxx.mp3",
    "word_count": 315,
    "detail_level": "moderate",
    "generated_at": "2025-11-09T10:00:00"
  }
}
```

## Testing

### Manual Test
1. Upload a lecture video
2. Navigate to lecture viewer
3. Click "Generate Summary"
4. Wait for generation (~30-60s)
5. Read the text summary
6. Play the audio
7. Refresh page and verify instant loading (cached)

### API Test
```bash
# Generate summary
curl -X POST http://localhost:8001/api/lectures/{lecture_id}/summary

# Check cached summary (instant)
curl -X POST http://localhost:8001/api/lectures/{lecture_id}/summary
```

## Future Enhancements

- [ ] Add summary regeneration button
- [ ] Support multiple summary lengths (brief/detailed)
- [ ] Download summary as PDF
- [ ] Share summary via link
- [ ] Summary translation to other languages
- [ ] Highlight key terms/concepts
- [ ] Quiz generation from summary

## Technical Notes

### Dependencies
- OpenAI GPT-4o for summary generation
- Cartesia for TTS with cloned voice
- Existing voice cloning infrastructure

### Error Handling
- Missing lecture: 404 error
- API failures: Graceful error messages
- Retry logic for temporary failures

### Caching Strategy
- First request: Generate and cache
- Subsequent requests: Instant retrieval
- Cache invalidation: Manual only (no auto-regeneration)
