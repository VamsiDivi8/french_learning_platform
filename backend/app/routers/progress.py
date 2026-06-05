from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import (
    QuizQuestion, QuizResult, LessonProgress, Enrollment,
    Lesson, Module, Course, Certificate, User
)
from app.auth_deps import get_current_user
from app.schemas import QuizSubmission, QuizResultResponse

router = APIRouter(prefix="/api/progress", tags=["progress"])


# ── Enroll in a course ────────────────────────────────
@router.post("/enroll/{course_id}")
def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enroll the current student in a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == current_user.id, Enrollment.course_id == course_id)
        .first()
    )
    if existing:
        return {"message": "Already enrolled", "enrolled": True}

    enrollment = Enrollment(student_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    return {"message": "Enrolled successfully", "enrolled": True}


# ── Mark lesson as complete ───────────────────────────
@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a lesson as completed for the current student."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    existing = (
        db.query(LessonProgress)
        .filter(LessonProgress.student_id == current_user.id, LessonProgress.lesson_id == lesson_id)
        .first()
    )
    if existing:
        if not existing.completed:
            existing.completed = True
            existing.completed_at = datetime.now(timezone.utc)
            db.commit()
        return {"message": "Lesson completed", "completed": True}

    progress = LessonProgress(
        student_id=current_user.id,
        lesson_id=lesson_id,
        completed=True,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(progress)
    db.commit()
    return {"message": "Lesson completed", "completed": True}


# ── Submit quiz answers ───────────────────────────────
@router.post("/quizzes/{lesson_id}/submit", response_model=QuizResultResponse)
def submit_quiz(
    lesson_id: int,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit quiz answers and get scored results."""
    questions = db.query(QuizQuestion).filter(QuizQuestion.lesson_id == lesson_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No quiz found for this lesson")

    total = len(questions)
    correct = 0

    for q in questions:
        student_answer = submission.answers.get(q.id)
        if student_answer and student_answer.lower() == q.correct_answer.lower():
            correct += 1

    score = (correct / total) * 100 if total > 0 else 0
    passed = score >= 70  # 70% pass threshold

    # Save result (replace previous attempt)
    existing = (
        db.query(QuizResult)
        .filter(QuizResult.student_id == current_user.id, QuizResult.lesson_id == lesson_id)
        .first()
    )
    if existing:
        existing.score = score
        existing.total_questions = total
        existing.correct_answers = correct
        existing.completed_at = datetime.now(timezone.utc)
    else:
        result = QuizResult(
            student_id=current_user.id,
            lesson_id=lesson_id,
            score=score,
            total_questions=total,
            correct_answers=correct,
        )
        db.add(result)

    # Auto-complete the lesson if quiz is passed
    if passed:
        lesson_progress = (
            db.query(LessonProgress)
            .filter(LessonProgress.student_id == current_user.id, LessonProgress.lesson_id == lesson_id)
            .first()
        )
        if not lesson_progress:
            lesson_progress = LessonProgress(
                student_id=current_user.id,
                lesson_id=lesson_id,
                completed=True,
                completed_at=datetime.now(timezone.utc),
            )
            db.add(lesson_progress)
        elif not lesson_progress.completed:
            lesson_progress.completed = True
            lesson_progress.completed_at = datetime.now(timezone.utc)

    db.commit()

    return QuizResultResponse(
        score=round(score, 1),
        total_questions=total,
        correct_answers=correct,
        passed=passed,
    )


# ── Get progress for all enrolled courses ─────────────
@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the student's enrolled courses with progress data."""
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == current_user.id)
        .all()
    )

    courses_progress = []
    for enrollment in enrollments:
        course = enrollment.course

        # Count total lessons in this course
        total_lessons = 0
        for module in course.modules:
            total_lessons += len(module.lessons)

        # Count completed lessons
        lesson_ids = []
        for module in course.modules:
            for lesson in module.lessons:
                lesson_ids.append(lesson.id)

        completed_lessons = (
            db.query(LessonProgress)
            .filter(
                LessonProgress.student_id == current_user.id,
                LessonProgress.lesson_id.in_(lesson_ids),
                LessonProgress.completed == True,
            )
            .count()
        )

        progress_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0

        # Check if certificate exists
        certificate = (
            db.query(Certificate)
            .filter(Certificate.student_id == current_user.id, Certificate.course_id == course.id)
            .first()
        )

        courses_progress.append({
            "course_id": course.id,
            "course_title": course.title,
            "level": course.level,
            "track": course.track,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "progress_percentage": round(progress_pct, 1),
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "has_certificate": certificate is not None,
        })

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        },
        "courses": courses_progress,
    }


# ── Generate certificate ──────────────────────────────
@router.post("/certificates/{course_id}")
def generate_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a certificate if the course is 100% complete."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check enrollment
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == current_user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Count completion
    total_lessons = 0
    lesson_ids = []
    for module in course.modules:
        for lesson in module.lessons:
            total_lessons += 1
            lesson_ids.append(lesson.id)

    completed = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.student_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.completed == True,
        )
        .count()
    )

    if completed < total_lessons:
        raise HTTPException(
            status_code=400,
            detail=f"Course not complete. {completed}/{total_lessons} lessons done.",
        )

    # Check if certificate already exists
    existing = (
        db.query(Certificate)
        .filter(Certificate.student_id == current_user.id, Certificate.course_id == course_id)
        .first()
    )
    if existing:
        return {
            "certificate_id": existing.id,
            "student_name": current_user.name,
            "course_title": course.title,
            "level": course.level,
            "issue_date": existing.issue_date.isoformat(),
            "already_existed": True,
        }

    # Create certificate
    cert = Certificate(student_id=current_user.id, course_id=course_id)
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {
        "certificate_id": cert.id,
        "student_name": current_user.name,
        "course_title": course.title,
        "level": course.level,
        "issue_date": cert.issue_date.isoformat(),
        "already_existed": False,
    }


# ── Get certificate data ─────────────────────────────
@router.get("/certificates/{course_id}")
def get_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get certificate details for display/download."""
    cert = (
        db.query(Certificate)
        .filter(Certificate.student_id == current_user.id, Certificate.course_id == course_id)
        .first()
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    course = db.query(Course).filter(Course.id == course_id).first()

    return {
        "certificate_id": cert.id,
        "student_name": current_user.name,
        "course_title": course.title,
        "level": course.level,
        "issue_date": cert.issue_date.isoformat(),
    }
