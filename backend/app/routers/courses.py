from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Course, Module, Lesson
from app.schemas import CourseResponse, CourseDetail, ModuleWithLessons, LessonBrief

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    """Get all available courses."""
    courses = db.query(Course).all()
    return courses


@router.get("/{course_id}", response_model=CourseDetail)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get a single course with its modules and lessons."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Build the response with module and lesson counts
    modules_with_lessons = []
    total_lessons = 0

    for module in course.modules:
        lessons = [
            LessonBrief(
                id=lesson.id,
                title=lesson.title,
                order=lesson.order,
                duration_minutes=lesson.duration_minutes,
            )
            for lesson in module.lessons
        ]
        total_lessons += len(lessons)
        modules_with_lessons.append(
            ModuleWithLessons(
                id=module.id,
                title=module.title,
                order=module.order,
                lesson_count=len(lessons),
                lessons=lessons,
            )
        )

    return CourseDetail(
        id=course.id,
        title=course.title,
        level=course.level,
        track=course.track,
        description=course.description,
        image_url=course.image_url,
        modules=modules_with_lessons,
        total_lessons=total_lessons,
    )
