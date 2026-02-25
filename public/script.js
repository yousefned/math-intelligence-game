const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const questionEl = document.getElementById("question");
const answerInput = document.getElementById("answer");
const checkBtn = document.getElementById("checkBtn");
const startBtn = document.getElementById("startBtn");
const feedbackEl = document.getElementById("feedback");
const soundBtn = document.getElementById("soundBtn");
const ringProgress = document.querySelector(".ring-progress");
const timerRing = document.querySelector(".timer-ring");
const flashEl = document.getElementById("flash");
const levelUpEl = document.getElementById("levelUp");

const TOTAL_TIME = 60;
const RING_CIRCUMFERENCE = 326;

let score = 0;
let level = 1;
let timeLeft = TOTAL_TIME;
let correctAnswer = null;
let timerId = null;
let isRunning = false;
let streak = 0;
let soundEnabled = false;

const operators = ["+", "-", "*", "/", "^"];
const difficultyRanges = {
  easy: 20,
  medium: 60,
  hard: 150,
};

const sounds = {};

// Utility to ensure UI never breaks on invalid values
function safeValue(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

// UI updates for score/time/level/streak
function updatePanel() {
  scoreEl.textContent = safeValue(score, 0);
  levelEl.textContent = safeValue(level, 1);
  timeEl.textContent = safeValue(timeLeft, TOTAL_TIME);
  streakEl.textContent = safeValue(streak, 0);
}

// Score animation for correct answers
function animateScore() {
  scoreEl.classList.add("pop");
  setTimeout(() => scoreEl.classList.remove("pop"), 180);
}

// Smooth question transition
function setQuestionText(text) {
  questionEl.classList.add("fade-out");
  setTimeout(() => {
    questionEl.textContent = text;
    questionEl.classList.remove("fade-out");
  }, 160);
}

// Flash feedback for correct/incorrect answers
function flashScreen(type) {
  flashEl.classList.remove("success", "error");
  void flashEl.offsetWidth;
  flashEl.classList.add(type);
  setTimeout(() => {
    flashEl.classList.remove(type);
  }, 150);
}

// Neon level-up popup
function showLevelUp() {
  levelUpEl.classList.add("show");
  setTimeout(() => levelUpEl.classList.remove("show"), 900);
}

// Circular countdown animation
function updateRing() {
  const ratio = Math.max(0, timeLeft) / TOTAL_TIME;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  ringProgress.style.strokeDashoffset = `${offset}`;

  if (timeLeft <= 10) {
    timerRing.classList.add("danger");
  } else {
    timerRing.classList.remove("danger");
  }
}

// Sound playback with safety guards
function playSound(name) {
  if (!soundEnabled || !sounds[name]) return;
  try {
    const sound = sounds[name];
    sound.currentTime = 0;
    sound.play();
  } catch (error) {
    console.error("Sound error:", error);
  }
}

// Load lightweight embedded sounds (no external assets)
function loadSounds() {
  try {
    const tone = "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQwAAAAA/////wAAAP///wAAAAA=";
    sounds.correct = new Audio(tone);
    sounds.wrong = new Audio(tone);
    sounds.level = new Audio(tone);
    sounds.start = new Audio(tone);
    sounds.beep = new Audio(tone);
  } catch (error) {
    console.error("Failed to load sounds:", error);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDifficultyLimit() {
  const checked = document.querySelector("input[name='difficulty']:checked");
  const key = checked ? checked.value : "easy";
  return difficultyRanges[key] || difficultyRanges.easy;
}

// Simple logic sequence generator
function generateLogicPuzzle(limit) {
  const start = randomInt(1, Math.max(3, Math.floor(limit / 4)));
  const step = randomInt(2, 6);
  const seq = [start, start + step, start + step * 2];
  const answer = start + step * 3;
  return {
    question: `${seq[0]}، ${seq[1]}، ${seq[2]}، ؟`,
    answer,
  };
}

// Random question generator including new types
function generateQuestion() {
  const maxNumber = getDifficultyLimit() + (level - 1) * 6;
  const operator = operators[randomInt(0, operators.length - 1)];

  let left = randomInt(1, maxNumber);
  let right = randomInt(1, maxNumber);
  let questionText = "";
  let answer = 0;

  if (operator === "+") {
    answer = left + right;
    questionText = `${left} + ${right} = ؟`;
  } else if (operator === "-") {
    if (right > left) {
      [left, right] = [right, left];
    }
    answer = left - right;
    questionText = `${left} - ${right} = ؟`;
  } else if (operator === "*") {
    answer = left * right;
    questionText = `${left} × ${right} = ؟`;
  } else if (operator === "/") {
    right = randomInt(1, Math.max(2, Math.floor(maxNumber / 4)));
    answer = randomInt(1, Math.max(2, Math.floor(maxNumber / 5)));
    left = right * answer;
    questionText = `${left} ÷ ${right} = ؟`;
  } else if (operator === "^") {
    left = randomInt(2, 5);
    right = randomInt(2, 3);
    answer = left ** right;
    questionText = `${left} ^ ${right} = ؟`;
  }

  if (Math.random() < 0.2) {
    const puzzle = generateLogicPuzzle(maxNumber);
    questionText = puzzle.question;
    answer = puzzle.answer;
  }

  correctAnswer = answer;
  setQuestionText(questionText);
}

// Combo bonuses for streaks
function applyComboBonus() {
  let bonus = 0;
  if (streak === 3) {
    bonus = 5;
  } else if (streak === 5) {
    bonus = 15;
  }

  if (bonus > 0) {
    score += bonus;
    feedbackEl.textContent = `سلسلة رائعة! +${bonus} نقاط إضافية`;
    animateScore();
  }
}

function startTimer() {
  if (timerId) {
    clearInterval(timerId);
  }

  timerId = setInterval(() => {
    timeLeft -= 1;
    updatePanel();
    updateRing();

    if (timeLeft === 10) {
      playSound("beep");
    }

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function startGame() {
  score = 0;
  level = 1;
  timeLeft = TOTAL_TIME;
  streak = 0;
  isRunning = true;

  feedbackEl.textContent = "انطلق!";
  answerInput.value = "";
  answerInput.disabled = false;
  checkBtn.disabled = false;
  answerInput.focus();

  updatePanel();
  updateRing();
  generateQuestion();
  startTimer();
  playSound("start");
}

function endGame() {
  isRunning = false;
  clearInterval(timerId);
  timerId = null;
  timeLeft = 0;
  updatePanel();
  updateRing();
  feedbackEl.textContent = `انتهى الوقت! نتيجتك النهائية: ${score}`;
  answerInput.disabled = true;
  checkBtn.disabled = true;
}

function handleCorrectAnswer() {
  score += 10;
  streak += 1;

  if (score % 50 === 0) {
    level += 1;
    showLevelUp();
    playSound("level");
  }

  applyComboBonus();
  feedbackEl.textContent = "إجابة صحيحة!";
  animateScore();
  flashScreen("success");
  answerInput.value = "";
  generateQuestion();
  updatePanel();
  playSound("correct");
}

function handleWrongAnswer() {
  streak = 0;
  feedbackEl.textContent = "إجابة خاطئة، حاول مرة أخرى.";
  flashScreen("error");
  updatePanel();
  playSound("wrong");
}

function checkAnswer() {
  if (!isRunning) {
    feedbackEl.textContent = "اضغط ابدأ اللعبة أولاً.";
    return;
  }

  const userAnswer = parseInt(answerInput.value, 10);
  if (Number.isNaN(userAnswer)) {
    feedbackEl.textContent = "أدخل رقمًا صالحًا.";
    return;
  }

  if (userAnswer === correctAnswer) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "تشغيل" : "إيقاف";
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));
}

function init() {
  loadSounds();
  updatePanel();
  updateRing();
}

checkBtn.addEventListener("click", checkAnswer);
startBtn.addEventListener("click", startGame);
answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkAnswer();
  }
});
soundBtn.addEventListener("click", toggleSound);

init();
