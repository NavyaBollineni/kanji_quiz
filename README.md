# 🇯🇵 Kanji Quest - JLPT Practice Website

An interactive Japanese Kanji Quiz web application built with **Flask (Python)** and **Vanilla HTML/CSS/JavaScript**. Practice Kanji across all JLPT levels from **N5 (Beginner)** to **N1 (Advanced)**.

---

## 🌟 Features

- **5 JLPT Levels**: Full support for N5, N4, N3, N2, and N1.
- **Instant Feedback**: Submit answers in either **Hiragana** (e.g. `ひと`) or **Romaji** (e.g. `hito`).
- **Reveal & Skip**: Stuck on a tricky kanji? Reveal the reading and romaji.
- **Score Tracking & Progress Bar**: Real-time progress and final score percentage.
- **Custom CSV Upload**: Easily upload your own custom Kanji CSV wordlists.
- **Mobile Friendly & Responsive**: Beautiful Japanese minimalist card design that works on mobile phones, tablets, and desktop computers worldwide.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, pykakasi (Kanji to Hiragana/Romaji conversion)
- **Frontend**: Modern HTML5, CSS3, JavaScript (Fetch API)
- **Production Server**: Gunicorn WSGI
- **Data**: CSV datasets for JLPT levels N1–N5

---

## 🚀 Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NavyaBollineni/kanji_quiz.git
   cd kanji_quiz
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🌐 Deploy Live (100% Free Forever)

This project is configured ready to deploy on **Render** (free web service):
1. Sign up at [Render.com](https://render.com) (free, no credit card required).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `NavyaBollineni/kanji_quiz`.
4. Render will auto-detect Python:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click **Deploy Web Service** — in 2 minutes, your website is live worldwide with free HTTPS!
