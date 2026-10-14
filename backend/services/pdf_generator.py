"""
PDF Generation Service using ReportLab for Tamil Nadu State Board (Classes 6–12)
Produces formal, printable examination papers and teacher summaries.
"""

import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable
)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config

NAVY = HexColor('#1e3a5f')
DARK_BLUE = HexColor('#2c5282')
LIGHT_BG = HexColor('#f7fafc')
BORDER_GRAY = HexColor('#cbd5e0')
ACCENT = HexColor('#2b6cb0')


def create_styles():
    """Create custom paragraph styles for formal state board examination papers."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='BoardHeader',
        parent=styles['Normal'],
        fontSize=12,
        textColor=DARK_BLUE,
        spaceAfter=2,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        name='ExamTitle',
        parent=styles['Title'],
        fontSize=16,
        textColor=NAVY,
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        name='ExamSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=DARK_BLUE,
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica',
    ))

    styles.add(ParagraphStyle(
        name='MetaKey',
        parent=styles['Normal'],
        fontSize=10,
        textColor=NAVY,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name='MetaVal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#2d3748'),
        fontName='Helvetica',
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=4,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        name='SectionInstruction',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#4a5568'),
        spaceBefore=2,
        spaceAfter=6,
        fontName='Helvetica-Oblique',
    ))

    styles.add(ParagraphStyle(
        name='QuestionText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceBefore=6,
        spaceAfter=2,
        fontName='Helvetica',
        alignment=TA_LEFT,
    ))

    styles.add(ParagraphStyle(
        name='MarksText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=DARK_BLUE,
        alignment=TA_RIGHT,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        name='InstructionText',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        spaceBefore=1,
        spaceAfter=1,
        fontName='Helvetica',
        leftIndent=12,
    ))

    styles.add(ParagraphStyle(
        name='FooterText',
        parent=styles['Normal'],
        fontSize=8,
        textColor=HexColor('#718096'),
        alignment=TA_CENTER,
        fontName='Helvetica',
    ))

    return styles


def generate_exam_pdf(
    paper_data,
    questions,
    output_dir=None,
    sections=None,
    include_teacher_labels=False
):
    """
    Generate a formatted Tamil Nadu State Board examination paper PDF.
    """
    if output_dir is None:
        output_dir = Config.GENERATED_PAPERS_DIR
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_title = "".join(c for c in paper_data.get('title', 'exam') if c.isalnum() or c in ' _-')[:40]
    filename = f"tnsb_{safe_title.replace(' ', '_')}_{timestamp}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
    )

    styles = create_styles()
    story = []

    # --- Header ---
    story.append(Paragraph("TAMIL NADU STATE BOARD — SAMACHEER KALVI", styles['BoardHeader']))
    exam_title = paper_data.get('title', 'Terminal Examination')
    story.append(Paragraph(exam_title.upper(), styles['ExamTitle']))

    # Meta table
    class_val = paper_data.get('class_grade', 'Class 10')
    subject_val = paper_data.get('subject', 'Mathematics')
    duration_min = paper_data.get('duration_minutes', 90)
    dur_str = f"{duration_min // 60}h {duration_min % 60}m" if duration_min >= 60 else f"{duration_min} Mins"
    max_marks = paper_data.get('total_marks', sum(q.get('marks', 0) for q in questions))

    meta_table_data = [
        [
            Paragraph(f"<b>Class:</b> {class_val}", styles['MetaVal']),
            Paragraph(f"<b>Subject:</b> {subject_val}", styles['MetaVal']),
            Paragraph(f"<b>Time Allowed:</b> {dur_str}", styles['MetaVal']),
            Paragraph(f"<b>Maximum Marks:</b> {max_marks}", styles['MetaVal']),
        ]
    ]

    meta_table = Table(meta_table_data, colWidths=[4.5 * cm, 5.0 * cm, 4.0 * cm, 4.5 * cm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_GRAY),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))

    story.append(Spacer(1, 4))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # General Instructions
    story.append(HRFlowable(width="100%", color=NAVY, thickness=1.5))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>GENERAL INSTRUCTIONS:</b>", styles['MetaKey']))

    instructions = [
        "Check that the question paper contains all pages and all questions are printed legibly.",
        "Candidate should write the Register Number clearly on the answer booklet.",
        "Marks for each question or section are indicated against the respective items.",
        "Rough work should be done in the designated margins or rough sheets provided."
    ]
    if paper_data.get('topic'):
        instructions.append(f"Portions covered: {paper_data['topic']}")

    for inst in instructions:
        story.append(Paragraph(f"• {inst}", styles['InstructionText']))

    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", color=BORDER_GRAY, thickness=1))

    # --- Questions and Sections ---
    # If explicit sections were passed, use them; otherwise organize by marks
    if not sections:
        # Build sections dynamically
        s_a = [q for q in questions if (q.get('marks') or 2) <= 1.5]
        s_b = [q for q in questions if 1.5 < (q.get('marks') or 2) <= 3.5]
        s_c = [q for q in questions if (q.get('marks') or 2) > 3.5]

        sections = []
        if s_a:
            sections.append({
                'name': 'SECTION A (Objective & Very Short Answer)',
                'instructions': 'Answer all questions. Each question carries 1 mark.',
                'questions': s_a
            })
        if s_b:
            sections.append({
                'name': 'SECTION B (Short Answer & Conceptual)',
                'instructions': 'Answer all questions. Each question carries 2 or 3 marks as indicated.',
                'questions': s_b
            })
        if s_c:
            sections.append({
                'name': 'SECTION C (Long Answer & Descriptive)',
                'instructions': 'Answer all questions in detail with necessary diagrams/working. Each carries 5 marks.',
                'questions': s_c
            })
        if not sections:
            sections.append({
                'name': 'ALL SECTIONS',
                'instructions': 'Answer all questions.',
                'questions': questions
            })

    q_global_num = 1
    for sec in sections:
        story.append(Spacer(1, 6))
        story.append(Paragraph(sec.get('name', 'SECTION'), styles['SectionHeader']))
        if sec.get('instructions'):
            story.append(Paragraph(sec['instructions'], styles['SectionInstruction']))

        for q in sec.get('questions', []):
            marks_val = q.get('marks', 2.0)
            marks_str = f"[{int(marks_val) if marks_val == int(marks_val) else marks_val}]"

            q_text = q.get('question', '').strip()
            num = q.get('display_number', q_global_num)
            q_global_num += 1

            # Format question row as a 2-column table: Question on left, Marks on right
            row_data = [
                [
                    Paragraph(f"<b>{num}.</b>  {q_text}", styles['QuestionText']),
                    Paragraph(marks_str, styles['MarksText'])
                ]
            ]
            q_table = Table(row_data, colWidths=[16.5 * cm, 1.5 * cm])
            q_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(q_table)

            if include_teacher_labels:
                lbls = []
                if q.get('bloom_level'):
                    lbls.append(f"Bloom: {q['bloom_level']}")
                if q.get('difficulty'):
                    lbls.append(f"Difficulty: {q['difficulty']}")
                if lbls:
                    story.append(Paragraph(f"<font color='#718096' size='8'><i>({', '.join(lbls)})</i></font>", styles['InstructionText']))

    # --- Footer ---
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", color=NAVY, thickness=1.5))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"TAMIL NADU STATE BOARD CURRICULUM — TOTAL QUESTIONS: {len(questions)} | MAXIMUM MARKS: {max_marks}",
        styles['FooterText']
    ))
    story.append(Paragraph("ExamForge AI Evaluation & Examination Management System", styles['FooterText']))

    doc.build(story)
    return filepath, filename


def generate_teacher_summary_pdf(paper_data, questions, output_dir=None):
    """Generate summary PDF for teachers."""
    return generate_exam_pdf(paper_data, questions, output_dir=output_dir, include_teacher_labels=True)
