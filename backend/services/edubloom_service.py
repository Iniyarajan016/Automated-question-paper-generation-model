"""
EduBloom Dataset Validation, Ingestion, and Quality Reporting Service
Handles optional integration of the 73,712-row EduBloom question bank into ExamForge AI.

Key Safety Principles:
1. Validates schema, nulls, duplicates, and distributions without modifying the live database.
2. Strictly maps L1–L6 to standard Bloom's Taxonomy labels:
   L1 -> Remember, L2 -> Understand, L3 -> Apply, L4 -> Analyze, L5 -> Evaluate, L6 -> Create.
3. Preserves Tamil Nadu State Board isolation:
   Imported records are NEVER labeled as 'Tamil Nadu State Board' unless curriculum alignment is verified.
   They are tagged with board='General / EduBloom', verified=False.
4. Provides full statistics: total rows, valid rows, rejected rows, duplicate rows,
   label distributions, subject/topic diversity, and candidate training eligibility.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from collections import Counter

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config
from database.db import SessionLocal
from database.models import Question, DatasetUpload, AuditLog

# Path to the primary EduBloom dataset file
EDUBLOOM_CSV_PATH = os.path.join(Config.DATA_DIR, 'questions_dataset.csv')
EDUBLOOM_REPORT_PATH = os.path.join(Config.REPORTS_DIR, 'edubloom_validation_report.json')

# Standard target taxonomy
BLOOM_LEVELS = Config.BLOOM_LEVELS  # ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
DIFFICULTY_LEVELS = Config.DIFFICULTY_LEVELS  # ['Easy', 'Medium', 'Hard']

# Explicit L1-L6 mapping to application's Bloom Taxonomy
L_CODE_TO_BLOOM = {
    'l1': 'Remember',
    'l2': 'Understand',
    'l3': 'Apply',
    'l4': 'Analyze',
    'l5': 'Evaluate',
    'l6': 'Create',
    # Support pre-mapped or mixed variants
    'remember': 'Remember',
    'understand': 'Understand',
    'apply': 'Apply',
    'analyze': 'Analyze',
    'analyse': 'Analyze',
    'evaluate': 'Evaluate',
    'create': 'Create'
}

DIFFICULTY_MAP = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard',
    'simple': 'Easy',
    'moderate': 'Medium',
    'difficult': 'Hard'
}

REQUIRED_COLUMNS = ['question', 'bloom_level', 'difficulty']
OPTIONAL_COLUMNS = ['question_id', 'subject', 'topic', 'question_type']


def inspect_and_validate_edubloom_dataset(csv_path: str = None) -> dict:
    """
    Validates the EduBloom dataset:
    - Verifies column presence and data types.
    - Counts missing values and exact question duplicates.
    - Maps L1-L6 to standard Bloom taxonomy labels.
    - Computes label distributions for Bloom levels and Difficulty.
    - Analyzes subject and topic diversity.
    - Evaluates suitability for candidate model training.
    """
    path = csv_path or EDUBLOOM_CSV_PATH
    if not os.path.exists(path):
        return {
            'success': False,
            'error': f"EduBloom dataset file not found at '{path}'. Please ensure the dataset is present."
        }

    try:
        df = pd.read_csv(path)
    except Exception as e:
        return {'success': False, 'error': f"Failed to read CSV: {str(e)}"}

    total_rows = len(df)
    columns_found = list(df.columns)

    # 1. Column verification
    missing_required = [c for c in REQUIRED_COLUMNS if c not in columns_found]
    if missing_required:
        return {
            'success': False,
            'error': f"Dataset missing mandatory columns: {missing_required}. Present: {columns_found}"
        }

    # 2. Missing values analysis
    missing_stats = {}
    for col in columns_found:
        null_count = int(df[col].isna().sum())
        empty_count = int((df[col].astype(str).str.strip() == '').sum()) if df[col].dtype == object else 0
        missing_stats[col] = {
            'null_count': null_count,
            'empty_count': empty_count,
            'total_missing': null_count + empty_count
        }

    # 3. Duplicate checks
    duplicate_rows_full = int(df.duplicated().sum())
    duplicate_questions = int(df['question'].astype(str).str.strip().str.lower().duplicated().sum())

    # 4. Clean and normalize copy for inspection
    work_df = df.copy()

    # Drop rows with empty questions
    valid_q_mask = work_df['question'].notna() & (work_df['question'].astype(str).str.strip() != '') & (work_df['question'].astype(str).str.strip().str.lower() != 'nan')
    rejected_missing_q = int((~valid_q_mask).sum())
    work_df = work_df[valid_q_mask].copy()

    # Map Bloom level (L1-L6 -> Remember-Create)
    raw_bloom_counts = work_df['bloom_level'].astype(str).value_counts().to_dict()
    normalized_bloom = work_df['bloom_level'].astype(str).str.strip().str.lower().map(L_CODE_TO_BLOOM)
    unmapped_bloom_count = int(normalized_bloom.isna().sum())
    work_df['normalized_bloom'] = normalized_bloom

    # Filter valid bloom
    valid_bloom_mask = work_df['normalized_bloom'].isin(BLOOM_LEVELS)
    rejected_invalid_bloom = int((~valid_bloom_mask).sum())
    work_df = work_df[valid_bloom_mask].copy()

    # Map Difficulty (Easy, Medium, Hard)
    raw_diff_counts = work_df['difficulty'].astype(str).value_counts().to_dict()
    normalized_diff = work_df['difficulty'].astype(str).str.strip().str.lower().map(DIFFICULTY_MAP)
    unmapped_diff_count = int(normalized_diff.isna().sum())
    work_df['normalized_difficulty'] = normalized_diff

    # Filter valid difficulty
    valid_diff_mask = work_df['normalized_difficulty'].isin(DIFFICULTY_LEVELS)
    rejected_invalid_diff = int((~valid_diff_mask).sum())
    work_df = work_df[valid_diff_mask].copy()

    # Deduplicate question text within valid subset
    before_dedup = len(work_df)
    work_df_dedup = work_df.drop_duplicates(subset=['question'], keep='first')
    dedup_dropped = before_dedup - len(work_df_dedup)

    valid_clean_rows = len(work_df_dedup)
    total_rejected = rejected_missing_q + rejected_invalid_bloom + rejected_invalid_diff + dedup_dropped

    # Final label distributions
    final_bloom_dist = {}
    bloom_counts = work_df_dedup['normalized_bloom'].value_counts()
    for lvl in BLOOM_LEVELS:
        cnt = int(bloom_counts.get(lvl, 0))
        pct = round((cnt / valid_clean_rows * 100), 2) if valid_clean_rows > 0 else 0.0
        final_bloom_dist[lvl] = {'count': cnt, 'percentage': pct}

    final_diff_dist = {}
    diff_counts = work_df_dedup['normalized_difficulty'].value_counts()
    for diff in DIFFICULTY_LEVELS:
        cnt = int(diff_counts.get(diff, 0))
        pct = round((cnt / valid_clean_rows * 100), 2) if valid_clean_rows > 0 else 0.0
        final_diff_dist[diff] = {'count': cnt, 'percentage': pct}

    # Subject & topic diversity
    subject_diversity = {}
    if 'subject' in work_df_dedup.columns:
        subj_counts = work_df_dedup['subject'].astype(str).value_counts()
        subject_diversity = {
            'unique_subjects': int(work_df_dedup['subject'].nunique()),
            'distribution': {str(k): int(v) for k, v in subj_counts.head(15).items()}
        }

    topic_diversity = {}
    if 'topic' in work_df_dedup.columns:
        topic_counts = work_df_dedup['topic'].astype(str).value_counts()
        topic_diversity = {
            'unique_topics': int(work_df_dedup['topic'].nunique()),
            'top_topics': {str(k): int(v) for k, v in topic_counts.head(15).items()}
        }

    # Training feasibility
    bloom_trainable = all(final_bloom_dist[lvl]['count'] >= 50 for lvl in BLOOM_LEVELS)
    difficulty_trainable = all(final_diff_dist[diff]['count'] >= 50 for diff in DIFFICULTY_LEVELS)

    report = {
        'success': True,
        'dataset_source': 'Hugging Face Uzaib52/edubloom-question-bank',
        'file_path': path,
        'total_rows_inspected': total_rows,
        'valid_usable_rows': valid_clean_rows,
        'total_rejected_rows': total_rejected,
        'duplicate_rows_in_source': duplicate_rows_full,
        'duplicate_questions_dropped': dedup_dropped,
        'rejection_breakdown': {
            'missing_or_empty_question': rejected_missing_q,
            'unmapped_or_invalid_bloom': rejected_invalid_bloom,
            'unmapped_or_invalid_difficulty': rejected_invalid_diff,
            'duplicate_questions': dedup_dropped
        },
        'columns_found': columns_found,
        'missing_stats_by_column': missing_stats,
        'raw_bloom_distribution': {str(k): int(v) for k, v in raw_bloom_counts.items()},
        'mapped_bloom_distribution': final_bloom_dist,
        'raw_difficulty_distribution': {str(k): int(v) for k, v in raw_diff_counts.items()},
        'mapped_difficulty_distribution': final_diff_dist,
        'subject_diversity': subject_diversity,
        'topic_diversity': topic_diversity,
        'l_code_mapping_verified': {
            'L1 -> Remember': final_bloom_dist.get('Remember', {}).get('count', 0),
            'L2 -> Understand': final_bloom_dist.get('Understand', {}).get('count', 0),
            'L3 -> Apply': final_bloom_dist.get('Apply', {}).get('count', 0),
            'L4 -> Analyze': final_bloom_dist.get('Analyze', {}).get('count', 0),
            'L5 -> Evaluate': final_bloom_dist.get('Evaluate', {}).get('count', 0),
            'L6 -> Create': final_bloom_dist.get('Create', {}).get('count', 0)
        },
        'training_feasibility': {
            'bloom_classification_ready': bloom_trainable,
            'difficulty_classification_ready': difficulty_trainable,
            'recommended_action': 'Eligible for candidate model training (unpromoted).'
        },
        'curriculum_alignment_guard': {
            'board_tag_applied': 'General / EduBloom',
            'verified_state': False,
            'state_board_isolation_enforced': True,
            'note': 'EduBloom questions will never be labeled as Tamil Nadu State Board or mixed into State Board question bank without manual curriculum verification.'
        },
        'inspected_at': datetime.now(timezone.utc).isoformat()
    }

    # Save validation report
    try:
        os.makedirs(Config.REPORTS_DIR, exist_ok=True)
        with open(EDUBLOOM_REPORT_PATH, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: could not write edubloom report to disk: {e}")

    return report


def get_edubloom_clean_dataframe(csv_path: str = None) -> pd.DataFrame:
    """
    Returns a cleaned, normalized DataFrame of the EduBloom dataset with:
    - Valid, deduplicated question texts.
    - L1-L6 mapped to Remember, Understand, Apply, Analyze, Evaluate, Create.
    - Difficulty mapped to Easy, Medium, Hard.
    - Explicit board='General / EduBloom' and verified=False tags.
    """
    path = csv_path or EDUBLOOM_CSV_PATH
    if not os.path.exists(path):
        raise FileNotFoundError(f"EduBloom CSV not found at {path}")

    df = pd.read_csv(path)

    # Filter non-null questions
    valid_mask = df['question'].notna() & (df['question'].astype(str).str.strip() != '') & (df['question'].astype(str).str.strip().str.lower() != 'nan')
    df = df[valid_mask].copy()

    # Map bloom
    df['bloom_level'] = df['bloom_level'].astype(str).str.strip().str.lower().map(L_CODE_TO_BLOOM)
    df = df[df['bloom_level'].isin(BLOOM_LEVELS)].copy()

    # Map difficulty
    df['difficulty'] = df['difficulty'].astype(str).str.strip().str.lower().map(DIFFICULTY_MAP)
    df = df[df['difficulty'].isin(DIFFICULTY_LEVELS)].copy()

    # Deduplicate question text
    df = df.drop_duplicates(subset=['question'], keep='first').reset_index(drop=True)

    # Enforce isolation metadata
    df['board'] = 'General / EduBloom'
    df['verified'] = False
    df['source'] = 'EduBloom Question Bank (Hugging Face)'

    return df


def optionally_stage_edubloom_into_db(
    csv_path: str = None,
    max_rows: int = 5000,
    user_id: int = None
) -> dict:
    """
    Optionally stages validated EduBloom questions into the database.
    STRICT SAFETY GUARANTEES:
    - Never labels them as 'Tamil Nadu State Board' (labels as 'General / EduBloom').
    - Sets verified=False so they cannot be picked by Tamil Nadu State Board exam generator.
    - Skips questions that already exist in the database.
    - Does not modify existing Tamil Nadu State Board questions.
    """
    db = SessionLocal()
    try:
        df = get_edubloom_clean_dataframe(csv_path)

        existing_texts = set(
            q[0].strip().lower() for q in db.query(Question.question).all() if q[0]
        )

        inserted_count = 0
        skipped_count = 0

        for idx, row in df.iterrows():
            if max_rows and max_rows > 0 and inserted_count >= max_rows:
                break

            q_text = str(row['question']).strip()
            if q_text.lower() in existing_texts:
                skipped_count += 1
                continue

            qid = f"EDUBLOOM_{row.get('question_id', f'ROW_{idx+1}')}"
            # Check if qid already exists
            if db.query(Question).filter_by(question_id=qid).first():
                qid = f"EDUBLOOM_STAGED_{idx+1}_{int(datetime.now().timestamp())}"

            q = Question(
                question_id=qid,
                question=q_text,
                subject=str(row.get('subject', 'General')),
                topic=str(row.get('topic', 'General')),
                board='General / EduBloom',  # STRICT ISOLATION: Never 'Tamil Nadu State Board'
                class_grade=None,  # Not aligned to Samacheer Kalvi classes
                question_type=str(row.get('question_type', 'Short Answer')),
                marks=None,
                bloom_level=row['bloom_level'],
                difficulty=row['difficulty'],
                source='EduBloom Question Bank (Hugging Face)',
                verified=False  # STRICT ISOLATION: Not verified for TN State Board
            )
            db.add(q)
            existing_texts.add(q_text.lower())
            inserted_count += 1

            if inserted_count % 500 == 0:
                db.commit()

        db.commit()

        # Audit log
        entry = AuditLog(
            user_id=user_id,
            action="STAGE_EDUBLOOM_QUESTIONS",
            entity_type="Question",
            entity_id=f"staged_{inserted_count}",
            details={
                'inserted': inserted_count,
                'skipped_duplicates': skipped_count,
                'board': 'General / EduBloom',
                'verified': False
            }
        )
        db.add(entry)
        db.commit()

        return {
            'success': True,
            'inserted_count': inserted_count,
            'skipped_duplicates': skipped_count,
            'board_tag': 'General / EduBloom',
            'verified': False,
            'message': f"Successfully staged {inserted_count} EduBloom questions with board='General / EduBloom' (unverified)."
        }
    except Exception as e:
        db.rollback()
        return {'success': False, 'error': str(e)}
    finally:
        db.close()
