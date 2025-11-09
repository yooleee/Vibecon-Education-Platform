"""
User model and storage
"""
import os
import json
from typing import Optional, Dict
from datetime import datetime

USER_DIR = "/app/data/users"
os.makedirs(USER_DIR, exist_ok=True)


def save_user(user_data: Dict) -> None:
    """
    Save user data to JSON file
    
    Args:
        user_data: Dictionary containing user information
    """
    file_path = os.path.join(USER_DIR, f"{user_data['google_id']}.json")
    
    with open(file_path, 'w') as f:
        json.dump(user_data, f, indent=2)


def load_user_by_google_id(google_id: str) -> Optional[Dict]:
    """
    Load user data by Google ID
    
    Args:
        google_id: Google user ID
    
    Returns:
        User data dictionary or None if not found
    """
    file_path = os.path.join(USER_DIR, f"{google_id}.json")
    
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, 'r') as f:
        return json.load(f)


def create_or_update_user(google_id: str, email: str, name: str, picture: str) -> Dict:
    """
    Create new user or update existing user
    
    Args:
        google_id: Google user ID
        email: User email
        name: User name
        picture: Profile picture URL
    
    Returns:
        User data dictionary
    """
    existing_user = load_user_by_google_id(google_id)
    
    if existing_user:
        # Update last login
        existing_user['last_login'] = datetime.now().isoformat()
        existing_user['email'] = email
        existing_user['name'] = name
        existing_user['picture'] = picture
        save_user(existing_user)
        return existing_user
    else:
        # Create new user
        user_data = {
            'google_id': google_id,
            'email': email,
            'name': name,
            'picture': picture,
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat()
        }
        save_user(user_data)
        return user_data
