"""
Database connection setup using SQLAlchemy.
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config

# Ensure database directory exists
os.makedirs(os.path.join(Config.BASE_DIR, 'database'), exist_ok=True)

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, echo=False)
SessionLocal = scoped_session(sessionmaker(bind=engine))
Base = declarative_base()


def get_db():
    """Get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize all database tables."""
    from database.models import Question, GeneratedPaper
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
