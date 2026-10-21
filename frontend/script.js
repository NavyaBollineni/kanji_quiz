
"use strict";

// ========================================
// DOM ELEMENTS
// ========================================

const welcomeScreen = document.getElementById("welcome-screen");
const quizScreen = document.getElementById("quiz-screen");
const completeScreen = document.getElementById("complete-screen");

const homeMessage = document.getElementById("home-message");
const levelButtons = document.querySelectorAll(".level-btn");

const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");

const checkBtn = document.getElementById("check-btn");
const revealBtn = document.getElementById("reveal-btn");
const nextBtn = document.getElementById("next-btn");
const backBtn = document.getElementById("back-btn");

const homeBtn = document.getElementById("home-btn");
const restartBtn = document.getElementById("restart-btn");
const completeHomeBtn = document.getElementById("complete-home-btn");

const feedback = document.getElementById("feedback");
const answerPanel = document.getElementById("answer-panel");

const levelLabel = document.getElementById("level-label");
const kanjiDisplay = document.getElementById("kanji-display");
const scoreDisplay = document.getElementById("score");

const questionCount = document.getElementById("question-count");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");

const readingDisplay = document.getElementById("reading-display");
const romajiDisplay = document.getElementById("romaji-display");
const meaningDisplay = document.getElementById("meaning-display");

const finalScore = document.getElementById("final-score");
const finalPercent = document.getElementById("final-percent");

// ========================================
// QUIZ STATE
// ========================================

let quizId = null;
let currentLevel = null;
let currentNumber = 1;
let totalQuestions = 0;
let currentScore = 0;
let questionCompleted = false;
let isStartingQuiz = false;
let isCheckingAnswer = false;
let isRevealingAnswer = false;
let isLoadingNext = false;

// ========================================
// API REQUEST
// ========================================

async function apiRequest(url, data = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(
            result.error || "Something went wrong. Please try again."
        );
    }

    return result;
}

// ========================================
// SCREEN MANAGEMENT
// ========================================

function showScreen(screen) {
    welcomeScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");
    completeScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}

function showMessage(element, message) {
    element.textContent = message;
}

function returnToHome() {
    showScreen(welcomeScreen);

    homeMessage.textContent = "";
    quizId = null;
}

// ========================================
// RESET QUESTION UI
// ========================================

function resetQuestionUI() {
    answerInput.value = "";
    answerInput.disabled = false;

    checkBtn.disabled = false;
    revealBtn.disabled = false;
    nextBtn.disabled = false;

    feedback.textContent = "";
    feedback.className = "feedback";

    answerPanel.classList.add("hidden");

    readingDisplay.textContent = "";
    romajiDisplay.textContent = "";
    meaningDisplay.textContent = "";

    nextBtn.classList.add("hidden");

    questionCompleted = false;
}

// ========================================
// UPDATE PROGRESS
// ========================================

function updateProgress() {
    questionCount.textContent =
        `Question ${currentNumber} of ${totalQuestions}`;

    const percentage = totalQuestions > 0
        ? Math.round((currentNumber / totalQuestions) * 100)
        : 0;

    progressPercent.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;

    scoreDisplay.textContent = currentScore;
}

// ========================================
// START OR RESTART QUIZ
// ========================================

async function startQuiz(level) {
    if (isStartingQuiz) {
        return;
    }

    isStartingQuiz = true;

    homeMessage.textContent = "";

    levelButtons.forEach(button => {
        button.disabled = true;
    });

    restartBtn.disabled = true;

    try {
        const data = await apiRequest(`/api/start/${level}`);

        quizId = data.quiz_id;
        currentLevel = data.level;
        currentNumber = data.number;
        totalQuestions = data.total;
        currentScore = data.score;

        levelLabel.textContent = currentLevel;
        kanjiDisplay.textContent = data.question;

        resetQuestionUI();
        updateProgress();

        showScreen(quizScreen);

        answerInput.focus();

    } catch (error) {
        showScreen(welcomeScreen);
        showMessage(homeMessage, error.message);

    } finally {
        isStartingQuiz = false;

        levelButtons.forEach(button => {
            button.disabled = false;
        });

        restartBtn.disabled = false;
    }
}

// ========================================
// SELECT JLPT LEVEL
// ========================================

levelButtons.forEach(button => {
    button.addEventListener("click", () => {
        const level = button.dataset.level;

        if (level) {
            startQuiz(level);
        }
    });
});

// ========================================
// CHECK ANSWER
// ========================================

answerForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (
        questionCompleted ||
        isCheckingAnswer ||
        isRevealingAnswer
    ) {
        return;
    }

    const answer = answerInput.value.trim();

    if (!answer) {
        showMessage(feedback, "Please enter an answer.");
        feedback.className = "feedback wrong";
        return;
    }

    isCheckingAnswer = true;
    checkBtn.disabled = true;

    try {
        const data = await apiRequest("/api/check", {
            quiz_id: quizId,
            answer: answer
        });

        currentScore = data.score;
        scoreDisplay.textContent = currentScore;

        showMessage(feedback, data.message);

        feedback.className = data.correct
            ? "feedback correct"
            : "feedback wrong";

        if (data.correct) {
            questionCompleted = true;

            answerInput.disabled = true;
            revealBtn.disabled = true;

            nextBtn.classList.remove("hidden");
        }

        // An incorrect answer does NOT reveal the correct reading.
        // The correct reading appears only after Reveal Answer.

    } catch (error) {
        showMessage(feedback, error.message);
        feedback.className = "feedback wrong";

    } finally {
        isCheckingAnswer = false;

        if (!questionCompleted) {
            checkBtn.disabled = false;
        }
    }
});

// ========================================
// REVEAL ANSWER
// ========================================

revealBtn.addEventListener("click", async () => {
    if (
        questionCompleted ||
        isRevealingAnswer ||
        isCheckingAnswer
    ) {
        return;
    }

    isRevealingAnswer = true;
    revealBtn.disabled = true;

    try {
        const data = await apiRequest("/api/reveal", {
            quiz_id: quizId
        });

        readingDisplay.textContent = data.reading;
        romajiDisplay.textContent = data.romaji;
        meaningDisplay.textContent = data.meaning;

        answerPanel.classList.remove("hidden");
        nextBtn.classList.remove("hidden");

        // Revealing the answer does not award a point.
        questionCompleted = true;

        answerInput.disabled = true;
        checkBtn.disabled = true;

        showMessage(
            feedback,
            "Answer revealed. Let's continue!"
        );

        feedback.className = "feedback";

    } catch (error) {
        showMessage(feedback, error.message);
        feedback.className = "feedback wrong";

        revealBtn.disabled = false;

    } finally {
        isRevealingAnswer = false;
    }
});

// ========================================
// NEXT KANJI
// ========================================

nextBtn.addEventListener("click", async () => {
    if (isLoadingNext || !questionCompleted) {
        return;
    }

    isLoadingNext = true;
    nextBtn.disabled = true;

    try {
        const data = await apiRequest("/api/next", {
            quiz_id: quizId
        });

        if (data.finished) {
            currentScore = data.score;

            finalScore.textContent =
                `${data.score} / ${data.total}`;

            finalPercent.textContent =
                `${data.percentage}% correct`;

            showScreen(completeScreen);
            return;
        }

        currentNumber = data.number;
        currentScore = data.score;

        kanjiDisplay.textContent = data.question;

        resetQuestionUI();
        updateProgress();

        answerInput.focus();

    } catch (error) {
        showMessage(feedback, error.message);
        feedback.className = "feedback wrong";

    } finally {
        isLoadingNext = false;
        nextBtn.disabled = false;
    }
});

// ========================================
// BACK TO LEVELS
// ========================================

backBtn.addEventListener("click", () => {
    returnToHome();
});

// ========================================
// HOME BUTTON DURING QUIZ
// ========================================

homeBtn.addEventListener("click", () => {
    returnToHome();
});

// ========================================
// RESTART SAME JLPT LEVEL
// ========================================

restartBtn.addEventListener("click", () => {
    if (currentLevel) {
        startQuiz(currentLevel.toLowerCase());
    } else {
        returnToHome();
    }
});

// ========================================
// CHOOSE ANOTHER LEVEL AFTER COMPLETION
// ========================================

completeHomeBtn.addEventListener("click", () => {
    returnToHome();
});
