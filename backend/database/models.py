"""
Database Models for ExamForge AI
"""

import os
import sys
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, JSON
)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from database.db import Base


class Question(Base):
    """Question bank entry."""
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String(100), unique=True, nullable=True)  # Original ID from dataset
    question = Column(Text, nullable=False)
    subject = Column(String(100), nullable=True)
    topic = Column(String(200), nullable=True)
    board = Column(String(100), nullable=True)
    class_grade = Column(String(50), nullable=True)
    question_type = Column(String(100), nullable=True)
    marks = Column(Float, nullable=True)
    bloom_level = Column(String(50), nullable=True)
    difficulty = Column(String(50), nullable=True)
    source = Column(String(200), nullable=True, default='EduBloom Dataset')
    verified = Column(Boolean, default=False)  # Teacher-verified vs model-predicted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'question': self.question,
            'subject': self.subject,
            'topic': self.topic,
            'board': self.board,
            'class_grade': self.class_grade,
            'question_type': self.question_type,
            'marks': self.marks,
            'bloom_level': self.bloom_level,
            'difficulty': self.difficulty,
            'source': self.source,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class GeneratedPaper(Base):
    """Record of generated question papers."""
    __tablename__ = 'generated_papers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    board = Column(String(100), nullable=True)
    class_grade = Column(String(50), nullable=True)
    subject = Column(String(100), nullable=True)
    topic = Column(String(200), nullable=True)
    total_marks = Column(Float, nullable=True)
    num_questions = Column(Integer, nullable=True)
    question_type = Column(String(100), nullable=True)
    bloom_level = Column(String(50), nullable=True)
    difficulty = Column(String(50), nullable=True)
    
    # Generated result
    questions_json = Column(JSON, nullable=True)  # List of selected question IDs and details
    pdf_filename = Column(String(300), nullable=True)
    
    # Status
    status = Column(String(50), default='generated')  # generated, downloaded
    generation_seed = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'board': self.board,
            'class_grade': self.class_grade,
            'subject': self.subject,
            'topic': self.topic,
            'total_marks': self.total_marks,
            'num_questions': self.num_questions,
            'question_type': self.question_type,
            'bloom_level': self.bloom_level,
            'difficulty': self.difficulty,
            'questions_json': self.questions_json,
            'pdf_filename': self.pdf_filename,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class User(Base):
    """User account for teacher and administrator authentication."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default='teacher')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

