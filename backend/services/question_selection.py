"""
Intelligent Question Selection Service for Tamil Nadu State Board (Classes 6–12)
Handles strict curriculum constraints, Bloom's Taxonomy & Difficulty distribution,
multi-chapter selection, mark optimization, and sectioning.
"""

import random
from collections import Counter

VALID_TN_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']


def select_questions(
    available_questions,
    num_questions=None,
    total_marks=None,
    subject=None,
    topic=None,
    topics=None,
    board='Tamil Nadu State Board',
    class_grade=None,
    question_type=None,
    bloom_level=None,
    difficulty=None,
    difficulty_distribution=None,  # e.g., {'Easy': 30, 'Medium': 50, 'Hard': 20}
    bloom_distribution=None,        # e.g., {'Remember': 25, 'Understand': 35, ...}
    seed=None
):
    """
    Select questions based on teacher requirements with strict Tamil Nadu State Board constraints.
    """
    if seed is not None:
        random.seed(seed)
    
    warnings = []
    filters_applied = []

    # Step 1: Strict Board and Class Validation
    if board and board.lower() not in ['tamil nadu state board', 'samacheer kalvi', 'tamil nadu']:
        return {
            'success': False,
            'error': f"Unsupported educational board '{board}'. The application strictly supports Tamil Nadu State Board / Samacheer Kalvi.",
            'eligible_count': 0,
            'selected_questions': []
        }

    if class_grade and class_grade not in VALID_TN_CLASSES:
        return {
            'success': False,
            'error': f"Invalid Class '{class_grade}'. Only Classes 6 through 12 are supported for Tamil Nadu State Board.",
            'eligible_count': 0,
            'selected_questions': []
        }

    eligible = list(available_questions)

    # Filter to Tamil Nadu State Board only
    eligible = [q for q in eligible if str(q.get('board', '')).strip().lower() in [
        'tamil nadu state board', 'samacheer kalvi', 'tamil nadu', ''
    ]]
    filters_applied.append("board=Tamil Nadu State Board")

    if class_grade:
        eligible = [q for q in eligible if str(q.get('class_grade', '')).strip() == class_grade]
        filters_applied.append(f"class_grade={class_grade}")

    if subject:
        eligible = [q for q in eligible if str(q.get('subject', '')).strip().lower() == subject.strip().lower()]
        filters_applied.append(f"subject={subject}")

    # Topics / Chapters filtering
    all_topics = set()
    if topics and isinstance(topics, list):
        all_topics.update(t.strip().lower() for t in topics if t)
    if topic:
        all_topics.add(topic.strip().lower())

    if all_topics:
        eligible = [q for q in eligible if str(q.get('topic', '')).strip().lower() in all_topics]
        filters_applied.append(f"topics={list(all_topics)}")

    if question_type:
        eligible = [q for q in eligible if str(q.get('question_type', '')).strip().lower() == question_type.strip().lower()]
        filters_applied.append(f"question_type={question_type}")

    if bloom_level:
        eligible = [q for q in eligible if str(q.get('bloom_level', '')).strip().lower() == bloom_level.strip().lower()]
        filters_applied.append(f"bloom_level={bloom_level}")

    if difficulty:
        eligible = [q for q in eligible if str(q.get('difficulty', '')).strip().lower() == difficulty.strip().lower()]
        filters_applied.append(f"difficulty={difficulty}")

    if not eligible:
        return {
            'success': False,
            'error': f"No questions in the approved Tamil Nadu State Board question bank match the criteria: Class '{class_grade or 'Any'}', Subject '{subject or 'Any'}' with the specified chapters/filters.",
            'filters_applied': filters_applied,
            'eligible_count': 0,
            'suggestions': [
                "Select additional chapters from the syllabus",
                "Ensure question filters match the available topics in the curriculum",
                "Upload and ingest additional past papers via the Admin Dataset Management panel"
            ],
            'selected_questions': []
        }

    # Step 2: Determine target selection size
    target_count = num_questions or 10

    if target_count > len(eligible):
        warnings.append(
            f"Requested {target_count} questions, but only {len(eligible)} are available in the Tamil Nadu question bank for this criteria. "
            f"Selecting all {len(eligible)} eligible questions."
        )
        target_count = len(eligible)

    # Step 3: Distribution-aware selection
    selected = []
    shuffled_pool = list(eligible)
    random.shuffle(shuffled_pool)

    # If difficulty distribution is provided, partition and sample proportionally
    if difficulty_distribution and isinstance(difficulty_distribution, dict) and sum(difficulty_distribution.values()) > 0:
        total_pct = sum(difficulty_distribution.values())
        diff_buckets = {'Easy': [], 'Medium': [], 'Hard': []}
        for q in shuffled_pool:
            d = q.get('difficulty', 'Medium')
            diff_buckets.setdefault(d, []).append(q)

        sampled_ids = set()
        for diff_key, pct in difficulty_distribution.items():
            wanted = int(round((pct / total_pct) * target_count))
            avail = diff_buckets.get(diff_key, [])
            for q in avail[:wanted]:
                if q['id'] not in sampled_ids and len(selected) < target_count:
                    selected.append(q)
                    sampled_ids.add(q['id'])

        # Fill remaining slots from rest of pool
        for q in shuffled_pool:
            if len(selected) >= target_count:
                break
            if q['id'] not in sampled_ids:
                selected.append(q)
                sampled_ids.add(q['id'])
    else:
        selected = shuffled_pool[:target_count]

    # Step 4: Marks calculation & optimization
    actual_total = sum(q.get('marks') or 0 for q in selected)
    marks_missing = [q for q in selected if not q.get('marks') or q.get('marks') <= 0]

    if total_marks and marks_missing:
        remaining_marks = total_marks - (actual_total - sum(q.get('marks') or 0 for q in marks_missing))
        if remaining_marks > 0 and len(marks_missing) > 0:
            per_q = round(remaining_marks / len(marks_missing), 1)
            for q in marks_missing:
                q['marks'] = per_q
            actual_total = sum(q.get('marks') or 0 for q in selected)
            warnings.append(
                f"{len(marks_missing)} questions had no marks specified. "
                f"Assigned {per_q} marks each to reach target total of {total_marks} marks."
            )

    # Step 5: Structure into sections for printable paper
    # Section A: 1-mark (MCQs / Objectives)
    # Section B: 2-3 marks (Short Answer / Problem Solving)
    # Section C: 5+ marks (Long Answer / Essays)
    section_a = []
    section_b = []
    section_c = []

    for idx, q in enumerate(selected, start=1):
        m = q.get('marks') or 2.0
        q['display_number'] = idx
        if m <= 1.5:
            section_a.append(q)
        elif m <= 3.5:
            section_b.append(q)
        else:
            section_c.append(q)

    sections = []
    if section_a:
        sections.append({
            'name': 'SECTION A — OBJECTIVE & VERY SHORT ANSWER QUESTIONS',
            'instructions': 'Answer all questions. Each question carries 1 mark.',
            'questions': section_a,
            'marks_per_question': 1.0,
            'total_section_marks': sum(q.get('marks', 1.0) for q in section_a)
        })
    if section_b:
        sections.append({
            'name': 'SECTION B — SHORT ANSWER & CONCEPTUAL QUESTIONS',
            'instructions': 'Answer all questions. Each question carries 2 or 3 marks as indicated.',
            'questions': section_b,
            'total_section_marks': sum(q.get('marks', 2.0) for q in section_b)
        })
    if section_c:
        sections.append({
            'name': 'SECTION C — LONG ANSWER & DETAILED QUESTIONS',
            'instructions': 'Answer all questions with necessary diagrams and steps. Each question carries 5 marks.',
            'questions': section_c,
            'total_section_marks': sum(q.get('marks', 5.0) for q in section_c)
        })

    # Fallback to single section if marks are homogeneous
    if not sections:
        sections.append({
            'name': 'SECTION A — ALL QUESTIONS',
            'instructions': 'Answer all questions clearly.',
            'questions': selected,
            'total_section_marks': actual_total
        })

    bloom_dist = Counter(q.get('bloom_level', 'Unclassified') for q in selected)
    diff_dist = Counter(q.get('difficulty', 'Unclassified') for q in selected)
    type_dist = Counter(q.get('question_type', 'Short Answer') for q in selected)

    return {
        'success': True,
        'selected_questions': selected,
        'sections': sections,
        'count': len(selected),
        'total_marks': actual_total if actual_total > 0 else (target_count * 2.0),
        'filters_applied': filters_applied,
        'eligible_count': len(eligible),
        'bloom_distribution': dict(bloom_dist),
        'difficulty_distribution': dict(diff_dist),
        'question_type_distribution': dict(type_dist),
        'warnings': warnings,
        'seed': seed,
    }
