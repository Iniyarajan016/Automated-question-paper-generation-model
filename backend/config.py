import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    BASE_DIR = BASE_DIR
    # Production environment check
    is_prod = (
        os.environ.get('FLASK_ENV', '').lower() == 'production' or
        os.environ.get('ENV', '').lower() == 'production' or
        os.environ.get('RENDER', '').lower() == 'true'
    )

    env_secret = os.environ.get('SECRET_KEY')
    if is_prod and (not env_secret or env_secret == 'examforge-secure-dev-key-tn-2026'):
        import secrets, warnings
        SECRET_KEY = secrets.token_hex(32)
        warnings.warn(
            "[SECURITY ALERT] Production deployment detected without a custom SECRET_KEY. "
            "A secure cryptographically random ephemeral key was generated to avoid relying on "
            "the default development secret. For persistent authentication sessions across server restarts, "
            "please set the SECRET_KEY environment variable in your deployment dashboard.",
            stacklevel=2
        )
    else:
        SECRET_KEY = env_secret or 'examforge-secure-dev-key-tn-2026'

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    
    # Database URL resolution
    raw_db_url = os.environ.get('DATABASE_URL')
    if raw_db_url:
        # Normalize postgres:// and postgresql:// to postgresql+psycopg:// for psycopg v3 compatibility
        if raw_db_url.startswith('postgres://'):
            raw_db_url = 'postgresql+psycopg://' + raw_db_url[len('postgres://'):]
        elif raw_db_url.startswith('postgresql://'):
            raw_db_url = 'postgresql+psycopg://' + raw_db_url[len('postgresql://'):]

        if raw_db_url.startswith('sqlite:///') and not os.path.isabs(raw_db_url.replace('sqlite:///', '')):
            rel_path = raw_db_url.replace('sqlite:///', '')
            SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.normpath(os.path.join(BASE_DIR, rel_path))}'
        else:
            SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "database", "examforge.db")}'
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Configuration
    raw_cors = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
    if raw_cors.strip() == '*':
        CORS_ALLOWED_ORIGINS = '*'
    else:
        CORS_ALLOWED_ORIGINS = [
            origin.strip()
            for origin in raw_cors.split(',')
            if origin.strip()
        ]
    
    # Paths
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    MODELS_DIR = os.path.join(BASE_DIR, 'models')
    REPORTS_DIR = os.path.join(BASE_DIR, 'reports')
    GENERATED_PAPERS_DIR = os.path.join(BASE_DIR, 'generated_papers')
    
    # Dataset
    DATASET_CSV = os.path.join(DATA_DIR, 'questions_dataset.csv')
    
    # Model files
    BLOOM_MODEL_PATH = os.path.join(MODELS_DIR, 'bloom_model.joblib')
    DIFFICULTY_MODEL_PATH = os.path.join(MODELS_DIR, 'difficulty_model.joblib')
    
    # Bloom's Taxonomy levels (ordered by cognitive complexity)
    BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
    
    # Difficulty levels
    DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard']
    
    # Ensure directories exist
    @staticmethod
    def init_dirs():
        for d in [Config.DATA_DIR, Config.MODELS_DIR, Config.REPORTS_DIR, Config.GENERATED_PAPERS_DIR]:
            os.makedirs(d, exist_ok=True)

Config.init_dirs()
