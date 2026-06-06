"""
Seed script to populate the database with sample French courses, modules, and lessons.
Run: python -m app.seed
"""

from app.database import SessionLocal, engine, Base
from app.models import Course, Module, Lesson, Vocabulary, QuizQuestion, User, DictionaryWord
import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if data already exists
        if db.query(Course).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # ── Create demo users ─────────────────────────────
        teacher = User(
            name="French Teacher",
            email="teacher@frenchlms.com",
            hashed_password=hash_password("teacher123"),
            role="teacher",
        )
        student = User(
            name="Demo Student",
            email="student@frenchlms.com",
            hashed_password=hash_password("student123"),
            role="student",
        )
        db.add_all([teacher, student])
        db.flush()

        # ── Create courses ────────────────────────────────
        courses_data = [
            {
                "title": "French A1 — Beginner",
                "level": "A1",
                "track": "senior",
                "description": "Start your French journey! Learn basic greetings, introductions, numbers, and everyday vocabulary. Perfect for absolute beginners.",
                "image_url": None,
            },
            {
                "title": "French A2 — Elementary",
                "level": "A2",
                "track": "senior",
                "description": "Build on your basics. Learn to describe routines, express opinions, and handle everyday situations in French.",
                "image_url": None,
            },
            {
                "title": "French B1 — Intermediate",
                "level": "B1",
                "track": "senior",
                "description": "Take your French to the next level. Discuss abstract topics, express detailed opinions, and understand native speakers.",
                "image_url": None,
            },
        ]

        courses = []
        for data in courses_data:
            course = Course(**data)
            db.add(course)
            db.flush()
            courses.append(course)

        # ── A1 Modules & Lessons ──────────────────────────
        a1_modules = [
            {
                "title": "Greetings & Introductions",
                "order": 1,
                "lessons": [
                    {"title": "Bonjour! — Saying Hello", "order": 1, "duration_minutes": 12},
                    {"title": "Comment ça va? — How Are You?", "order": 2, "duration_minutes": 10},
                    {"title": "Je m'appelle... — Introducing Yourself", "order": 3, "duration_minutes": 15},
                    {"title": "Au revoir — Saying Goodbye", "order": 4, "duration_minutes": 8},
                ],
            },
            {
                "title": "Numbers & Counting",
                "order": 2,
                "lessons": [
                    {"title": "Les nombres 1–20", "order": 1, "duration_minutes": 14},
                    {"title": "Les nombres 21–100", "order": 2, "duration_minutes": 12},
                    {"title": "Counting in Daily Life", "order": 3, "duration_minutes": 11},
                ],
            },
            {
                "title": "Everyday Vocabulary",
                "order": 3,
                "lessons": [
                    {"title": "La famille — Family", "order": 1, "duration_minutes": 15},
                    {"title": "Les couleurs — Colors", "order": 2, "duration_minutes": 10},
                    {"title": "Les jours et les mois — Days & Months", "order": 3, "duration_minutes": 13},
                    {"title": "La nourriture — Food", "order": 4, "duration_minutes": 16},
                    {"title": "Les vêtements — Clothing", "order": 5, "duration_minutes": 12},
                ],
            },
            {
                "title": "Basic Grammar",
                "order": 4,
                "lessons": [
                    {"title": "Le/La/Les — Articles", "order": 1, "duration_minutes": 14},
                    {"title": "Être & Avoir — To Be & To Have", "order": 2, "duration_minutes": 18},
                    {"title": "Present Tense -ER Verbs", "order": 3, "duration_minutes": 20},
                    {"title": "Negation — Ne...pas", "order": 4, "duration_minutes": 12},
                    {"title": "Asking Questions", "order": 5, "duration_minutes": 15},
                ],
            },
            {
                "title": "Daily Situations",
                "order": 5,
                "lessons": [
                    {"title": "Au café — At the Café", "order": 1, "duration_minutes": 14},
                    {"title": "Au supermarché — At the Supermarket", "order": 2, "duration_minutes": 13},
                    {"title": "Directions — Asking for Directions", "order": 3, "duration_minutes": 12},
                ],
            },
        ]

        # ── A2 Modules & Lessons ──────────────────────────
        a2_modules = [
            {
                "title": "Past Tense Foundations",
                "order": 1,
                "lessons": [
                    {"title": "Passé Composé with Avoir", "order": 1, "duration_minutes": 20},
                    {"title": "Passé Composé with Être", "order": 2, "duration_minutes": 18},
                    {"title": "Irregular Past Participles", "order": 3, "duration_minutes": 15},
                    {"title": "Imparfait — Imperfect Tense", "order": 4, "duration_minutes": 22},
                ],
            },
            {
                "title": "Expressing Opinions",
                "order": 2,
                "lessons": [
                    {"title": "Je pense que... — I Think That...", "order": 1, "duration_minutes": 14},
                    {"title": "Comparisons — Plus, Moins, Aussi", "order": 2, "duration_minutes": 16},
                    {"title": "Giving Reasons — Parce que / Car", "order": 3, "duration_minutes": 12},
                ],
            },
            {
                "title": "Daily Routines",
                "order": 3,
                "lessons": [
                    {"title": "Ma journée — My Day", "order": 1, "duration_minutes": 15},
                    {"title": "Reflexive Verbs", "order": 2, "duration_minutes": 18},
                    {"title": "Telling Time", "order": 3, "duration_minutes": 12},
                    {"title": "Weekend Activities", "order": 4, "duration_minutes": 14},
                ],
            },
            {
                "title": "Travel & Transport",
                "order": 4,
                "lessons": [
                    {"title": "À l'aéroport — At the Airport", "order": 1, "duration_minutes": 16},
                    {"title": "Booking a Hotel", "order": 2, "duration_minutes": 14},
                    {"title": "Public Transport", "order": 3, "duration_minutes": 13},
                    {"title": "Asking for Help While Traveling", "order": 4, "duration_minutes": 12},
                ],
            },
        ]

        # ── B1 Modules & Lessons ──────────────────────────
        b1_modules = [
            {
                "title": "Advanced Grammar",
                "order": 1,
                "lessons": [
                    {"title": "Subjunctive Mood — Il faut que...", "order": 1, "duration_minutes": 25},
                    {"title": "Conditional Tense", "order": 2, "duration_minutes": 22},
                    {"title": "Relative Pronouns — Qui, Que, Dont, Où", "order": 3, "duration_minutes": 20},
                    {"title": "Plus-que-parfait", "order": 4, "duration_minutes": 18},
                ],
            },
            {
                "title": "French Culture",
                "order": 2,
                "lessons": [
                    {"title": "French Customs & Traditions", "order": 1, "duration_minutes": 20},
                    {"title": "French Cuisine — Beyond the Basics", "order": 2, "duration_minutes": 18},
                    {"title": "French Art & Literature", "order": 3, "duration_minutes": 22},
                ],
            },
            {
                "title": "Professional French",
                "order": 3,
                "lessons": [
                    {"title": "Writing a Formal Email", "order": 1, "duration_minutes": 16},
                    {"title": "Job Interview Vocabulary", "order": 2, "duration_minutes": 18},
                    {"title": "Business Meeting Phrases", "order": 3, "duration_minutes": 15},
                    {"title": "Presenting in French", "order": 4, "duration_minutes": 20},
                ],
            },
            {
                "title": "Current Events & Discussion",
                "order": 4,
                "lessons": [
                    {"title": "Reading French News", "order": 1, "duration_minutes": 20},
                    {"title": "Debating & Argumentation", "order": 2, "duration_minutes": 22},
                    {"title": "Environmental Vocabulary", "order": 3, "duration_minutes": 16},
                    {"title": "Technology & Social Media", "order": 4, "duration_minutes": 18},
                ],
            },
        ]

        all_course_modules = [
            (courses[0], a1_modules),
            (courses[1], a2_modules),
            (courses[2], b1_modules),
        ]

        all_lessons = []
        for course, modules_data in all_course_modules:
            for mod_data in modules_data:
                module = Module(
                    course_id=course.id,
                    title=mod_data["title"],
                    order=mod_data["order"],
                )
                db.add(module)
                db.flush()

                for lesson_data in mod_data["lessons"]:
                    lesson = Lesson(
                        module_id=module.id,
                        title=lesson_data["title"],
                        order=lesson_data["order"],
                        duration_minutes=lesson_data.get("duration_minutes"),
                        video_url=None,  # Teacher will add URLs later
                    )
                    db.add(lesson)
                    db.flush()
                    all_lessons.append(lesson)

        # ── Sample Vocabulary (for A1 first lesson) ───────
        first_lesson = all_lessons[0]
        vocab_data = [
            ("Bonjour", "Hello / Good morning", "A common greeting used throughout the day."),
            ("Bonsoir", "Good evening", "Used as a greeting in the evening."),
            ("Salut", "Hi / Bye (informal)", "Casual greeting among friends."),
            ("Merci", "Thank you", "The most common way to say thanks."),
            ("S'il vous plaît", "Please (formal)", "Used in polite/formal situations."),
            ("Excusez-moi", "Excuse me", "Used to get attention or apologize."),
            ("Oui", "Yes", "Affirmative response."),
            ("Non", "No", "Negative response."),
        ]

        for french, english, example in vocab_data:
            db.add(Vocabulary(
                lesson_id=first_lesson.id,
                french_word=french,
                english_meaning=english,
                example_sentence=example,
            ))

        # ── Sample Quiz (for A1 first lesson) ─────────────
        quiz_data = [
            {
                "question": "What does 'Bonjour' mean in English?",
                "option_a": "Goodbye",
                "option_b": "Hello",
                "option_c": "Please",
                "option_d": "Thank you",
                "correct_answer": "b",
            },
            {
                "question": "Which word means 'Thank you' in French?",
                "option_a": "Salut",
                "option_b": "Excusez-moi",
                "option_c": "Merci",
                "option_d": "Bonsoir",
                "correct_answer": "c",
            },
            {
                "question": "How do you say 'Please' formally in French?",
                "option_a": "Merci beaucoup",
                "option_b": "S'il vous plaît",
                "option_c": "Au revoir",
                "option_d": "Bonjour",
                "correct_answer": "b",
            },
            {
                "question": "'Salut' is best described as:",
                "option_a": "A formal greeting",
                "option_b": "An informal greeting",
                "option_c": "A farewell only",
                "option_d": "An apology",
                "correct_answer": "b",
            },
        ]

        for q in quiz_data:
            db.add(QuizQuestion(lesson_id=first_lesson.id, **q))

        # ── Seed Dictionary words ─────────────────────────
        dictionary_data = [
            ("bonjour", "greeting", "hello / good morning", "A common and polite greeting used when meeting someone during the day.", "Bonjour, comment ça va?", "Hello, how is it going?"),
            ("merci", "expression", "thank you", "An expression used to show gratitude or politeness.", "Merci beaucoup pour votre aide.", "Thank you very much for your help."),
            ("s'il vous plaît", "expression", "please (formal)", "A polite phrase used when making requests in formal contexts.", "Un café, s'il vous plaît.", "A coffee, please."),
            ("le livre", "noun", "the book", "A written or printed work consisting of pages bound together.", "Je lis un livre intéressant.", "I am reading an interesting book."),
            ("le chat", "noun", "the cat", "A small domesticated carnivorous mammal with soft fur.", "Le chat dort sur le canapé.", "The cat is sleeping on the sofa."),
            ("manger", "verb", "to eat", "To consume food by putting it in the mouth and swallowing it.", "J'aime manger des croissants.", "I like to eat croissants."),
            ("parler", "verb", "to speak / to talk", "To communicate or express thoughts in spoken words.", "Elle parle couramment français.", "She speaks French fluently."),
            ("rouge", "adjective", "red", "Of a color like that of blood or a tomato.", "Elle porte une robe rouge.", "She is wearing a red dress."),
            ("beau", "adjective", "beautiful / handsome", "Pleasing the senses or mind aesthetically.", "Quel beau paysage!", "What a beautiful landscape!"),
            ("oui", "expression", "yes", "An expression of affirmation or agreement.", "Oui, j'accepte.", "Yes, I accept."),
            ("non", "expression", "no", "An expression of negation, refusal, or denial.", "Non, je ne pense pas.", "No, I don't think so."),
            ("l'eau", "noun", "water", "A colorless, transparent, odorless liquid that forms the seas, lakes, and rain.", "Un verre d'eau, s'il vous plaît.", "A glass of water, please."),
            ("avoir", "verb", "to have", "To possess, own, or hold.", "J'ai un chien.", "I have a dog."),
            ("être", "verb", "to be", "To exist, occupy a position, or represent a state.", "Je suis étudiant.", "I am a student."),
            ("aller", "verb", "to go", "To move or travel to a place.", "Nous allons au cinéma.", "We are going to the cinema."),
            ("au revoir", "greeting", "goodbye", "A phrase used when parting from someone.", "Au revoir, à demain!", "Goodbye, see you tomorrow!"),
            ("bien", "adverb", "well / good", "In a satisfactory, proper, or very good manner.", "Tout va bien.", "Everything is going well."),
            ("la pomme", "noun", "the apple", "A round fruit with red, green, or yellow skin and crisp white flesh.", "Je mange une pomme.", "I am eating an apple."),
            ("vert", "adjective", "green", "Of the color between blue and yellow in the spectrum; colored like grass.", "L'herbe est verte.", "The grass is green."),
            ("grand", "adjective", "big / tall", "Of considerable size, extent, or intensity.", "Il habite dans une grande maison.", "He lives in a big house.")
        ]
        
        for word, pos, trans, definition, ex_fr, ex_en in dictionary_data:
            db.add(DictionaryWord(
                word=word,
                part_of_speech=pos,
                translation=trans,
                definition=definition,
                example_sentence_fr=ex_fr,
                example_sentence_en=ex_en
            ))

        db.commit()

        # Print summary
        total_lessons = len(all_lessons)
        print(f"\n[OK] Database seeded successfully!")
        print(f"   Users: 2 (teacher + student)")
        print(f"   Courses: {len(courses)}")
        print(f"   Modules: {sum(len(m) for _, m in all_course_modules)}")
        print(f"   Lessons: {total_lessons}")
        print(f"   Vocabulary items: {len(vocab_data)}")
        print(f"   Quiz questions: {len(quiz_data)}")
        print(f"\n   Demo login:")
        print(f"   Teacher: teacher@frenchlms.com / teacher123")
        print(f"   Student: student@frenchlms.com / student123")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
