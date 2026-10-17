
import csv
import random
import re
import unicodedata
from pathlib import Path

from pykakasi import kakasi

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "kanji_data"

converter = kakasi()
ALLOWED_LEVELS = {"n5", "n4", "n3", "n2", "n1"}


def normalize(text):
    text = unicodedata.normalize("NFKC", str(text or ""))
    return re.sub(r"[\s\u3000]+", "", text).casefold()


def to_romaji(reading):
    return "".join(
        item["hepburn"] for item in converter.convert(reading)
    )


def get_columns(fieldnames):
    columns = {
        name.strip().casefold(): name
        for name in (fieldnames or [])
        if name
    }

    kanji_col = columns.get("kanji")
    reading_col = (
        columns.get("hiragana")
        or columns.get("reading")
        or columns.get("japanese")
    )

    if not kanji_col or not reading_col:
        raise ValueError(
            "CSV must contain Kanji and Hiragana columns."
        )

    return kanji_col, reading_col


def read_csv_file(file_path):
    questions = []

    with open(file_path, "r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        kanji_col, reading_col = get_columns(reader.fieldnames)

        for row in reader:
            kanji = (row.get(kanji_col) or "").strip()
            reading = (row.get(reading_col) or "").strip()

            if not kanji or not reading:
                continue

            questions.append({
                "kanji": kanji,
                "reading": reading,
                "romaji": to_romaji(reading)
            })

    return questions


def load_kanji(level):
    level = level.lower()

    if level not in ALLOWED_LEVELS:
        raise ValueError("Invalid JLPT level.")

    file_path = DATA_DIR / f"{level}.csv"

    if not file_path.is_file():
        raise FileNotFoundError(
            f"{level.upper()} CSV file was not found."
        )

    questions = read_csv_file(file_path)
    random.shuffle(questions)

    if not questions:
        raise ValueError(
            f"No valid kanji records found in {level.upper()}."
        )

    return questions


def upload_csv(file_storage, level):
    level = level.lower()

    if level not in ALLOWED_LEVELS:
        raise ValueError("Invalid JLPT level.")

    if not file_storage or not file_storage.filename:
        raise ValueError("Please select a CSV file.")

    if not file_storage.filename.lower().endswith(".csv"):
        raise ValueError("Only CSV files are allowed.")

    # Validate the uploaded CSV before replacing the existing file.
    try:
        file_storage.stream.seek(0)
        decoded_text = file_storage.stream.read().decode("utf-8-sig")
        import io

        reader = csv.DictReader(io.StringIO(decoded_text))
        kanji_col, reading_col = get_columns(reader.fieldnames)

        valid_count = sum(
            1 for row in reader
            if (row.get(kanji_col) or "").strip()
            and (row.get(reading_col) or "").strip()
        )

        if valid_count == 0:
            raise ValueError("The CSV has no valid kanji records.")

        # Check that each reading can be processed.
        file_storage.stream.seek(0)
        questions = read_csv_file(file_storage.stream)

    except UnicodeDecodeError as error:
        raise ValueError(
            "Please upload a UTF-8 encoded CSV file."
        ) from error

    # Only replace the existing file after validation succeeds.
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    destination = DATA_DIR / f"{level}.csv"
    file_storage.stream.seek(0)
    file_storage.save(destination)

    return {
        "level": level.upper(),
        "total": len(questions),
        "filename": destination.name
    }
