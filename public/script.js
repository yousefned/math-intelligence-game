(() => {
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const levelEl = document.getElementById("level");
  const questionTextEl = document.getElementById("question-text");
  const answerInput = document.getElementById("answer-input");
  const startButton = document.getElementById("start-button");
  const submitButton = document.getElementById("submit-button");
  const questionArea = document.getElementById("question-area");

  let score = 0;
  let level = 1;
  let secondsElapsed = 0;
  let timerId = null;
  let currentAnswer = null;
  let isRunning = false;

  const feedbackEl = document.createElement("p");
  feedbackEl.id = "feedback";
  feedbackEl.style.marginTop = "8px";
  feedbackEl.style.color = "#a9b4c4";
  feedbackEl.textContent = "";
  questionArea.appendChild(feedbackEl);

  const operators = ["+", "-", "*"];

  function pad(num) {
    return num.toString().padStart(2, "0");
  }

  function updateTimer() {
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    timerEl.textContent = `الوقت: ${pad(minutes)}:${pad(seconds)}`;
  }

  function updateStats() {
    scoreEl.textContent = `النقاط: ${score}`;
    levelEl.textContent = `المستوى: ${level}`;
  }

  function updateLevel() {
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel !== level) {
      level = newLevel;
      feedbackEl.textContent = `تمت الترقية إلى المستوى ${level}`;
    }
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateQuestion() {
    const base = 5 + level * 3;
    const max = Math.min(base * 2, 200);
    const a = randomInt(1, max);
    const b = randomInt(1, max);
    const operator = operators[randomInt(0, operators.length - 1)];

    let question = `${a} ${operator} ${b}`;
    let answer;

    if (operator === "+") answer = a + b;
    if (operator === "-") answer = a - b;
    if (operator === "*") answer = a * b;

    currentAnswer = answer;
    questionTextEl.textContent = `حل: ${question}`;
  }

  function showFeedback(message, isPositive) {
    feedbackEl.textContent = message;
    feedbackEl.style.color = isPositive ? "#76f7c4" : "#ff7b7b";
  }

  function resetGame() {
    score = 0;
    level = 1;
    secondsElapsed = 0;
    currentAnswer = null;
    updateStats();
    updateTimer();
    questionTextEl.textContent = "اضغط على زر البدء لعرض السؤال";
    feedbackEl.textContent = "";
    answerInput.value = "";
  }

  function startGame() {
    if (isRunning) return;
    isRunning = true;
    resetGame();
    generateQuestion();

    timerId = setInterval(() => {
      secondsElapsed += 1;
      updateTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function submitAnswer() {
    if (!isRunning) {
      showFeedback("ابدأ اللعبة أولاً", false);
      return;
    }

    const userAnswer = Number(answerInput.value.trim());
    if (Number.isNaN(userAnswer)) {
      showFeedback("أدخل رقمًا صحيحًا", false);
      return;
    }

    if (userAnswer === currentAnswer) {
      score += 10;
      updateLevel();
      updateStats();
      showFeedback("إجابة صحيحة!", true);
      generateQuestion();
    } else {
      score = Math.max(0, score - 5);
      updateStats();
      showFeedback("إجابة خاطئة، حاول مرة أخرى", false);
    }

    answerInput.value = "";
    answerInput.focus();
  }

  startButton.addEventListener("click", () => {
    startGame();
    answerInput.focus();
  });

  submitButton.addEventListener("click", submitAnswer);

  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitAnswer();
    }
  });

  window.addEventListener("beforeunload", stopTimer);
})();
