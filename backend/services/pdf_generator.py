"""
PDF Generation Service using ReportLab
Generates downloadable examination papers and teacher summaries.
"""

import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config


# Color scheme
NAVY = HexColor('#1e3a5f')
DARK_BLUE = HexColor('#2c5282')
LIGHT_GRAY = HexColor('#f7fafc')
BORDER_GRAY = HexColor('#e2e8f0')
ACCENT = HexColor('#3182ce')


def create_styles():
    """Create custom paragraph styles."""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='ExamTitle',
        parent=styles['Title'],
        fontSize=18,
        textColor=NAVY,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    ))
    
    styles.add(ParagraphStyle(
        name='ExamSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=DARK_BLUE,
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica',
    ))
    
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=NAVY,
        spaceBefore=16,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        borderWidth=1,
        borderColor=BORDER_GRAY,
        borderPadding=4,
    ))
    
    styles.add(ParagraphStyle(
        name='QuestionText',
        parent=styles['Normal'],
        fontSize=11,
        leading=15,
        spaceBefore=8,
        spaceAfter=4,
        fontName='Helvetica',
        alignment=TA_JUSTIFY,
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
        fontSize=10,
        leading=14,
        spaceBefore=2,
        spaceAfter=2,
        fontName='Helvetica',
        leftIndent=20,
    ))
    
    styles.add(ParagraphStyle(
        name='FooterText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=DARK_BLUE,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique',
    ))
    
    return styles


def generate_exam_pdf(
    paper_data,
    questions,
    output_dir=None,
    include_teacher_labels=False
):
    """
    Generate a PDF examination paper.
    
    Args:
        paper_data: dict with title, board, class_grade, subject, total_marks, etc.
        questions: list of question dicts
        output_dir: directory to save PDF
        include_teacher_labels: if True, include Bloom/difficulty labels
    
    Returns:
        filepath of generated PDF
    """
    if output_dir is None:
        output_dir = Config.GENERATED_PAPERS_DIR
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_title = "".join(c for c in paper_data.get('title', 'exam') if c.isalnum() or c in ' _-')[:50]
    filename = f"exam_{safe_title.replace(' ', '_')}_{timestamp}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    # Build PDF
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )
    
    styles = create_styles()
    story = []
    
    # --- Header ---
    title = paper_data.get('title', 'Examination Paper')
    story.append(Paragraph(title, styles['ExamTitle']))
    
    subtitle_parts = []
    if paper_data.get('board'):
        subtitle_parts.append(paper_data['board'])
    if paper_data.get('class_grade'):
        subtitle_parts.append(f"Class {paper_data['class_grade']}")
    if paper_data.get('subject'):
        subtitle_parts.append(paper_data['subject'])
    
    if subtitle_parts:
        story.append(Paragraph(' | '.join(subtitle_parts), styles['ExamSubtitle']))
    
    # Date and marks line
    total_marks = paper_data.get('total_marks', sum(q.get('marks', 0) for q in questions))
    date_str = datetime.now().strftime('%d %B %Y')
    info_parts = [f"Date: {date_str}"]
    if total_marks:
        info_parts.append(f"Maximum Marks: {total_marks}")
    info_parts.append(f"Total Questions: {len(questions)}")
    
    story.append(Spacer(1, 8))
    story.append(Paragraph(' | '.join(info_parts), styles['ExamSubtitle']))
    
    # Divider
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", color=NAVY, thickness=2))
    story.append(Spacer(1, 8))
    
    # --- Instructions ---
    story.append(Paragraph("General Instructions:", styles['SectionHeader']))
    
    instructions = [
        "All questions are compulsory unless otherwise stated.",
        "Read each question carefully before answering.",
        "Marks for each question are indicated on the right side.",
        "Write neatly and legibly.",
    ]
    
    if paper_data.get('topic'):
        instructions.append(f"This paper covers the topic: {paper_data['topic']}.")
    
    for inst in instructions:
        story.append(Paragraph(f"• {inst}", styles['InstructionText']))
    
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", color=BORDER_GRAY, thickness=1))
    
    # --- Questions ---
    story.append(Paragraph("Questions", styles['SectionHeader']))
    
    for i, q in enumerate(questions, 1):
        marks = q.get('marks', '')
        marks_str = f"[{marks} marks]" if marks else ""
        
        # Question number and text
        q_text = f"<b>Q{i}.</b> {q.get('question', 'Question text not available')}"
        if marks_str:
            q_text += f"  <font color='#2c5282'><b>{marks_str}</b></font>"
        
        story.append(Paragraph(q_text, styles['QuestionText']))
        
        # Teacher-only labels (optional)
        if include_teacher_labels:
            labels = []
            if q.get('bloom_level'):
                labels.append(f"Bloom: {q['bloom_level']}")
            if q.get('difficulty'):
                labels.append(f"Difficulty: {q['difficulty']}")
            if labels:
                label_text = f"<i><font color='#718096' size='9'>({', '.join(labels)})</font></i>"
                story.append(Paragraph(label_text, styles['InstructionText']))
        
        story.append(Spacer(1, 6))
    
    # --- Footer ---
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", color=NAVY, thickness=2))
    story.append(Spacer(1, 8))
    
    total_computed = sum(q.get('marks', 0) for q in questions if q.get('marks'))
    story.append(Paragraph(
        f"<b>Total Marks: {total_computed}</b> | Questions: {len(questions)}",
        styles['ExamSubtitle']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Generated by ExamForge AI — Intelligent Assessments, Balanced Question Papers",
        styles['FooterText']
    ))
    
    # Build PDF
    doc.build(story)
    
    return filepath, filename


def generate_teacher_summary_pdf(paper_data, questions, output_dir=None):
    """
    Generate a teacher-facing summary with Bloom and difficulty distributions.
    """
    if output_dir is None:
        output_dir = Config.GENERATED_PAPERS_DIR
    
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"teacher_summary_{timestamp}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = create_styles()
    story = []
    
    story.append(Paragraph("Teacher Summary — " + paper_data.get('title', 'Exam'), styles['ExamTitle']))
    story.append(Spacer(1, 12))
    
    # Questions with labels
    for i, q in enumerate(questions, 1):
        text = (
            f"<b>Q{i}.</b> {q.get('question', '')[:100]}... "
            f"| Bloom: <b>{q.get('bloom_level', 'N/A')}</b> "
            f"| Difficulty: <b>{q.get('difficulty', 'N/A')}</b> "
            f"| Marks: <b>{q.get('marks', 'N/A')}</b>"
        )
        story.append(Paragraph(text, styles['QuestionText']))
    
    # Distribution tables
    from collections import Counter
    bloom_dist = Counter(q.get('bloom_level', 'N/A') for q in questions)
    diff_dist = Counter(q.get('difficulty', 'N/A') for q in questions)
    
    story.append(Spacer(1, 16))
    story.append(Paragraph("Bloom's Taxonomy Distribution", styles['SectionHeader']))
    bloom_data = [['Level', 'Count', 'Percentage']]
    for level, count in sorted(bloom_dist.items()):
        pct = f"{100 * count / len(questions):.1f}%"
        bloom_data.append([level, str(count), pct])
    
    bloom_table = Table(bloom_data, colWidths=[150, 80, 100])
    bloom_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), LIGHT_GRAY]),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(bloom_table)
    
    story.append(Spacer(1, 12))
    story.append(Paragraph("Difficulty Distribution", styles['SectionHeader']))
    diff_data = [['Level', 'Count', 'Percentage']]
    for level, count in sorted(diff_dist.items()):
        pct = f"{100 * count / len(questions):.1f}%"
        diff_data.append([level, str(count), pct])
    
    diff_table = Table(diff_data, colWidths=[150, 80, 100])
    diff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), LIGHT_GRAY]),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(diff_table)
    
    doc.build(story)
    return filepath, filename
