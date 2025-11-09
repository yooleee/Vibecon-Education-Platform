"""
Authentication middleware
"""
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import verify_access_token
from models.user import load_user_by_google_id
from typing import Optional

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Authorization credentials
    
    Returns:
        User data dictionary
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Verify JWT token
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    google_id = payload.get("google_id")
    if not google_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Load user from storage
    user = load_user_by_google_id(google_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Security(security, auto_error=False)) -> Optional[dict]:
    """
    Get current user if authenticated, None otherwise
    
    Args:
        credentials: HTTP Authorization credentials (optional)
    
    Returns:
        User data dictionary or None if not authenticated
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_access_token(token)
        if not payload:
            return None
        
        google_id = payload.get("google_id")
        if not google_id:
            return None
        
        user = load_user_by_google_id(google_id)
        return user
    except:
        return None
