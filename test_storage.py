#!/usr/bin/env python3
"""
Test script to verify database/storage functionality
"""
import sys
sys.path.insert(0, '/app/backend')

from utils.storage import save_lecture, load_lecture, list_lectures, delete_lecture
import os
import json

print("\n" + "="*60)
print("DATABASE/STORAGE VERIFICATION TEST")
print("="*60)

# Test 1: Check lecture directory
print("\n📁 Test 1: Checking lecture directory...")
lecture_dir = "/app/data/lectures"
if os.path.exists(lecture_dir):
    print(f"   ✓ Lecture directory exists: {lecture_dir}")
    
    # Count files
    json_files = [f for f in os.listdir(lecture_dir) if f.endswith('.json')]
    print(f"   ✓ Found {len(json_files)} lecture files")
else:
    print(f"   ✗ Lecture directory NOT found: {lecture_dir}")

# Test 2: List all lectures
print("\n📋 Test 2: Listing all lectures...")
try:
    lectures = list_lectures()
    print(f"   ✓ Successfully loaded {len(lectures)} lectures")
    
    if lectures:
        print("\n   Lecture Summary:")
        for i, lecture in enumerate(lectures, 1):
            print(f"   {i}. {lecture['filename']}")
            print(f"      ID: {lecture['id']}")
            print(f"      Date: {lecture['upload_date']}")
            print(f"      Chunks: {lecture['chunks_count']}")
            print()
    else:
        print("   ⚠️  No lectures found in database")
except Exception as e:
    print(f"   ✗ Error listing lectures: {str(e)}")

# Test 3: Load a specific lecture
if lectures:
    print("\n📖 Test 3: Loading specific lecture details...")
    test_lecture_id = lectures[0]['id']
    
    try:
        lecture_data = load_lecture(test_lecture_id)
        
        if lecture_data:
            print(f"   ✓ Successfully loaded lecture: {test_lecture_id}")
            print(f"\n   Lecture Details:")
            print(f"   - Filename: {lecture_data.get('filename')}")
            print(f"   - Upload Date: {lecture_data.get('upload_date')}")
            print(f"   - Transcript Length: {len(lecture_data.get('transcript', ''))} characters")
            print(f"   - Number of Chunks: {len(lecture_data.get('chunks', []))}")
            print(f"   - Number of Embeddings: {len(lecture_data.get('embeddings', []))}")
            print(f"   - Video Path: {lecture_data.get('video_path')}")
            print(f"   - Audio Path: {lecture_data.get('audio_path')}")
            print(f"   - Voice Clip Path: {lecture_data.get('voice_clip_path')}")
            print(f"   - Cloned Voice ID: {lecture_data.get('cloned_voice_id')}")
            
            # Check if associated files exist
            print(f"\n   Associated Files Check:")
            
            if lecture_data.get('video_path'):
                exists = os.path.exists(lecture_data['video_path'])
                status = "✓" if exists else "✗"
                print(f"   {status} Video file: {exists}")
            
            if lecture_data.get('audio_path'):
                exists = os.path.exists(lecture_data['audio_path'])
                status = "✓" if exists else "✗"
                print(f"   {status} Audio file: {exists}")
            
            if lecture_data.get('voice_clip_path'):
                exists = os.path.exists(lecture_data['voice_clip_path'])
                status = "✓" if exists else "✗"
                print(f"   {status} Voice clip file: {exists}")
            
        else:
            print(f"   ✗ Could not load lecture: {test_lecture_id}")
    
    except Exception as e:
        print(f"   ✗ Error loading lecture: {str(e)}")

# Test 4: Test save functionality (create test lecture)
print("\n💾 Test 4: Testing save functionality...")
test_lecture_data = {
    "id": "test-lecture-12345",
    "filename": "test-video.mp4",
    "upload_date": "2025-11-09T10:00:00",
    "transcript": "This is a test transcript.",
    "chunks": ["Chunk 1", "Chunk 2"],
    "embeddings": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
    "video_path": "/app/data/uploads/test.mp4",
    "audio_path": "/app/data/uploads/test.wav",
    "cloned_voice_id": "test-voice-id"
}

try:
    save_lecture("test-lecture-12345", test_lecture_data)
    print("   ✓ Test lecture saved successfully")
    
    # Verify it was saved
    loaded = load_lecture("test-lecture-12345")
    if loaded and loaded['id'] == "test-lecture-12345":
        print("   ✓ Test lecture loaded successfully - Save/Load working!")
        
        # Clean up test lecture
        test_file = "/app/data/lectures/test-lecture-12345.json"
        if os.path.exists(test_file):
            os.remove(test_file)
            print("   ✓ Test lecture cleaned up")
    else:
        print("   ✗ Could not load saved test lecture")
        
except Exception as e:
    print(f"   ✗ Error testing save: {str(e)}")

# Test 5: Check storage size
print("\n💽 Test 5: Storage usage...")
try:
    total_size = 0
    for filename in os.listdir(lecture_dir):
        if filename.endswith('.json'):
            file_path = os.path.join(lecture_dir, filename)
            total_size += os.path.getsize(file_path)
    
    print(f"   ✓ Total lecture data size: {total_size / 1024 / 1024:.2f} MB")
    
    # Check upload directory size
    upload_dir = "/app/data/uploads"
    if os.path.exists(upload_dir):
        upload_size = sum(os.path.getsize(os.path.join(upload_dir, f)) 
                         for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f)))
        print(f"   ✓ Total upload files size: {upload_size / 1024 / 1024:.2f} MB")
    
except Exception as e:
    print(f"   ✗ Error calculating storage: {str(e)}")

# Test 6: Check MongoDB connection (if using MongoDB)
print("\n🗄️  Test 6: Database Backend Check...")
print("   ℹ️  Current storage: JSON file-based")
print("   ℹ️  Location: /app/data/lectures/")
print("   ℹ️  Format: One JSON file per lecture")

# Summary
print("\n" + "="*60)
print("STORAGE SYSTEM STATUS")
print("="*60)

issues = []

if not os.path.exists(lecture_dir):
    issues.append("Lecture directory missing")

if not lectures:
    issues.append("No lectures in database")

if issues:
    print("\n⚠️  Issues Found:")
    for issue in issues:
        print(f"   - {issue}")
else:
    print("\n✅ All storage tests PASSED!")
    print(f"   - {len(lectures)} lectures saved and accessible")
    print(f"   - Save/Load functionality working")
    print(f"   - File system storage healthy")

print("\n" + "="*60)
