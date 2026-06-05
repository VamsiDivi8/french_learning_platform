from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import DictionaryWord, User
from app.auth_deps import get_current_teacher
from app.schemas import DictionaryWordResponse, DictionaryWordCreate

router = APIRouter(prefix="/api/dictionary", tags=["dictionary"])


# ── GET list/search words ─────────────────────────────
@router.get("/", response_model=list[DictionaryWordResponse])
def get_dictionary_words(
    q: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Retrieve dictionary words, with optional query and category filters."""
    query = db.query(DictionaryWord)

    if category and category.lower() != "all":
        query = query.filter(DictionaryWord.part_of_speech == category.lower())

    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            or_(
                DictionaryWord.word.ilike(search_filter),
                DictionaryWord.translation.ilike(search_filter)
            )
        )

    # Return words ordered alphabetically
    return query.order_by(DictionaryWord.word.asc()).all()


# ── GET single word details ───────────────────────────
@router.get("/{word_id}", response_model=DictionaryWordResponse)
def get_dictionary_word(word_id: int, db: Session = Depends(get_db)):
    """Retrieve a single dictionary word by ID."""
    word = db.query(DictionaryWord).filter(DictionaryWord.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return word


# ── POST create dictionary word (Teacher Only) ────────
@router.post("/", response_model=DictionaryWordResponse, status_code=status.HTTP_201_CREATED)
def create_dictionary_word(
    word_in: DictionaryWordCreate,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Add a new word to the dictionary. (Teacher Privilege Required)"""
    existing = db.query(DictionaryWord).filter(DictionaryWord.word.ilike(word_in.word)).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"The word '{word_in.word}' already exists in the dictionary."
        )

    new_word = DictionaryWord(
        word=word_in.word.strip(),
        part_of_speech=word_in.part_of_speech.strip().lower() if word_in.part_of_speech else None,
        translation=word_in.translation.strip(),
        definition=word_in.definition.strip() if word_in.definition else None,
        example_sentence_fr=word_in.example_sentence_fr.strip() if word_in.example_sentence_fr else None,
        example_sentence_en=word_in.example_sentence_en.strip() if word_in.example_sentence_en else None,
        audio_url=word_in.audio_url.strip() if word_in.audio_url else None,
    )
    db.add(new_word)
    db.commit()
    db.refresh(new_word)
    return new_word


# ── PUT update dictionary word (Teacher Only) ─────────
@router.put("/{word_id}", response_model=DictionaryWordResponse)
def update_dictionary_word(
    word_id: int,
    word_in: DictionaryWordCreate,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Update a dictionary word by ID. (Teacher Privilege Required)"""
    word = db.query(DictionaryWord).filter(DictionaryWord.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    # Check unique word constraint if word string changed
    if word.word.lower() != word_in.word.lower():
        existing = db.query(DictionaryWord).filter(DictionaryWord.word.ilike(word_in.word)).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"The word '{word_in.word}' already exists in the dictionary."
            )

    word.word = word_in.word.strip()
    word.part_of_speech = word_in.part_of_speech.strip().lower() if word_in.part_of_speech else None
    word.translation = word_in.translation.strip()
    word.definition = word_in.definition.strip() if word_in.definition else None
    word.example_sentence_fr = word_in.example_sentence_fr.strip() if word_in.example_sentence_fr else None
    word.example_sentence_en = word_in.example_sentence_en.strip() if word_in.example_sentence_en else None
    word.audio_url = word_in.audio_url.strip() if word_in.audio_url else None

    db.commit()
    db.refresh(word)
    return word


# ── DELETE dictionary word (Teacher Only) ─────────────
@router.delete("/{word_id}", status_code=status.HTTP_200_OK)
def delete_dictionary_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(get_current_teacher),
):
    """Delete a dictionary word by ID. (Teacher Privilege Required)"""
    word = db.query(DictionaryWord).filter(DictionaryWord.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    db.delete(word)
    db.commit()
    return {"message": f"Word '{word.word}' deleted successfully."}
