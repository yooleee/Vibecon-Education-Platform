#!/usr/bin/env python3
"""
Test script to measure processing speed improvements
"""
import asyncio
import time
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, '/app/backend')

from services.audio_analysis_service import extract_best_voice_clip
from services.transcription_service import transcribe_audio
from services.voice_service import clone_voice_from_audio
from services.embedding_service import generate_embeddings
from utils.chunking import chunk_text


async def test_sequential_processing(audio_path):
    """Test the OLD sequential approach"""
    print("\n" + "="*60)
    print("Testing SEQUENTIAL Processing (OLD METHOD)")
    print("="*60)
    
    timings = {}
    
    # Step 1: Audio Analysis
    print("\n1️⃣ Audio Analysis...")
    start = time.time()
    voice_clip_path, clip_quality = extract_best_voice_clip(
        audio_path, 
        clip_duration=8.0,
        num_candidates=10  # OLD: 10 candidates
    )
    timings['audio_analysis'] = time.time() - start
    print(f"   ✓ Completed in {timings['audio_analysis']:.2f}s")
    
    # Step 2: Voice Cloning (sequential)
    print("\n2️⃣ Voice Cloning...")
    start = time.time()
    cloned_voice_id = await clone_voice_from_audio(
        voice_clip_path,
        voice_name="Test Professor"
    )
    timings['voice_cloning'] = time.time() - start
    print(f"   ✓ Completed in {timings['voice_cloning']:.2f}s")
    
    # Step 3: Transcription (sequential)
    print("\n3️⃣ Transcription...")
    start = time.time()
    transcript = await transcribe_audio(audio_path)
    timings['transcription'] = time.time() - start
    print(f"   ✓ Completed in {timings['transcription']:.2f}s")
    
    # Step 4: Chunking
    print("\n4️⃣ Chunking...")
    start = time.time()
    chunks = chunk_text(transcript)
    timings['chunking'] = time.time() - start
    print(f"   ✓ Completed in {timings['chunking']:.2f}s")
    
    # Step 5: Embeddings
    print("\n5️⃣ Embeddings...")
    start = time.time()
    embeddings = await generate_embeddings(chunks)
    timings['embeddings'] = time.time() - start
    print(f"   ✓ Completed in {timings['embeddings']:.2f}s")
    
    total_time = sum(timings.values())
    
    print("\n" + "-"*60)
    print("SEQUENTIAL TIMINGS:")
    for step, duration in timings.items():
        print(f"  {step:20s}: {duration:6.2f}s ({duration/total_time*100:5.1f}%)")
    print("-"*60)
    print(f"  {'TOTAL':20s}: {total_time:6.2f}s")
    print("="*60)
    
    return timings, total_time


async def test_parallel_processing(audio_path):
    """Test the NEW parallel approach"""
    print("\n" + "="*60)
    print("Testing PARALLEL Processing (NEW METHOD)")
    print("="*60)
    
    timings = {}
    
    # Step 1: Audio Analysis (optimized)
    print("\n1️⃣ Audio Analysis (Optimized)...")
    start = time.time()
    voice_clip_path, clip_quality = extract_best_voice_clip(
        audio_path, 
        clip_duration=8.0,
        num_candidates=5  # NEW: 5 candidates
    )
    timings['audio_analysis'] = time.time() - start
    print(f"   ✓ Completed in {timings['audio_analysis']:.2f}s")
    
    # Step 2 & 3: Voice Cloning + Transcription (PARALLEL)
    print("\n2️⃣+3️⃣ Voice Cloning + Transcription (PARALLEL)...")
    start = time.time()
    
    # Run both concurrently
    cloned_voice_id, transcript = await asyncio.gather(
        clone_voice_from_audio(
            voice_clip_path,
            voice_name="Test Professor Parallel"
        ),
        transcribe_audio(audio_path)
    )
    
    parallel_time = time.time() - start
    timings['parallel_processing'] = parallel_time
    print(f"   ✓ Completed in {parallel_time:.2f}s")
    
    # Step 4: Chunking
    print("\n4️⃣ Chunking...")
    start = time.time()
    chunks = chunk_text(transcript)
    timings['chunking'] = time.time() - start
    print(f"   ✓ Completed in {timings['chunking']:.2f}s")
    
    # Step 5: Embeddings
    print("\n5️⃣ Embeddings...")
    start = time.time()
    embeddings = await generate_embeddings(chunks)
    timings['embeddings'] = time.time() - start
    print(f"   ✓ Completed in {timings['embeddings']:.2f}s")
    
    total_time = sum(timings.values())
    
    print("\n" + "-"*60)
    print("PARALLEL TIMINGS:")
    for step, duration in timings.items():
        print(f"  {step:20s}: {duration:6.2f}s ({duration/total_time*100:5.1f}%)")
    print("-"*60)
    print(f"  {'TOTAL':20s}: {total_time:6.2f}s")
    print("="*60)
    
    return timings, total_time


async def main():
    # Check if we have a test audio file
    test_files = []
    
    # Look for existing audio files
    upload_dir = "/app/data/uploads"
    if os.path.exists(upload_dir):
        for file in os.listdir(upload_dir):
            if file.endswith('.wav') and not 'voice_clip' in file and not 'question' in file:
                test_files.append(os.path.join(upload_dir, file))
    
    if not test_files:
        print("❌ No test audio files found in /app/data/uploads/")
        print("Please upload a lecture first to generate test data.")
        return
    
    # Use the first audio file found
    test_audio = test_files[0]
    print(f"\n📁 Using test audio: {os.path.basename(test_audio)}")
    print(f"📊 File size: {os.path.getsize(test_audio) / (1024*1024):.2f} MB")
    
    # Test sequential processing
    seq_timings, seq_total = await test_sequential_processing(test_audio)
    
    # Wait a bit between tests
    await asyncio.sleep(2)
    
    # Test parallel processing
    par_timings, par_total = await test_parallel_processing(test_audio)
    
    # Calculate improvements
    print("\n" + "="*60)
    print("📊 PERFORMANCE COMPARISON")
    print("="*60)
    
    print(f"\nSequential Total: {seq_total:.2f}s")
    print(f"Parallel Total:   {par_total:.2f}s")
    print(f"\nTime Saved:       {seq_total - par_total:.2f}s")
    print(f"Speed Improvement: {((seq_total - par_total) / seq_total * 100):.1f}%")
    
    print("\n" + "-"*60)
    print("Stage-by-Stage Comparison:")
    print("-"*60)
    
    # Compare audio analysis
    seq_analysis = seq_timings['audio_analysis']
    par_analysis = par_timings['audio_analysis']
    print(f"Audio Analysis:   {seq_analysis:.2f}s → {par_analysis:.2f}s (saved {seq_analysis-par_analysis:.2f}s)")
    
    # Compare parallel section
    seq_parallel = seq_timings['voice_cloning'] + seq_timings['transcription']
    par_parallel = par_timings['parallel_processing']
    print(f"Voice+Transcribe: {seq_parallel:.2f}s → {par_parallel:.2f}s (saved {seq_parallel-par_parallel:.2f}s)")
    
    print("\n" + "="*60)
    print("✅ Test Complete!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
