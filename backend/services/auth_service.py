"""
Authentication service - Google OAuth and JWT
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from google.auth.transport import requests
from google.oauth2 import id_token
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


def verify_google_token(token: str) -> Optional[Dict]:
    """
    Verify Google OAuth token and return user info
    
    Args:
        token: Google ID token from frontend
    
    Returns:
        User info dictionary or None if invalid
    """
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Token is valid, return user info
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', '')
        }
    
    except ValueError as e:
        # Invalid token
        print(f"Invalid Google token: {str(e)}")
        return None
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
