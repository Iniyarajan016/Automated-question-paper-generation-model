"""
Intelligent Question Selection Service
Handles filtering, selection, and validation of question papers.
"""

import random
from collections import Counter


def select_questions(
    available_questions,
    num_questions=None,
    total_marks=None,
    subject=None,
    topic=None,
    board=None,
    class_grade=None,
    question_type=None,
    bloom_level=None,
    difficulty=None,
    seed=None
):
    """
    Select questions based on teacher requirements.
    
    Args:
        available_questions: list of question dicts
        num_questions: desired number of questions
        total_marks: desired total marks
        subject, topic, board, class_grade, question_type: filters
        bloom_level: specific Bloom level or None for any
        difficulty: specific difficulty or None for any
        seed: random seed for reproducibility
    
    Returns:
        dict with selected questions, validation info, and any warnings
    """
    if seed is not None:
        random.seed(seed)
    
    warnings = []
    
    # Step 1: Filter eligible questions
    eligible = list(available_questions)
    
    filters_applied = []
    
    if subject:
        eligible = [q for q in eligible if q.get('subject', '').lower() == subject.lower()]
        filters_applied.append(f"subject={subject}")
    
    if topic:
        eligible = [q for q in eligible if q.get('topic', '').lower() == topic.lower()]
        filters_applied.append(f"topic={topic}")
    
    if board:
        eligible = [q for q in eligible if q.get('board', '').lower() == board.lower()]
        filters_applied.append(f"board={board}")
    
    if class_grade:
        eligible = [q for q in eligible if str(q.get('class_grade', '')).lower() == str(class_grade).lower()]
        filters_applied.append(f"class_grade={class_grade}")
    
    if question_type:
        eligible = [q for q in eligible if q.get('question_type', '').lower() == question_type.lower()]
        filters_applied.append(f"question_type={question_type}")
    
    if bloom_level:
        eligible = [q for q in eligible if q.get('bloom_level', '').lower() == bloom_level.lower()]
        filters_applied.append(f"bloom_level={bloom_level}")
    
    if difficulty:
        eligible = [q for q in eligible if q.get('difficulty', '').lower() == difficulty.lower()]
        filters_applied.append(f"difficulty={difficulty}")
    
    if not eligible:
        # Provide suggestions
        suggestions = []
        if bloom_level:
            suggestions.append("Try removing the Bloom level filter")
        if difficulty:
            suggestions.append("Try removing the difficulty filter")
        if topic:
            suggestions.append("Try removing the topic filter or selecting a broader topic")
        
        return {
            'success': False,
            'error': 'No questions match the selected criteria',
            'filters_applied': filters_applied,
            'eligible_count': 0,
            'suggestions': suggestions,
            'selected_questions': [],
        }
    
    # Step 2: Determine how many to select
    requested_count = num_questions or len(eligible)
    
    if requested_count > len(eligible):
        warnings.append(
            f"Requested {requested_count} questions but only {len(eligible)} are eligible. "
            f"Selecting all {len(eligible)} available questions."
        )
        requested_count = len(eligible)
    
    # Step 3: Select questions (shuffle for variety)
    shuffled = list(eligible)
    random.shuffle(shuffled)
    selected = shuffled[:requested_count]
    
    # Step 4: Validate total marks if required
    actual_total = 0
    marks_assigned = 0
    marks_missing = 0
    
    for q in selected:
        m = q.get('marks')
        if m is not None and m > 0:
            actual_total += m
            marks_assigned += 1
        else:
            marks_missing += 1
    
    marks_validation = {
        'questions_with_marks': marks_assigned,
        'questions_without_marks': marks_missing,
        'actual_total_marks': actual_total,
    }
    
    if total_marks and marks_missing > 0:
        # Distribute remaining marks evenly among unassigned questions
        remaining = total_marks - actual_total
        if remaining > 0 and marks_missing > 0:
            per_question = round(remaining / marks_missing, 1)
            for q in selected:
                if q.get('marks') is None or q.get('marks', 0) <= 0:
                    q['marks'] = per_question
                    actual_total += per_question
            warnings.append(
                f"{marks_missing} questions had no marks assigned. "
                f"Auto-assigned {per_question} marks each to reach target of {total_marks}."
            )
            marks_validation['auto_assigned_marks'] = per_question
    
    if total_marks:
        marks_validation['requested_total'] = total_marks
        marks_validation['matches_target'] = abs(actual_total - total_marks) < 0.5
        if not marks_validation['matches_target']:
            warnings.append(
                f"Total marks ({actual_total}) does not exactly match requested ({total_marks}). "
                f"Difference: {abs(actual_total - total_marks):.1f}"
            )
    
    # Step 5: Compute distribution stats
    bloom_dist = Counter(q.get('bloom_level', 'Unknown') for q in selected)
    diff_dist = Counter(q.get('difficulty', 'Unknown') for q in selected)
    type_dist = Counter(q.get('question_type', 'Unknown') for q in selected)
    
    return {
        'success': True,
        'selected_questions': selected,
        'count': len(selected),
        'total_marks': actual_total,
        'filters_applied': filters_applied,
        'eligible_count': len(eligible),
        'marks_validation': marks_validation,
        'bloom_distribution': dict(bloom_dist),
        'difficulty_distribution': dict(diff_dist),
        'question_type_distribution': dict(type_dist),
        'warnings': warnings,
        'seed': seed,
    }
