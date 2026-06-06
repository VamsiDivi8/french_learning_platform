from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import courses, auth, lessons, progress, teacher, dictionary
from app.seed import seed
import os

# Create all database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
try:
    seed()
except Exception as e:
    print(f"Error seeding database: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="French LMS API",
    description="A French language learning platform API",
    version="1.0.0",
)

# CORS — allow the React frontend to talk to us
allowed_origins = [
    "http://localhost:5173",    # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",    # Fallback
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(progress.router)
app.include_router(teacher.router)
app.include_router(dictionary.router)


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "message": "French LMS API",
        "status": "running",
        "version": "1.0.0",
    }
