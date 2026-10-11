import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    BASE_DIR = BASE_DIR
    SECRET_KEY = os.environ.get('SECRET_KEY', 'examforge-dev-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "database", "examforge.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
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
