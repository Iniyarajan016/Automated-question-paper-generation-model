"""
ExamForge AI — Flask REST API
Automated Question Paper Generation System with Bloom's Taxonomy Mapping
"""

import os
import sys
import json
import random
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from config import Config
from database.db import SessionLocal, init_db, engine
from database.models import Question, GeneratedPaper, User
from ml.predict import predictor
from services.question_selection import select_questions
from services.pdf_generator import generate_exam_pdf, generate_teacher_summary_pdf
from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    auth_required
)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --- Initialize database on startup ---
def setup_database():
    """Create tables and import dataset if needed."""
    from database.db import Base
    from database.models import Question, GeneratedPaper, User
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed default demonstration user if none exists
        admin_email = os.environ.get('DEFAULT_USER_EMAIL', 'teacher@examforge.ai')
        admin_pass = os.environ.get('DEFAULT_USER_PASSWORD', 'ExamForge@2026')
        existing_user = db.query(User).filter_by(email=admin_email).first()
        if not existing_user:
            demo_user = User(
                email=admin_email,
                full_name='Lead Faculty / Examiner',
                password_hash=hash_password(admin_pass),
                role='teacher',
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print(f"Created default demonstration account: {admin_email}")

        count = db.query(Question).count()
        if count == 0 and os.path.exists(Config.DATASET_CSV):
            print("Importing questions from dataset...")
            import_questions_from_csv(db)
        else:
            print(f"Database has {count} questions.")
    finally:
        db.close()


def import_questions_from_csv(db):
    """Import cleaned CSV into the database."""
    df = pd.read_csv(Config.DATASET_CSV)
    imported = 0
    skipped = 0
    
    for _, row in df.iterrows():
        # Check for duplicate
        existing = None
        qid = row.get('question_id')
        if qid and pd.notna(qid):
            existing = db.query(Question).filter_by(question_id=str(qid)).first()
        
        if existing:
            skipped += 1
            continue
        
        q = Question(
            question_id=str(qid) if pd.notna(qid) else None,
            question=str(row.get('question', '')),
            subject=str(row.get('subject', '')) if pd.notna(row.get('subject')) else None,
            topic=str(row.get('topic', '')) if pd.notna(row.get('topic')) else None,
            board=str(row.get('board', '')) if pd.notna(row.get('board')) else None,
            class_grade=str(row.get('class_grade', '')) if pd.notna(row.get('class_grade')) else None,
            question_type=str(row.get('question_type', '')) if pd.notna(row.get('question_type')) else None,
            marks=float(row['marks']) if pd.notna(row.get('marks')) else None,
            bloom_level=str(row.get('bloom_level', '')) if pd.notna(row.get('bloom_level')) else None,
            difficulty=str(row.get('difficulty', '')) if pd.notna(row.get('difficulty')) else None,
            source=str(row.get('source', 'EduBloom Dataset')),
            verified=bool(row.get('verified', False)),
        )
        db.add(q)
        imported += 1
        
        if imported % 1000 == 0:
            db.commit()
    
    db.commit()
    print(f"Imported {imported} questions, skipped {skipped} duplicates.")


# --- Helper ---
def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


# ========================================
# API ENDPOINTS
# ========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    db = get_db()
    try:
        q_count = db.query(Question).count()
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': 'connected',
            'questions_count': q_count,
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        db.close()


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Authenticate teacher credentials and issue JWT token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request payload must be JSON'}), 400
    
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    db = get_db()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({'error': 'Invalid email or password. Please verify credentials.'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account has been deactivated. Contact system administrator.'}), 403
        
        token = create_access_token(user)
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
    finally:
        db.close()


@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Register a new teacher or faculty account (development & administrative use)."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request payload must be JSON'}), 400
    
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    db = get_db()
    try:
        if db.query(User).filter_by(email=email).first():
            return jsonify({'error': 'An account with this email address already exists.'}), 409
        
        new_user = User(
            email=email,
            full_name=full_name or 'Faculty Member',
            password_hash=hash_password(password),
            role='teacher',
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = create_access_token(new_user)
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Failed to register user: {str(e)}'}), 500
    finally:
        db.close()


@app.route('/api/auth/me', methods=['GET'])
@auth_required
def auth_me():
    """Return profile data of currently authenticated user."""
    from flask import g
    return jsonify({
        'user': g.current_user.to_dict()
    })


@app.route('/api/dashboard/stats', methods=['GET'])
@auth_required
def dashboard_stats():
    """Get dashboard statistics (Protected)."""
    db = get_db()
    try:
        total_questions = db.query(Question).count()
        subjects = db.query(Question.subject).distinct().filter(Question.subject.isnot(None)).all()
        subjects = [s[0] for s in subjects if s[0]]
        papers_count = db.query(GeneratedPaper).count()
        
        # Model status
        model_status = predictor.get_models_status()
        
        # Load evaluation reports if available
        bloom_eval = None
        diff_eval = None
        bloom_eval_path = os.path.join(Config.REPORTS_DIR, 'bloom_evaluation.json')
        diff_eval_path = os.path.join(Config.REPORTS_DIR, 'difficulty_evaluation.json')
        
        if os.path.exists(bloom_eval_path):
            with open(bloom_eval_path) as f:
                bloom_eval = json.load(f)
        
        if os.path.exists(diff_eval_path):
            with open(diff_eval_path) as f:
                diff_eval = json.load(f)
        
        # Recent history
        recent_papers = db.query(GeneratedPaper).order_by(
            GeneratedPaper.created_at.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_questions': total_questions,
            'subjects': subjects,
            'subjects_count': len(subjects),
            'papers_generated': papers_count,
            'bloom_model_status': 'trained' if model_status['bloom_model']['available'] else 'not_trained',
            'difficulty_model_status': 'trained' if model_status['difficulty_model']['available'] else 'not_trained',
            'bloom_evaluation': {
                'accuracy': bloom_eval.get('accuracy') if bloom_eval else None,
                'macro_f1': bloom_eval.get('macro_f1') if bloom_eval else None,
            } if bloom_eval else None,
            'difficulty_evaluation': {
                'accuracy': diff_eval.get('accuracy') if diff_eval else None,
                'macro_f1': diff_eval.get('macro_f1') if diff_eval else None,
            } if diff_eval else None,
            'recent_papers': [p.to_dict() for p in recent_papers],
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/questions', methods=['GET'])
@auth_required
def get_questions():
    """Get questions with filtering and pagination (Protected)."""
    db = get_db()
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)
        
        query = db.query(Question)
        
        # Filters
        search = request.args.get('search')
        if search:
            query = query.filter(Question.question.contains(search))
        
        subject = request.args.get('subject')
        if subject:
            query = query.filter(Question.subject == subject)
        
        topic = request.args.get('topic')
        if topic:
            query = query.filter(Question.topic == topic)
        
        bloom = request.args.get('bloom_level')
        if bloom:
            query = query.filter(Question.bloom_level == bloom)
        
        difficulty = request.args.get('difficulty')
        if difficulty:
            query = query.filter(Question.difficulty == difficulty)
        
        q_type = request.args.get('question_type')
        if q_type:
            query = query.filter(Question.question_type == q_type)
        
        total = query.count()
        questions = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'questions': [q.to_dict() for q in questions],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/questions', methods=['POST'])
def add_question():
    """Add a new question to the bank."""
    db = get_db()
    try:
        data = request.get_json()
        if not data or not data.get('question'):
            return jsonify({'error': 'Question text is required'}), 400
        
        q = Question(
            question=data['question'],
            subject=data.get('subject'),
            topic=data.get('topic'),
            board=data.get('board'),
            class_grade=data.get('class_grade'),
            question_type=data.get('question_type'),
            marks=data.get('marks'),
            bloom_level=data.get('bloom_level'),
            difficulty=data.get('difficulty'),
            source=data.get('source', 'Manual Entry'),
            verified=data.get('verified', True),
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        
        return jsonify({'message': 'Question added successfully', 'question': q.to_dict()}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """Update an existing question."""
    db = get_db()
    try:
        q = db.query(Question).get(question_id)
        if not q:
            return jsonify({'error': 'Question not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        for field in ['question', 'subject', 'topic', 'board', 'class_grade',
                      'question_type', 'marks', 'bloom_level', 'difficulty', 'verified']:
            if field in data:
                setattr(q, field, data[field])
        
        db.commit()
        db.refresh(q)
        return jsonify({'message': 'Question updated', 'question': q.to_dict()})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/questions/filters', methods=['GET'])
def get_question_filters():
    """Get available filter options."""
    db = get_db()
    try:
        subjects = [s[0] for s in db.query(Question.subject).distinct().all() if s[0]]
        topics = [t[0] for t in db.query(Question.topic).distinct().all() if t[0]]
        q_types = [t[0] for t in db.query(Question.question_type).distinct().all() if t[0]]
        
        return jsonify({
            'subjects': sorted(subjects),
            'topics': sorted(topics)[:50],  # Limit to avoid huge responses
            'question_types': sorted(q_types),
            'bloom_levels': Config.BLOOM_LEVELS,
            'difficulty_levels': Config.DIFFICULTY_LEVELS,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/classify', methods=['POST'])
@auth_required
def classify_question():
    """Classify a question using trained ML models (Protected)."""
    data = request.get_json()
    q_text = data.get('question') or data.get('text') if data else None
    if not q_text:
        return jsonify({'error': 'Question text is required (use "question" or "text" key)'}), 400
    
    result = predictor.classify_question(q_text)
    
    # Flatten structure slightly for frontend convenience
    bloom_info = result.get('bloom', {})
    diff_info = result.get('difficulty', {})
    
    return jsonify({
        'question': result.get('question'),
        'bloom_level': bloom_info.get('prediction'),
        'bloom_confidence': bloom_info.get('confidence'),
        'bloom_probabilities': bloom_info.get('probabilities'),
        'difficulty': diff_info.get('prediction'),
        'difficulty_confidence': diff_info.get('confidence'),
        'difficulty_probabilities': diff_info.get('probabilities'),
        'raw': result
    })


@app.route('/api/models/status', methods=['GET'])
def models_status():
    """Get status of trained models."""
    status = predictor.get_models_status()
    
    # Add evaluation info if available
    for model_name, eval_file in [
        ('bloom_model', 'bloom_evaluation.json'),
        ('difficulty_model', 'difficulty_evaluation.json')
    ]:
        eval_path = os.path.join(Config.REPORTS_DIR, eval_file)
        if os.path.exists(eval_path):
            with open(eval_path) as f:
                status[model_name]['evaluation'] = json.load(f)
    
    return jsonify(status)


@app.route('/api/models/evaluation', methods=['GET'])
def models_evaluation():
    """Get detailed evaluation metrics for both models."""
    result = {}
    
    for name, filename in [
        ('bloom', 'bloom_evaluation.json'),
        ('difficulty', 'difficulty_evaluation.json')
    ]:
        path = os.path.join(Config.REPORTS_DIR, filename)
        if os.path.exists(path):
            with open(path) as f:
                result[name] = json.load(f)
        else:
            result[name] = {'status': 'not_trained', 'message': 'Model has not been trained yet.'}
    
    # Training summary
    summary_path = os.path.join(Config.REPORTS_DIR, 'training_summary.json')
    if os.path.exists(summary_path):
        with open(summary_path) as f:
            result['training_summary'] = json.load(f)
    
    return jsonify(result)


@app.route('/api/generate-paper', methods=['POST'])
@auth_required
def generate_paper():
    """Generate a question paper based on teacher requirements (Protected)."""
    db = get_db()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        title = data.get('title', 'Examination Paper')
        if not title.strip():
            return jsonify({'error': 'Examination title is required'}), 400
        
        # Get all questions from database matching filters
        query = db.query(Question)
        
        subject = data.get('subject')
        if subject:
            query = query.filter(Question.subject == subject)
        
        topic = data.get('topic')
        if topic:
            query = query.filter(Question.topic == topic)
        
        board = data.get('board')
        if board:
            query = query.filter(Question.board == board)
        
        class_grade = data.get('class_grade')
        if class_grade:
            query = query.filter(Question.class_grade == class_grade)
        
        q_type = data.get('question_type')
        if q_type:
            query = query.filter(Question.question_type == q_type)
        
        bloom_level = data.get('bloom_level')
        if bloom_level:
            query = query.filter(Question.bloom_level == bloom_level)
        
        difficulty = data.get('difficulty')
        if difficulty:
            query = query.filter(Question.difficulty == difficulty)
        
        all_questions = query.all()
        available = [q.to_dict() for q in all_questions]
        
        if not available:
            return jsonify({
                'success': False,
                'error': 'No questions match the selected criteria',
                'suggestions': [
                    'Try broadening your filters',
                    'Remove the topic filter',
                    'Try a different subject or difficulty level',
                ]
            }), 400
        
        # Use question selection service
        num_questions = data.get('num_questions', 10)
        total_marks = data.get('total_marks')
        seed = data.get('seed', random.randint(1, 100000))
        
        result = select_questions(
            available_questions=available,
            num_questions=num_questions,
            total_marks=total_marks,
            seed=seed,
        )
        
        if not result['success']:
            return jsonify(result), 400
        
        selected = result['selected_questions']
        
        # Generate PDF
        paper_data = {
            'title': title,
            'board': board,
            'class_grade': class_grade,
            'subject': subject,
            'topic': topic,
            'total_marks': result['total_marks'],
        }
        
        filepath, filename = generate_exam_pdf(paper_data, selected)
        
        # Save to database
        paper = GeneratedPaper(
            title=title,
            board=board,
            class_grade=class_grade,
            subject=subject,
            topic=topic,
            total_marks=result['total_marks'],
            num_questions=len(selected),
            question_type=q_type,
            bloom_level=bloom_level,
            difficulty=difficulty,
            questions_json=selected,
            pdf_filename=filename,
            generation_seed=seed,
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        
        return jsonify({
            'success': True,
            'paper_id': paper.id,
            'title': title,
            'questions': selected,
            'count': len(selected),
            'total_marks': result['total_marks'],
            'pdf_filename': filename,
            'bloom_distribution': result['bloom_distribution'],
            'difficulty_distribution': result['difficulty_distribution'],
            'warnings': result['warnings'],
            'marks_validation': result['marks_validation'],
        }), 201
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/history', methods=['GET'])
@auth_required
def generation_history():
    """Get paper generation history (Protected)."""
    db = get_db()
    try:
        papers = db.query(GeneratedPaper).order_by(
            GeneratedPaper.created_at.desc()
        ).all()
        
        return jsonify({
            'papers': [p.to_dict() for p in papers],
            'total': len(papers),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/papers/<int:paper_id>/download', methods=['GET'])
def download_paper(paper_id):
    """Download a generated paper PDF."""
    db = get_db()
    try:
        paper = db.query(GeneratedPaper).get(paper_id)
        if not paper:
            return jsonify({'error': 'Paper not found'}), 404
        
        if not paper.pdf_filename:
            return jsonify({'error': 'No PDF file associated with this paper'}), 404
        
        filepath = os.path.join(Config.GENERATED_PAPERS_DIR, paper.pdf_filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'PDF file not found on disk'}), 404
        
        paper.status = 'downloaded'
        db.commit()
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=paper.pdf_filename,
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/papers/<int:paper_id>', methods=['GET'])
def get_paper(paper_id):
    """Get details of a generated paper."""
    db = get_db()
    try:
        paper = db.query(GeneratedPaper).get(paper_id)
        if not paper:
            return jsonify({'error': 'Paper not found'}), 404
        return jsonify(paper.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ========================================
# MAIN
# ========================================

if __name__ == '__main__':
    print("╔" + "═" * 58 + "╗")
    print("║  ExamForge AI — Backend Server                         ║")
    print("╚" + "═" * 58 + "╝")
    
    setup_database()
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
