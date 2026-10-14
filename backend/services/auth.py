"""
Authentication and Role-Based Access Control (RBAC) Utilities for ExamForge AI.
Handles password hashing, token encoding/decoding, role verification, and audit logging.
"""

import os
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from database.db import SessionLocal
from database.models import User, AuditLog

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
    """Generate signed JWT token containing user identity, email, role, and expiration."""
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
            user = db.query(User).filter_by(id=int(payload['sub'])).first()
            if not user or not user.is_active:
                return jsonify({'error': 'User account inactive or not found.'}), 401
            g.current_user = user
        finally:
            db.close()
            
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """
    Decorator to enforce Administrator privileges.
    Guarantees that teachers cannot access administrative endpoints.
    Returns HTTP 403 Forbidden with descriptive error if non-admin attempts access.
    """
    @wraps(f)
    @auth_required
    def decorated(*args, **kwargs):
        current_user = getattr(g, 'current_user', None)
        if not current_user or current_user.role != 'admin':
            return jsonify({
                'error': 'Access forbidden. Administrator privileges are required to perform this action.',
                'role': current_user.role if current_user else 'anonymous'
            }), 403
        return f(*args, **kwargs)
    return decorated


def teacher_required(f):
    """
    Decorator to ensure user is an active teacher or administrator.
    """
    @wraps(f)
    @auth_required
    def decorated(*args, **kwargs):
        current_user = getattr(g, 'current_user', None)
        if not current_user or current_user.role not in ['teacher', 'admin']:
            return jsonify({
                'error': 'Access forbidden. Active teaching or administrative credentials required.'
            }), 403
        return f(*args, **kwargs)
    return decorated


def log_audit(db, action: str, entity_type: str = None, entity_id: str = None, details: dict = None, user: User = None):
    """
    Record an administrative audit log entry.
    """
    try:
        user_to_log = user or getattr(g, 'current_user', None)
        user_id = user_to_log.id if user_to_log else None
        user_email = user_to_log.email if user_to_log else 'system'
        
        entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=details or {},
            created_at=datetime.now(timezone.utc)
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}")
