
from flask import Flask, jsonify, request, send_from_directory

from file_manager import (
    BASE_DIR,
    DATA_DIR,
    load_kanji,
    normalize,
    upload_csv,
    ALLOWED_LEVELS
)

FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)

app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

# Temporary quiz sessions stored in memory.
sessions = {}


@app.get("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/levels")
def get_levels():
    return jsonify({"levels": sorted(ALLOWED_LEVELS, reverse=True)})


@app.post("/api/upload/<level>")
def upload_file(level):
    try:
        file = request.files.get("file")
        result = upload_csv(file, level)
        return jsonify({
            "message": "CSV uploaded successfully.",
            **result
        })
    except (ValueError, FileNotFoundError) as error:
        return jsonify({"error": str(error)}), 400


@app.post("/api/start/<level>")
def start_quiz(level):
    try:
        questions = load_kanji(level)
    except (ValueError, FileNotFoundError) as error:
        return jsonify({"error": str(error)}), 400

    quiz_id = __import__("secrets").token_urlsafe(24)

    sessions[quiz_id] = {
        "questions": questions,
        "index": 0,
        "score": 0,
        "answered": set(),
        "revealed": set()
    }

    return jsonify({
        "quiz_id": quiz_id,
        "level": level.upper(),
        "total": len(questions),
        "number": 1,
        "score": 0,
        "question": questions[0]["kanji"]
    })


def get_quiz():
    data = request.get_json(silent=True) or {}
    quiz_id = data.get("quiz_id")
    return quiz_id, sessions.get(quiz_id)


@app.post("/api/check")
def check_answer():
    quiz_id, quiz = get_quiz()

    if not quiz:
        return jsonify({"error": "Quiz not found. Please restart."}), 400

    index = quiz["index"]
    question = quiz["questions"][index]
    data = request.get_json(silent=True) or {}
    answer = normalize(data.get("answer", ""))

    if not answer:
        return jsonify({
            "correct": False,
            "message": "Please enter an answer.",
            "score": quiz["score"]
        })

    accepted = {
        normalize(question["reading"]),
        normalize(question["romaji"])
    }

    correct = answer in accepted

    if correct and index not in quiz["answered"]:
        quiz["score"] += 1
        quiz["answered"].add(index)

    return jsonify({
        "correct": correct,
        "message": (
            "せいかい！" if correct
            else "おしい！もういちど！"
        ),
        "score": quiz["score"],
        "total": len(quiz["questions"])
    })


@app.post("/api/reveal")
def reveal_answer():
    quiz_id, quiz = get_quiz()

    if not quiz:
        return jsonify({"error": "Quiz not found."}), 400

    index = quiz["index"]
    question = quiz["questions"][index]
    quiz["revealed"].add(index)

    return jsonify({
        "reading": question["reading"],
        "romaji": question["romaji"]
    })


@app.post("/api/next")
def next_question():
    quiz_id, quiz = get_quiz()

    if not quiz:
        return jsonify({"error": "Quiz not found."}), 400

    index = quiz["index"]

    if index not in quiz["answered"] and index not in quiz["revealed"]:
        return jsonify({
            "error": "Answer correctly or reveal the answer first."
        }), 400

    index += 1
    quiz["index"] = index

    if index >= len(quiz["questions"]):
        total = len(quiz["questions"])
        score = quiz["score"]

        return jsonify({
            "finished": True,
            "score": score,
            "total": total,
            "percentage": round(score / total * 100, 1)
        })

    return jsonify({
        "finished": False,
        "question": quiz["questions"][index]["kanji"],
        "number": index + 1,
        "total": len(quiz["questions"]),
        "score": quiz["score"]
    })


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "File is too large. Maximum size is 5 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)
