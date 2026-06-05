from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    User, Course, Module, Lesson, Vocabulary, QuizQuestion,
    Enrollment, QuizResult, LessonProgress, Certificate
)
from app.auth_deps import get_current_teacher
from app.schemas import LessonCreate, VocabularyCreate, QuizQuestionCreate

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


# ── GET teacher dashboard analytics & roster ──────────
@router.get("/dashboard")
def get_teacher_dashboard(
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Retrieve students progress reports, enrollments, and platform statistics."""
    # 1. Calculate general stats
    total_students = db.query(User).filter(User.role == "student").count()
    total_enrollments = db.query(Enrollment).count()
    total_certificates = db.query(Certificate).count()
    
    # Calculate average quiz score across all quiz results
    avg_score = db.query(func.avg(QuizResult.score)).scalar()
    avg_score_rounded = round(avg_score, 1) if avg_score is not None else 0.0

    # 2. Get students roster
    students = db.query(User).filter(User.role == "student").all()
    student_list = []
    
    for student in students:
        courses_progress = []
        for enrollment in student.enrollments:
            course = enrollment.course
            
            # Count total lessons in this course
            total_lessons = sum(len(m.lessons) for m in course.modules)
            
            # Count student completed lessons in this course
            lesson_ids = [l.id for m in course.modules for l in m.lessons]
            completed_lessons = 0
            
            if lesson_ids:
                completed_lessons = (
                    db.query(LessonProgress)
                    .filter(
                        LessonProgress.student_id == student.id,
                        LessonProgress.lesson_id.in_(lesson_ids),
                        LessonProgress.completed == True
                    )
                    .count()
                )
            
            pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            
            # Check certificate status
            has_cert = (
                db.query(Certificate)
                .filter(Certificate.student_id == student.id, Certificate.course_id == course.id)
                .first() is not None
            )
            
            courses_progress.append({
                "course_id": course.id,
                "course_title": course.title,
                "level": course.level,
                "completed_lessons": completed_lessons,
                "total_lessons": total_lessons,
                "progress_percentage": round(pct, 1),
                "has_certificate": has_cert
            })
            
        student_list.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "courses": courses_progress
        })

    return {
        "statistics": {
            "total_students": total_students,
            "total_enrollments": total_enrollments,
            "total_certificates": total_certificates,
            "average_quiz_score": avg_score_rounded
        },
        "students": student_list
    }


# ── POST add a lesson ─────────────────────────────────
@router.post("/lessons")
def create_lesson(
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Add a new lesson to a course module."""
    module = db.query(Module).filter(Module.id == lesson_in.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    # Get max order to append to the end of the module
    max_order = (
        db.query(func.max(Lesson.order))
        .filter(Lesson.module_id == lesson_in.module_id)
        .scalar()
    ) or 0

    new_lesson = Lesson(
        module_id=lesson_in.module_id,
        title=lesson_in.title,
        description=lesson_in.description,
        video_url=lesson_in.video_url,
        duration_minutes=lesson_in.duration_minutes,
        order=max_order + 1
    )
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return {
        "message": "Lesson created successfully",
        "id": new_lesson.id,
        "title": new_lesson.title,
        "order": new_lesson.order
    }


# ── POST add a vocabulary card ────────────────────────
@router.post("/vocabulary")
def create_vocab(
    vocab_in: VocabularyCreate,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Add a new vocabulary card to a lesson."""
    lesson = db.query(Lesson).filter(Lesson.id == vocab_in.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    new_vocab = Vocabulary(
        lesson_id=vocab_in.lesson_id,
        french_word=vocab_in.french_word,
        english_meaning=vocab_in.english_meaning,
        audio_url=vocab_in.audio_url,
        example_sentence=vocab_in.example_sentence
    )
    db.add(new_vocab)
    db.commit()
    db.refresh(new_vocab)
    return {
        "message": "Vocabulary card created successfully",
        "id": new_vocab.id,
        "french_word": new_vocab.french_word
    }


# ── POST add a quiz question ─────────────────────────
@router.post("/quizzes")
def create_quiz_question(
    quiz_in: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Add a new quiz question to a lesson."""
    lesson = db.query(Lesson).filter(Lesson.id == quiz_in.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    if quiz_in.correct_answer.lower() not in ["a", "b", "c", "d"]:
        raise HTTPException(status_code=400, detail="Correct answer must be 'a', 'b', 'c', or 'd'")

    new_q = QuizQuestion(
        lesson_id=quiz_in.lesson_id,
        question=quiz_in.question,
        option_a=quiz_in.option_a,
        option_b=quiz_in.option_b,
        option_c=quiz_in.option_c,
        option_d=quiz_in.option_d,
        correct_answer=quiz_in.correct_answer.lower()
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return {
        "message": "Quiz question created successfully",
        "id": new_q.id
    }
