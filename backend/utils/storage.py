import os
import json
from typing import Dict, List, Optional

LECTURE_DIR = "/app/data/lectures"


def save_lecture(lecture_id: str, lecture_data: Dict) -> None:
    """
    Save lecture data to JSON file
    
    Args:
        lecture_id: Unique lecture identifier
        lecture_data: Dictionary containing lecture information
    """
    os.makedirs(LECTURE_DIR, exist_ok=True)
    
    file_path = os.path.join(LECTURE_DIR, f"{lecture_id}.json")
    
    with open(file_path, 'w') as f:
        json.dump(lecture_data, f, indent=2)


def load_lecture(lecture_id: str) -> Optional[Dict]:
    """
    Load lecture data from JSON file
    
    Args:
        lecture_id: Unique lecture identifier
    
    Returns:
        Lecture data dictionary or None if not found
    """
    file_path = os.path.join(LECTURE_DIR, f"{lecture_id}.json")
    
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, 'r') as f:
        return json.load(f)


def list_lectures() -> List[Dict]:
    """
    List all lectures with basic information
    
    Returns:
        List of lecture summaries
    """
    lectures = []
    
    if not os.path.exists(LECTURE_DIR):
        return lectures
    
    for filename in os.listdir(LECTURE_DIR):
        if filename.endswith('.json'):
            lecture_id = filename[:-5]  # Remove .json extension
            lecture = load_lecture(lecture_id)
            
            if lecture:
                # Return only summary info (not full transcript/embeddings)
                lectures.append({
                    "id": lecture["id"],
                    "filename": lecture["filename"],
                    "upload_date": lecture["upload_date"],
                    "chunks_count": len(lecture.get("chunks", []))
                })
    
    # Sort by upload date (newest first)
    lectures.sort(key=lambda x: x["upload_date"], reverse=True)
    
    return lectures


def delete_lecture(lecture_id: str) -> bool:
    """
    Delete lecture and all associated files
    
    Args:
        lecture_id: Unique lecture identifier
    
    Returns:
        True if deletion was successful, False otherwise
    """
    try:
        # Load lecture to get file paths
        lecture = load_lecture(lecture_id)
        
        if not lecture:
            return False
        
        # Delete associated files
        files_to_delete = [
            lecture.get("video_path"),
            lecture.get("audio_path"),
            lecture.get("voice_clip_path")
        ]
        
        for file_path in files_to_delete:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        
        # Delete lecture JSON file
        json_file = os.path.join(LECTURE_DIR, f"{lecture_id}.json")
        if os.path.exists(json_file):
            os.remove(json_file)
        
        return True
    
    except Exception as e:
        print(f"Error deleting lecture {lecture_id}: {str(e)}")
        return False
