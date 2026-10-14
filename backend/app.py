"""
ExamForge AI — Flask REST API
Automated Question Paper Generation System for Tamil Nadu State Board (Classes 6–12)
Supervised Random Forest Classification & Role-Based Access Control (Admin vs. Teacher)
"""

import os
import sys
import json
import random
import pandas as pd
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_file, g
from flask_cors import CORS

from config import Config
from database.db import SessionLocal, init_db, engine
from database.models import (
    Question, GeneratedPaper, User, Curriculum, DatasetUpload, ModelVersion, AuditLog
)
from ml.predict import predictor
from ml.random_forest_trainer import train_random_forest_pipeline, activate_version
from services.question_selection import select_questions
from services.pdf_generator import generate_exam_pdf, generate_teacher_summary_pdf
from services.curriculum_service import (
    get_supported_classes,
    get_supported_subjects,
    get_supported_chapters,
    seed_curriculum_metadata
)
from services.dataset_service import (
    save_uploaded_csv,
    validate_dataset,
    commit_dataset_to_question_bank
)
from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    auth_required,
    admin_required,
    teacher_required,
    log_audit
)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": Config.CORS_ALLOWED_ORIGINS}})


# --- Initialize database and default accounts on startup ---
def setup_database():
    """Create tables, run migrations, and seed default admin/teacher accounts."""
    init_db()
    db = SessionLocal()
    try:
        # 1. Seed Curriculum metadata
        seed_curriculum_metadata(db)

        # 2. Seed Administrator Account
        admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@examforge.ai')
        admin_pass = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'Admin@2026')
        admin_user = db.query(User).filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                full_name='System Administrator',
                password_hash=hash_password(admin_pass),
                role='admin',
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"Created default administrator account: {admin_email}")

        # 3. Seed Teacher Account
        teacher_email = os.environ.get('DEFAULT_TEACHER_EMAIL', 'teacher@examforge.ai')
        teacher_pass = os.environ.get('DEFAULT_TEACHER_PASSWORD', 'ExamForge@2026')
        teacher_user = db.query(User).filter_by(email=teacher_email).first()
        if not teacher_user:
            teacher_user = User(
                email=teacher_email,
                full_name='Lead Faculty / Examiner',
                password_hash=hash_password(teacher_pass),
                role='teacher',
                is_active=True
            )
            db.add(teacher_user)
            db.commit()
            print(f"Created default teacher account: {teacher_email}")

        # 4. Check TN questions count
        tn_count = db.query(Question).filter_by(board='Tamil Nadu State Board').count()
        total_count = db.query(Question).count()
        print(f"Database ready: {tn_count} Tamil Nadu State Board questions (Total questions in DB: {total_count}).")
    finally:
        db.close()


def get_db():
    """SessionLocal generator helper."""
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


# ==============================================================================
# SYSTEM & AUTHENTICATION ENDPOINTS
# ==============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with active model status."""
    db = get_db()
    try:
        tn_q_count = db.query(Question).filter_by(board='Tamil Nadu State Board').count()
        model_status = predictor.get_models_status()
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'board_supported': 'Tamil Nadu State Board (Classes 6–12)',
            'tn_questions_count': tn_q_count,
            'models': model_status
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        db.close()


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Authenticate staff or administrator credentials and return role-scoped JWT token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request payload must be JSON'}), 400
    
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    db = get_db()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({'error': 'Invalid email or password. Please verify credentials.'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account has been deactivated. Please contact your system administrator.'}), 403
        
        token = create_access_token(user)
        log_audit(db, action="USER_LOGIN", entity_type="User", entity_id=user.id, user=user)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
    finally:
        db.close()


@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Register a new faculty member account."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request payload must be JSON'}), 400
    
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('role') or 'teacher').strip().lower()
    if role not in ['teacher', 'admin']:
        role = 'teacher'
    
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
            role=role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = create_access_token(new_user)
        log_audit(db, action="USER_REGISTER", entity_type="User", entity_id=new_user.id, user=new_user)
        
        return jsonify({
            'message': 'Account registered successfully',
            'token': token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Failed to register account: {str(e)}'}), 500
    finally:
        db.close()


@app.route('/api/auth/me', methods=['GET'])
@auth_required
def auth_me():
    """Return profile data of currently authenticated user."""
    return jsonify({
        'user': g.current_user.to_dict()
    })


# ==============================================================================
# DASHBOARD OVERVIEWS (ROLE-SEGREGATED)
# ==============================================================================

@app.route('/api/dashboard/stats', methods=['GET'])
@auth_required
def dashboard_stats():
    """
    Role-aware dashboard statistics.
    Teachers receive ONLY question paper generation metrics and syllabus stats.
    Teachers are strictly blocked from seeing model accuracy and training evaluation.
    """
    db = get_db()
    try:
        user = g.current_user
        
        # Base stats common to education
        total_tn_questions = db.query(Question).filter_by(board='Tamil Nadu State Board').count()
        tn_classes = get_supported_classes()
        
        if user.role == 'admin':
            # Admin sees system overview and model statuses
            staff_count = db.query(User).filter_by(role='teacher').count()
            total_papers = db.query(GeneratedPaper).count()
            dataset_uploads_count = db.query(DatasetUpload).count()
            model_versions_count = db.query(ModelVersion).count()
            
            # Active models info
            active_bloom = db.query(ModelVersion).filter_by(task_name='bloom_level', is_active=True).first()
            active_diff = db.query(ModelVersion).filter_by(task_name='difficulty', is_active=True).first()
            
            recent_activity = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()
            
            return jsonify({
                'role': 'admin',
                'staff_count': staff_count,
                'total_tn_questions': total_tn_questions,
                'papers_generated': total_papers,
                'dataset_uploads_count': dataset_uploads_count,
                'model_versions_count': model_versions_count,
                'active_models': {
                    'bloom': active_bloom.to_dict() if active_bloom else None,
                    'difficulty': active_diff.to_dict() if active_diff else None
                },
                'recent_activity': [a.to_dict() for a in recent_activity]
            })
        else:
            # TEACHER DASHBOARD: Zero model accuracy cards or training summaries!
            # Teacher only sees papers generated by themselves and available subjects
            teacher_papers = db.query(GeneratedPaper).filter_by(
                created_by_user_id=user.id
            ).order_by(GeneratedPaper.created_at.desc()).limit(6).all()
            
            teacher_papers_count = db.query(GeneratedPaper).filter_by(created_by_user_id=user.id).count()
            
            return jsonify({
                'role': 'teacher',
                'user_name': user.full_name,
                'supported_board': 'Tamil Nadu State Board (Classes 6–12)',
                'supported_classes': tn_classes,
                'total_questions_available': total_tn_questions,
                'papers_generated_by_user': teacher_papers_count,
                'recent_papers': [p.to_dict() for p in teacher_papers]
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ==============================================================================
# TAMIL NADU STATE BOARD CURRICULUM ENDPOINTS
# ==============================================================================

@app.route('/api/curriculum/classes', methods=['GET'])
def get_curriculum_classes():
    """Get supported Tamil Nadu State Board classes (Classes 6 to 12)."""
    return jsonify({
        'board': 'Tamil Nadu State Board',
        'classes': get_supported_classes()
    })


@app.route('/api/curriculum/subjects', methods=['GET'])
def get_curriculum_subjects():
    """Get verified subjects for a specific Tamil Nadu State Board class."""
    class_grade = request.args.get('class_grade') or 'Class 10'
    subjects = get_supported_subjects(class_grade)
    return jsonify({
        'board': 'Tamil Nadu State Board',
        'class_grade': class_grade,
        'subjects': subjects
    })


@app.route('/api/curriculum/chapters', methods=['GET'])
def get_curriculum_chapters():
    """Get verified textbook chapters for a specific class and subject."""
    class_grade = request.args.get('class_grade') or 'Class 10'
    subject = request.args.get('subject') or 'Mathematics'
    chapters = get_supported_chapters(class_grade, subject)
    return jsonify({
        'board': 'Tamil Nadu State Board',
        'class_grade': class_grade,
        'subject': subject,
        'chapters': chapters
    })


# ==============================================================================
# ADMIN: STAFF MANAGEMENT ENDPOINTS (ADMIN ONLY)
# ==============================================================================

@app.route('/api/admin/staff', methods=['GET'])
@admin_required
def admin_get_staff():
    """List all registered faculty and staff accounts (Admin Only)."""
    db = get_db()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        return jsonify({
            'staff': [u.to_dict() for u in users],
            'total': len(users)
        })
    finally:
        db.close()


@app.route('/api/admin/staff', methods=['POST'])
@admin_required
def admin_create_staff():
    """Add a new staff or faculty account (Admin Only)."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request payload must be JSON'}), 400
    
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    phone = (data.get('phone') or '').strip()
    role = (data.get('role') or 'teacher').strip().lower()
    subject_spec = (data.get('subject_specialization') or '').strip()
    initial_password = data.get('password') or 'Staff@2026'
    
    if not email:
        return jsonify({'error': 'Staff email is required'}), 400
    if not full_name:
        return jsonify({'error': 'Staff full name is required'}), 400
    if role not in ['teacher', 'admin']:
        role = 'teacher'
    
    db = get_db()
    try:
        existing = db.query(User).filter_by(email=email).first()
        if existing:
            return jsonify({'error': f'An account with email {email} already exists.'}), 409
        
        staff_member = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role=role,
            subject_specialization=subject_spec,
            password_hash=hash_password(initial_password),
            is_active=True
        )
        db.add(staff_member)
        db.commit()
        db.refresh(staff_member)
        
        log_audit(db, action="CREATE_STAFF_ACCOUNT", entity_type="User", entity_id=staff_member.id, details={'email': email, 'role': role})
        
        return jsonify({
            'message': f"Staff account for {full_name} created successfully.",
            'staff': staff_member.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/admin/staff/<int:user_id>', methods=['PUT'])
@admin_required
def admin_update_staff(user_id):
    """Edit staff profile, role, or active status (Admin Only)."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    db = get_db()
    try:
        staff = db.get(User, user_id)
        if not staff:
            return jsonify({'error': 'Staff account not found'}), 404
        
        # Prevent self-deactivation of primary admin
        if staff.id == g.current_user.id and data.get('is_active') is False:
            return jsonify({'error': 'Cannot deactivate your own administrator account.'}), 400
        
        if 'full_name' in data and data['full_name']:
            staff.full_name = data['full_name'].strip()
        if 'phone' in data:
            staff.phone = data['phone'].strip()
        if 'role' in data and data['role'] in ['teacher', 'admin']:
            staff.role = data['role']
        if 'subject_specialization' in data:
            staff.subject_specialization = data['subject_specialization'].strip()
        if 'is_active' in data:
            staff.is_active = bool(data['is_active'])
            
        staff.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(staff)
        
        log_audit(db, action="UPDATE_STAFF_ACCOUNT", entity_type="User", entity_id=staff.id, details={'role': staff.role, 'is_active': staff.is_active})
        
        return jsonify({
            'message': 'Staff details updated successfully',
            'staff': staff.to_dict()
        })
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/admin/staff/<int:user_id>/reset-password', methods=['POST'])
@admin_required
def admin_reset_staff_password(user_id):
    """Reset password for a staff account (Admin Only)."""
    data = request.get_json() or {}
    new_password = data.get('password') or 'ExamForge@2026'
    
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    db = get_db()
    try:
        staff = db.get(User, user_id)
        if not staff:
            return jsonify({'error': 'Staff account not found'}), 404
        
        staff.password_hash = hash_password(new_password)
        staff.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        log_audit(db, action="RESET_STAFF_PASSWORD", entity_type="User", entity_id=staff.id)
        
        return jsonify({
            'message': f"Password for {staff.full_name or staff.email} has been reset successfully."
        })
    finally:
        db.close()


@app.route('/api/admin/staff/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_staff(user_id):
    """Deactivate or remove a staff account (Admin Only)."""
    db = get_db()
    try:
        staff = db.get(User, user_id)
        if not staff:
            return jsonify({'error': 'Staff account not found'}), 404
        if staff.id == g.current_user.id:
            return jsonify({'error': 'Cannot delete or deactivate your own account'}), 400
        
        staff.is_active = False
        db.commit()
        
        log_audit(db, action="DEACTIVATE_STAFF_ACCOUNT", entity_type="User", entity_id=staff.id)
        return jsonify({'message': f"Staff account {staff.email} deactivated successfully."})
    finally:
        db.close()


# ==============================================================================
# ADMIN: DATASET MANAGEMENT ENDPOINTS (ADMIN ONLY)
# ==============================================================================

@app.route('/api/admin/datasets/upload', methods=['POST'])
@admin_required
def admin_upload_dataset():
    """Upload a CSV dataset containing past Tamil Nadu State Board question papers (Admin Only)."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the multipart request'}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected for upload'}), 400
    
    result = save_uploaded_csv(file, user_id=g.current_user.id)
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 201


@app.route('/api/admin/datasets', methods=['GET'])
@admin_required
def admin_list_datasets():
    """List all uploaded datasets with record counts and validation status (Admin Only)."""
    db = get_db()
    try:
        datasets = db.query(DatasetUpload).order_by(DatasetUpload.created_at.desc()).all()
        return jsonify({
            'datasets': [d.to_dict() for d in datasets],
            'total': len(datasets)
        })
    finally:
        db.close()


@app.route('/api/admin/datasets/<int:upload_id>', methods=['GET'])
@admin_required
def admin_get_dataset(upload_id):
    """Get detailed validation report and column mapping for an upload (Admin Only)."""
    db = get_db()
    try:
        upload = db.get(DatasetUpload, upload_id)
        if not upload:
            return jsonify({'error': 'Dataset not found'}), 404
        return jsonify(upload.to_dict())
    finally:
        db.close()


@app.route('/api/admin/datasets/<int:upload_id>/validate', methods=['POST'])
@admin_required
def admin_validate_dataset(upload_id):
    """Validate CSV contents using the mapped columns (Admin Only)."""
    data = request.get_json() or {}
    column_mapping = data.get('column_mapping') or {}
    default_class = data.get('default_class')
    
    result = validate_dataset(
        upload_id=upload_id,
        column_mapping=column_mapping,
        default_class=default_class,
        user_id=g.current_user.id
    )
    if not result['success']:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/admin/datasets/<int:upload_id>/import', methods=['POST'])
@admin_required
def admin_import_dataset_to_bank(upload_id):
    """Ingest validated Tamil Nadu State Board questions into Question Bank (Admin Only)."""
    result = commit_dataset_to_question_bank(upload_id, user_id=g.current_user.id)
    if not result['success']:
        return jsonify(result), 400
    return jsonify(result)


# ==============================================================================
# ADMIN: MODEL TRAINING & EVALUATION ENDPOINTS (ADMIN ONLY)
# ==============================================================================

@app.route('/api/admin/models/train', methods=['POST'])
@admin_required
def admin_train_model():
    """
    Train a Random Forest classifier using TF-IDF text features on Tamil Nadu State Board data.
    Trains only tasks with valid target labels (bloom_level or difficulty).
    Outputs held-out test evaluation, confusion matrix, and registers version (Admin Only).
    """
    data = request.get_json() or {}
    task_name = data.get('task_name') or 'bloom_level'
    dataset_source = data.get('dataset_source') or 'db'
    n_estimators = int(data.get('n_estimators') or 100)
    auto_activate = bool(data.get('auto_activate', False))
    
    result = train_random_forest_pipeline(
        task_name=task_name,
        dataset_source=dataset_source,
        n_estimators=n_estimators,
        user_id=g.current_user.id,
        auto_activate=auto_activate
    )
    
    if not result['success']:
        return jsonify(result), 400
    return jsonify(result), 201


@app.route('/api/admin/models/versions', methods=['GET'])
@admin_required
def admin_list_model_versions():
    """List all trained model versions, held-out test metrics, and active states (Admin Only)."""
    db = get_db()
    try:
        task_filter = request.args.get('task')
        query = db.query(ModelVersion)
        if task_filter:
            query = query.filter_by(task_name=task_filter)
        
        versions = query.order_by(ModelVersion.created_at.desc()).all()
        return jsonify({
            'versions': [v.to_dict() for v in versions],
            'total': len(versions)
        })
    finally:
        db.close()


@app.route('/api/admin/models/<int:model_id>/activate', methods=['POST'])
@admin_required
def admin_activate_model(model_id):
    """Activate a validated model version or roll back to a previous version (Admin Only)."""
    result = activate_version(model_id, user_id=g.current_user.id)
    if not result['success']:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/models/evaluation', methods=['GET'])
@admin_required
def models_evaluation():
    """
    Get detailed evaluation metrics for both models (ADMIN ONLY).
    Teachers receive 403 Forbidden.
    """
    db = get_db()
    try:
        result = {}
        for task in ['bloom_level', 'difficulty']:
            active_m = db.query(ModelVersion).filter_by(task_name=task, is_active=True).first()
            if active_m and active_m.evaluation_metrics:
                result[task] = active_m.evaluation_metrics
            else:
                eval_file = 'bloom_evaluation.json' if task == 'bloom_level' else 'difficulty_evaluation.json'
                path = os.path.join(Config.REPORTS_DIR, eval_file)
                if os.path.exists(path):
                    with open(path) as f:
                        result[task] = json.load(f)
                else:
                    result[task] = {'status': 'not_trained', 'message': f'Model for {task} has not been trained yet.'}
        return jsonify(result)
    finally:
        db.close()


@app.route('/api/models/status', methods=['GET'])
@admin_required
def models_status():
    """Get status of trained models (ADMIN ONLY)."""
    status = predictor.get_models_status()
    return jsonify(status)


@app.route('/api/admin/overview', methods=['GET'])
@admin_required
def admin_system_overview():
    """System overview statistics for Administrator."""
    db = get_db()
    try:
        staff_count = db.query(User).filter_by(role='teacher').count()
        total_questions = db.query(Question).filter_by(board='Tamil Nadu State Board').count()
        papers_count = db.query(GeneratedPaper).count()
        datasets_count = db.query(DatasetUpload).count()
        training_runs_count = db.query(ModelVersion).count()
        
        active_models = db.query(ModelVersion).filter_by(is_active=True).all()
        recent_audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
        
        return jsonify({
            'staff_count': staff_count,
            'total_tamilnadu_questions': total_questions,
            'papers_generated': papers_count,
            'datasets_uploaded': datasets_count,
            'model_training_runs': training_runs_count,
            'active_models': [m.to_dict() for m in active_models],
            'recent_activity': [a.to_dict() for a in recent_audits]
        })
    finally:
        db.close()


# ==============================================================================
# QUESTION BANK & CLASSIFICATION ENDPOINTS
# ==============================================================================

@app.route('/api/questions', methods=['GET'])
@auth_required
def get_questions():
    """Get questions filtered strictly to Tamil Nadu State Board (Classes 6–12)."""
    db = get_db()
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)
        
        # Enforce Tamil Nadu State Board questions
        query = db.query(Question).filter(
            (Question.board == 'Tamil Nadu State Board') | (Question.board.is_(None))
        )
        
        # Mandatory/optional filters
        class_grade = request.args.get('class_grade')
        if class_grade:
            query = query.filter(Question.class_grade == class_grade)
            
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
            
        search = request.args.get('search')
        if search:
            query = query.filter(Question.question.contains(search))
            
        total = query.count()
        questions = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'questions': [q.to_dict() for q in questions],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
        })
    finally:
        db.close()


@app.route('/api/questions/filters', methods=['GET'])
@auth_required
def get_question_filters():
    """Get available filter options restricted to Tamil Nadu State Board."""
    db = get_db()
    try:
        classes = get_supported_classes()
        class_param = request.args.get('class_grade')
        
        if class_param:
            subjects = get_supported_subjects(class_param)
        else:
            subjects_q = db.query(Question.subject).filter_by(board='Tamil Nadu State Board').distinct().all()
            subjects = sorted([s[0] for s in subjects_q if s[0]])
            
        q_types = [t[0] for t in db.query(Question.question_type).distinct().all() if t[0]]
        
        return jsonify({
            'board': 'Tamil Nadu State Board',
            'classes': classes,
            'subjects': subjects,
            'question_types': sorted(q_types) if q_types else ['Short Answer', 'Long Answer', 'Problem Solving', 'Multiple Choice'],
            'bloom_levels': Config.BLOOM_LEVELS,
            'difficulty_levels': Config.DIFFICULTY_LEVELS,
        })
    finally:
        db.close()


@app.route('/api/classify', methods=['POST'])
@auth_required
def classify_question():
    """Classify a question using the active Random Forest models."""
    data = request.get_json()
    q_text = data.get('question') or data.get('text') if data else None
    if not q_text:
        return jsonify({'error': 'Question text is required'}), 400
    
    result = predictor.classify_question(q_text)
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


# ==============================================================================
# QUESTION PAPER GENERATION WORKFLOW (TEACHERS & ADMINS)
# ==============================================================================

@app.route('/api/generate-paper', methods=['POST'])
@teacher_required
def generate_paper():
    """
    Tamil Nadu State Board Question Paper Generation Workflow:
    1. Validates selected class (6 to 12) and subject.
    2. Retrieves approved Tamil Nadu State Board questions.
    3. Respects marks, difficulty, and Bloom taxonomy distributions.
    4. Formats printable PDF with ReportLab.
    5. Saves generation record with user ownership.
    """
    db = get_db()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        title = (data.get('title') or 'Terminal Examination').strip()
        class_grade = data.get('class_grade')
        subject = data.get('subject')
        chapters = data.get('chapters') or []
        topic = data.get('topic')
        duration_minutes = int(data.get('duration_minutes') or 90)
        num_questions = int(data.get('num_questions') or 10)
        total_marks = float(data.get('total_marks') or (num_questions * 2))
        
        # Mandatory Class Validation: Classes 6 to 12 only!
        if not class_grade or class_grade not in get_supported_classes():
            return jsonify({
                'success': False,
                'error': f"Class selection is mandatory and must be one of Classes 6 to 12. Received: '{class_grade}'."
            }), 400
        
        # Mandatory Subject Validation
        valid_subjects = get_supported_subjects(class_grade)
        if not subject:
            return jsonify({
                'success': False,
                'error': f"Subject selection is mandatory for {class_grade}."
            }), 400
        
        # Query approved Tamil Nadu State Board questions
        query = db.query(Question).filter(
            (Question.board == 'Tamil Nadu State Board') | (Question.board.is_(None))
        ).filter(
            Question.class_grade == class_grade
        ).filter(
            Question.subject == subject
        )
        
        # If specific chapters/topics are chosen
        if chapters and isinstance(chapters, list) and len(chapters) > 0:
            query = query.filter(Question.topic.in_(chapters))
        elif topic:
            query = query.filter(Question.topic == topic)
            
        eligible_questions = [q.to_dict() for q in query.all()]
        
        if not eligible_questions:
            return jsonify({
                'success': False,
                'error': f"No questions found in the question bank for Tamil Nadu State Board {class_grade} {subject} with the selected chapters.",
                'eligible_count': 0,
                'suggestions': [
                    "Select all chapters or a broader chapter set",
                    "Verify questions have been ingested for this subject in the Question Bank",
                    "Upload past papers via the Admin Dataset panel if you are an administrator"
                ]
            }), 400
        
        # Difficulty & Bloom distributions
        diff_dist = data.get('difficulty_distribution')
        bloom_dist = data.get('bloom_distribution')
        seed = data.get('seed') or random.randint(1000, 999999)
        
        # Select questions using intelligent selection service
        result = select_questions(
            available_questions=eligible_questions,
            num_questions=num_questions,
            total_marks=total_marks,
            subject=subject,
            topic=topic,
            topics=chapters,
            board='Tamil Nadu State Board',
            class_grade=class_grade,
            difficulty_distribution=diff_dist,
            bloom_distribution=bloom_dist,
            seed=seed
        )
        
        if not result['success']:
            return jsonify(result), 400
        
        selected_questions = result['selected_questions']
        sections = result.get('sections', [])
        
        # Generate official printable PDF
        paper_meta = {
            'title': title,
            'board': 'Tamil Nadu State Board',
            'class_grade': class_grade,
            'subject': subject,
            'topic': ", ".join(chapters[:3]) if chapters else topic,
            'duration_minutes': duration_minutes,
            'total_marks': result['total_marks'],
        }
        
        filepath, filename = generate_exam_pdf(
            paper_data=paper_meta,
            questions=selected_questions,
            sections=sections
        )
        
        # Persist generated paper with user ownership
        paper = GeneratedPaper(
            title=title,
            board='Tamil Nadu State Board',
            class_grade=class_grade,
            subject=subject,
            topic=paper_meta['topic'],
            total_marks=result['total_marks'],
            duration_minutes=duration_minutes,
            num_questions=len(selected_questions),
            question_type=data.get('question_type', 'Mixed'),
            bloom_level=data.get('bloom_level'),
            difficulty=data.get('difficulty'),
            questions_json=selected_questions,
            pdf_filename=filename,
            generation_seed=seed,
            created_by_user_id=g.current_user.id
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        
        log_audit(db, action="GENERATE_QUESTION_PAPER", entity_type="GeneratedPaper", entity_id=paper.id)
        
        return jsonify({
            'success': True,
            'paper_id': paper.id,
            'title': title,
            'class_grade': class_grade,
            'subject': subject,
            'duration_minutes': duration_minutes,
            'questions': selected_questions,
            'sections': sections,
            'count': len(selected_questions),
            'total_marks': result['total_marks'],
            'pdf_filename': filename,
            'bloom_distribution': result['bloom_distribution'],
            'difficulty_distribution': result['difficulty_distribution'],
            'warnings': result['warnings'],
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/history', methods=['GET'])
@auth_required
def generation_history():
    """
    Get question paper history.
    Teachers view ONLY their own papers.
    Admins can view all papers.
    """
    db = get_db()
    try:
        user = g.current_user
        query = db.query(GeneratedPaper)
        
        if user.role != 'admin':
            query = query.filter_by(created_by_user_id=user.id)
            
        papers = query.order_by(GeneratedPaper.created_at.desc()).all()
        return jsonify({
            'papers': [p.to_dict() for p in papers],
            'total': len(papers)
        })
    finally:
        db.close()


@app.route('/api/papers/<int:paper_id>', methods=['GET'])
@auth_required
def get_paper(paper_id):
    """Get details of a specific generated question paper."""
    db = get_db()
    try:
        paper = db.get(GeneratedPaper, paper_id)
        if not paper:
            return jsonify({'error': 'Question paper not found'}), 404
        
        # Check authorization: user can access if admin or paper creator
        if g.current_user.role != 'admin' and paper.created_by_user_id and paper.created_by_user_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized to access this examination paper.'}), 403
            
        return jsonify(paper.to_dict())
    finally:
        db.close()


@app.route('/api/papers/<int:paper_id>/download', methods=['GET'])
def download_paper(paper_id):
    """Download a generated examination paper PDF."""
    db = get_db()
    try:
        paper = db.get(GeneratedPaper, paper_id)
        if not paper or not paper.pdf_filename:
            return jsonify({'error': 'Paper or PDF file not found'}), 404
        
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
    finally:
        db.close()


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

if __name__ == '__main__':
    print("╔" + "═" * 68 + "╗")
    print("║  ExamForge AI — Tamil Nadu State Board (Classes 6–12) Server       ║")
    print("╚" + "═" * 68 + "╝")
    
    setup_database()
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
