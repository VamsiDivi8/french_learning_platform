from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── Auth Schemas ──────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Course Schemas ────────────────────────────────────────────

class CourseResponse(BaseModel):
    id: int
    title: str
    level: str
    track: str
    description: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    id: int
    title: str
    order: int
    lesson_count: int = 0

    class Config:
        from_attributes = True


class LessonBrief(BaseModel):
    id: int
    title: str
    order: int
    duration_minutes: Optional[int] = None

    class Config:
        from_attributes = True


class ModuleWithLessons(ModuleResponse):
    lessons: list[LessonBrief] = []


class CourseDetail(CourseResponse):
    modules: list[ModuleWithLessons] = []
    total_lessons: int = 0


# ── Lesson Schemas ────────────────────────────────────────────

class VocabularyResponse(BaseModel):
    id: int
    french_word: str
    english_meaning: str
    audio_url: Optional[str] = None
    example_sentence: Optional[str] = None

    class Config:
        from_attributes = True


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    # NOTE: correct_answer is NOT included — client shouldn't see it

    class Config:
        from_attributes = True


class LessonDetail(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    order: int
    vocabulary: list[VocabularyResponse] = []
    quiz_questions: list[QuizQuestionResponse] = []

    class Config:
        from_attributes = True


# ── Quiz Schemas ──────────────────────────────────────────────

class QuizSubmission(BaseModel):
    answers: dict[int, str]  # {question_id: "a"/"b"/"c"/"d"}


class QuizResultResponse(BaseModel):
    score: float
    total_questions: int
    correct_answers: int
    passed: bool


# ── Progress Schemas ──────────────────────────────────────────

class ProgressResponse(BaseModel):
    course_id: int
    course_title: str
    total_lessons: int
    completed_lessons: int
    progress_percentage: float


# ── Health Check ──────────────────────────────────────────────

class HealthCheck(BaseModel):
    message: str
    status: str
    version: str


# ── Teacher Admin Schemas ─────────────────────────────────────

class LessonCreate(BaseModel):
    module_id: int
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None


class VocabularyCreate(BaseModel):
    lesson_id: int
    french_word: str
    english_meaning: str
    audio_url: Optional[str] = None
    example_sentence: Optional[str] = None


class QuizQuestionCreate(BaseModel):
    lesson_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str  # "a", "b", "c", or "d"


# ── Dictionary Schemas ────────────────────────────────────────

class DictionaryWordResponse(BaseModel):
    id: int
    word: str
    part_of_speech: Optional[str] = None
    translation: str
    definition: Optional[str] = None
    example_sentence_fr: Optional[str] = None
    example_sentence_en: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DictionaryWordCreate(BaseModel):
    word: str
    part_of_speech: Optional[str] = None
    translation: str
    definition: Optional[str] = None
    example_sentence_fr: Optional[str] = None
    example_sentence_en: Optional[str] = None
    audio_url: Optional[str] = None
