"""
Authentication and JWT Token Utilities for ExamForge AI.
Handles password hashing, token encoding/decoding, and Flask route decorators.
"""

import os
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from database.db import SessionLocal
from database.models import User

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', Config.SECRET_KEY)
JWT_ALGORITHM = 'HS256'
TOKEN_EXPIRATION_HOURS = 24


def hash_password(password: str) -> str:
    """Hash password using Werkzeug's default pbkdf2:sha256."""
    return generate_password_hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify raw password against stored hash."""
    return check_password_hash(hashed_password, password)


def create_access_token(user: User) -> str:
    """Generate signed JWT token containing user identity and expiration."""
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str):
    """Decode and validate JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def auth_required(f):
    """
    Decorator to enforce authentication on protected endpoints.
    Accepts token via Authorization header: Bearer <token>.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required. Missing or invalid Bearer token.'}), 401
        
        token = auth_header.split(' ', 1)[1].strip()
        payload = decode_access_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired. Please log in again.'}), 401
        
        db = SessionLocal()
        try:
            user = db.query(User).filter_by(id=payload['sub']).first()
            if not user or not user.is_active:
                return jsonify({'error': 'User account inactive or not found.'}), 401
            g.current_user = user
        finally:
            db.close()
            
        return f(*args, **kwargs)
    return decorated
