# French LMS — Language Learning Platform

A web-based French learning platform for teaching French (A1, A2, B1 levels).

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python + FastAPI
- **Database**: SQLite (V1) → PostgreSQL (production)

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python -m app.seed           # Seed the database
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Demo Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Teacher | teacher@frenchlms.com  | teacher123  |
| Student | student@frenchlms.com  | student123  |
