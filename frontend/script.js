
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

let quizId = null;
let currentLevel = null;
let currentNumber = 1;
let totalQuestions = 0;
let currentScore = 0;
let questionCompleted = false;

async function apiRequest(url, data = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
    }

    return result;
}

function showScreen(screen) {
    welcomeScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");
    completeScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}

function showMessage(element, message) {
    element.textContent = message;
}

function resetQuestionUI() {
    answerInput.value = "";
    answerInput.disabled = false;
    checkBtn.disabled = false;
    revealBtn.disabled = false;

    feedback.textContent = "";
    feedback.className = "feedback";

    answerPanel.classList.add("hidden");
    readingDisplay.textContent = "";
    romajiDisplay.textContent = "";
    meaningDisplay.textContent = "";

    nextBtn.classList.add("hidden");
    questionCompleted = false;
}

function updateProgress() {
    questionCount.textContent =
        `Question ${currentNumber} of ${totalQuestions}`;

    const percentage = Math.round(
        (currentNumber / totalQuestions) * 100
    );

    progressPercent.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
    scoreDisplay.textContent = currentScore;
}

async function startQuiz(level) {
    homeMessage.textContent = "";

    levelButtons.forEach(button => {
        button.disabled = true;
    });

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
        showMessage(homeMessage, error.message);
    } finally {
        levelButtons.forEach(button => {
            button.disabled = false;
        });
    }
}

levelButtons.forEach(button => {
    button.addEventListener("click", () => {
        startQuiz(button.dataset.level);
    });
});

answerForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (questionCompleted) {
        return;
    }

    const answer = answerInput.value.trim();

    if (!answer) {
        showMessage(feedback, "Please enter an answer.");
        feedback.className = "feedback wrong";
        return;
    }

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

        // IMPORTANT:
        // An incorrect answer does not display the correct reading.
        // The reading appears only when Reveal Answer is clicked.

    } catch (error) {
        showMessage(feedback, error.message);
        feedback.className = "feedback wrong";
    } finally {
        if (!questionCompleted) {
            checkBtn.disabled = false;
        }
    }
});

revealBtn.addEventListener("click", async () => {
    if (questionCompleted) {
        return;
    }

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

        // Revealing an answer does not award a point.
        questionCompleted = true;
        answerInput.disabled = true;
        checkBtn.disabled = true;

        showMessage(feedback, "Answer revealed. Let's continue!");
        feedback.className = "feedback";

    } catch (error) {
        showMessage(feedback, error.message);
        feedback.className = "feedback wrong";
        revealBtn.disabled = false;
    }
});

nextBtn.addEventListener("click", async () => {
    nextBtn.disabled = true;

    try {
        const data = await apiRequest("/api/next", {
            quiz_id: quizId
        });

        if (data.finished) {
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
        nextBtn.disabled = false;
    }
});

backBtn.addEventListener("click", () => {
    showScreen(welcomeScreen);
});

document.getElementById("restart-btn").addEventListener("click", () => {
    startQuiz(currentLevel.toLowerCase());
});

document.getElementById("home-btn").addEventListener("click", () => {
    showScreen(welcomeScreen);
    homeMessage.textContent = "";
});


const homeBtn = document.getElementById("home-btn");

homeBtn.addEventListener("click", function () {
    // Return to the main JLPT level selection page
    quizScreen.classList.add("hidden");
    completeScreen.classList.add("hidden");
    welcomeScreen.classList.remove("hidden");
});