import librosa
import numpy as np
import soundfile as sf
from typing import List, Tuple, Dict
import os


def analyze_audio_quality(audio_path: str, start_time: float, duration: float) -> Dict[str, float]:
    """
    Analyze the quality of an audio segment
    
    Returns quality metrics:
    - snr: Signal-to-noise ratio (higher is better)
    - rms_energy: Root mean square energy (speech presence)
    - zero_crossing_rate: Voice activity indicator
    - spectral_centroid: Voice clarity
    - silence_ratio: Percentage of silence (lower is better)
    """
    try:
        # Load the audio segment
        y, sr = librosa.load(audio_path, sr=16000, offset=start_time, duration=duration)
        
        # 1. RMS Energy (speech presence)
        rms = librosa.feature.rms(y=y)[0]
        rms_energy = np.mean(rms)
        
        # 2. Zero Crossing Rate (voice activity)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        zcr_mean = np.mean(zcr)
        
        # 3. Spectral Centroid (voice clarity - human voice is around 2-4kHz)
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_centroid_mean = np.mean(spectral_centroids)
        
        # 4. Silence ratio (detect pauses)
        frame_length = 2048
        hop_length = 512
        silence_threshold = 0.01
        
        frames = librosa.util.frame(y, frame_length=frame_length, hop_length=hop_length)
        frame_energies = np.sum(frames ** 2, axis=0)
        silence_frames = np.sum(frame_energies < silence_threshold)
        silence_ratio = silence_frames / len(frame_energies)
        
        # 5. Estimate SNR (signal to noise ratio)
        # Use the bottom 10% energy frames as "noise"
        sorted_energies = np.sort(frame_energies)
        noise_level = np.mean(sorted_energies[:int(len(sorted_energies) * 0.1)])
        signal_level = np.mean(sorted_energies[int(len(sorted_energies) * 0.5):])
        snr = 10 * np.log10(signal_level / (noise_level + 1e-10))
        
        # 6. Voice consistency (low variance in RMS is better)
        rms_variance = np.var(rms)
        consistency_score = 1.0 / (1.0 + rms_variance)
        
        return {
            "snr": float(snr),
            "rms_energy": float(rms_energy),
            "zero_crossing_rate": float(zcr_mean),
            "spectral_centroid": float(spectral_centroid_mean),
            "silence_ratio": float(silence_ratio),
            "consistency_score": float(consistency_score)
        }
    
    except Exception as e:
        print(f"Error analyzing audio segment: {e}")
        return {
            "snr": 0.0,
            "rms_energy": 0.0,
            "zero_crossing_rate": 0.0,
            "spectral_centroid": 0.0,
            "silence_ratio": 1.0,
            "consistency_score": 0.0
        }


def calculate_quality_score(metrics: Dict[str, float]) -> float:
    """
    Calculate overall quality score from metrics
    Higher score = better quality for voice cloning
    """
    # Weights for different metrics
    score = (
        metrics["snr"] * 2.0 +  # SNR is very important
        metrics["rms_energy"] * 50.0 +  # Good energy level
        (1.0 - metrics["silence_ratio"]) * 30.0 +  # Less silence is better
        metrics["consistency_score"] * 20.0 +  # Consistent voice
        (1.0 / (abs(metrics["spectral_centroid"] - 3000) + 1000)) * 10.0  # Close to human voice range
    )
    return score


def extract_best_voice_clip(audio_path: str, clip_duration: float = 8.0, 
                           num_candidates: int = 5) -> Tuple[str, Dict]:
    """
    Extract the best quality voice clip from an audio file
    
    Args:
        audio_path: Path to the audio file
        clip_duration: Duration of clip to extract (5-10 seconds)
        num_candidates: Number of candidate clips to analyze
    
    Returns:
        Tuple of (clip_path, quality_metrics)
    """
    try:
        # Get total duration
        y, sr = librosa.load(audio_path, sr=16000, duration=60)  # Load first 60s to get info
        duration_info = librosa.get_duration(path=audio_path)
        
        print(f"Analyzing audio file: {duration_info:.2f} seconds total")
        
        # Skip first 10 seconds (often intro music/silence) and last 10 seconds
        start_offset = 10.0
        end_offset = duration_info - 10.0
        
        if end_offset - start_offset < clip_duration:
            # Audio too short, use the whole thing
            start_offset = 0
            end_offset = duration_info
        
        # Generate candidate start times
        available_duration = end_offset - start_offset - clip_duration
        if available_duration <= 0:
            candidate_times = [0]
        else:
            # Evenly distribute candidates across the audio
            step = available_duration / (num_candidates - 1) if num_candidates > 1 else 0
            candidate_times = [start_offset + i * step for i in range(num_candidates)]
        
        print(f"Analyzing {len(candidate_times)} candidate clips...")
        
        # Analyze each candidate
        candidates = []
        for start_time in candidate_times:
            metrics = analyze_audio_quality(audio_path, start_time, clip_duration)
            quality_score = calculate_quality_score(metrics)
            
            candidates.append({
                "start_time": start_time,
                "metrics": metrics,
                "quality_score": quality_score
            })
            
            print(f"  Clip at {start_time:.1f}s - Quality: {quality_score:.2f}, SNR: {metrics['snr']:.2f}dB")
        
        # Sort by quality score and pick the best
        candidates.sort(key=lambda x: x["quality_score"], reverse=True)
        best_candidate = candidates[0]
        
        print(f"\n✓ Best clip found at {best_candidate['start_time']:.1f}s with score {best_candidate['quality_score']:.2f}")
        
        # Extract the best clip
        y_clip, sr = librosa.load(
            audio_path, 
            sr=16000, 
            offset=best_candidate["start_time"], 
            duration=clip_duration
        )
        
        # Save the clip
        clip_filename = os.path.basename(audio_path).replace('.wav', '_voice_clip.wav')
        clip_path = os.path.join(os.path.dirname(audio_path), clip_filename)
        sf.write(clip_path, y_clip, sr)
        
        return clip_path, best_candidate
    
    except Exception as e:
        raise Exception(f"Failed to extract voice clip: {str(e)}")
