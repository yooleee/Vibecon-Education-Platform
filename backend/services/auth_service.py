"""
Authentication service - Google OAuth and JWT
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
import requests
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


def verify_google_token(access_token: str) -> Optional[Dict]:
    """
    Verify Google OAuth access token and return user info
    
    Args:
        access_token: Google access token from frontend
    
    Returns:
        User info dictionary or None if invalid
    """
    try:
        # Use Google's userinfo endpoint to get user data
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if response.status_code != 200:
            print(f"Google API error: {response.status_code}")
            return None
        
        user_info = response.json()
        
        # Return standardized user info
        return {
            'google_id': user_info['sub'],
            'email': user_info['email'],
            'name': user_info.get('name', ''),
            'picture': user_info.get('picture', '')
        }
    
    except Exception as e:
        print(f"Error verifying Google token: {str(e)}")
        return None


def create_access_token(data: dict) -> str:
    """
    Create JWT access token
    
    Args:
        data: Data to encode in token (should include google_id)
    
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> Optional[Dict]:
    """
    Verify JWT access token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
