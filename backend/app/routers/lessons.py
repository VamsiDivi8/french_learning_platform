from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Lesson, Vocabulary, QuizQuestion
from app.schemas import LessonDetail, VocabularyResponse, QuizQuestionResponse

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("/{lesson_id}", response_model=LessonDetail)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Get a single lesson with vocabulary and quiz questions."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    vocabulary = [
        VocabularyResponse.model_validate(v)
        for v in lesson.vocabulary
    ]

    quiz_questions = [
        QuizQuestionResponse(
            id=q.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
        )
        for q in lesson.quiz_questions
    ]

    return LessonDetail(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        video_url=lesson.video_url,
        duration_minutes=lesson.duration_minutes,
        order=lesson.order,
        vocabulary=vocabulary,
        quiz_questions=quiz_questions,
    )
