// Neon Protocol: Mission-based math gameplay

const ui = {
  app: document.getElementById("app"),
  intro: document.getElementById("intro"),
  game: document.getElementById("game"),
  startMissionBtn: document.getElementById("startMissionBtn"),
  hudMission: document.getElementById("hudMission"),
  hudObjective: document.getElementById("hudObjective"),
  hudScore: document.getElementById("hudScore"),
  hudTime: document.getElementById("hudTime"),
  hudStreak: document.getElementById("hudStreak"),
  questionText: document.getElementById("questionText"),
  questionCard: document.getElementById("questionCard"),
  answerInput: document.getElementById("answerInput"),
  submitAnswer: document.getElementById("submitAnswer"),
  choiceRow: document.getElementById("choiceRow"),
  eventBanner: document.getElementById("eventBanner"),
  missionProgress: document.getElementById("missionProgress"),
  progressText: document.getElementById("progressText"),
  missionList: document.getElementById("missionList"),
  missionTip: document.getElementById("missionTip"),
  missionComplete: document.getElementById("missionComplete"),
  missionSummary: document.getElementById("missionSummary"),
  nextMission: document.getElementById("nextMission"),
  soundToggle: document.getElementById("soundToggle"),
  themeToggle: document.getElementById("themeToggle"),
  flash: document.getElementById("flash"),
  powerTime: document.getElementById("powerTime"),
  powerDouble: document.getElementById("powerDouble"),
  powerSkip: document.getElementById("powerSkip"),
  powerTimeCount: document.getElementById("powerTimeCount"),
  powerDoubleCount: document.getElementById("powerDoubleCount"),
  powerSkipCount: document.getElementById("powerSkipCount"),
  difficultyButtons: Array.from(document.querySelectorAll(".segment")),
  choiceButtons: Array.from(document.querySelectorAll(".choice-row .chip")),
};

const missions = [
  {
    name: "Boot Sequence",
    type: "equation",
    target: 5,
    time: 30,
    objective: "Solve 5 equations in 30s",
    tip: "Focus on accuracy to build your combo multiplier.",
  },
  {
    name: "Signal Comparison",
    type: "comparison",
    target: 6,
    time: 35,
    objective: "Compare left vs right values",
    tip: "Use quick comparison buttons to transmit answers fast.",
  },
  {
    name: "Sequence Hack",
    type: "sequence",
    target: 6,
    time: 40,
    objective: "Crack numerical sequences",
    tip: "Look for consistent deltas or multipliers.",
  },
  {
    name: "Logic Circuit",
    type: "logic",
    target: 7,
    time: 45,
    objective: "Identify anomalies in logic streams",
    tip: "Find the number that breaks the pattern.",
  },
  {
    name: "Inequality Firewall",
    type: "inequality",
    target: 7,
    time: 50,
    objective: "Solve inequality thresholds",
    tip: "Enter the smallest integer that satisfies the inequality.",
  },
  {
    name: "Final Fusion",
    type: "mixed",
    target: 8,
    time: 55,
    objective: "Mixed protocol: all challenge types",
    tip: "Stay calm. Events activate more often here.",
  },
];

const state = {
  missionIndex: 0,
  score: 0,
  displayScore: 0,
  streak: 0,
  multiplier: 1,
  solved: 0,
  timeLeft: 0,
  timerId: null,
  currentAnswer: null,
  currentType: "equation",
  soundEnabled: true,
  difficulty: "easy",
  event: null,
  eventTimer: null,
  speedRate: 1,
  powerups: { time: 1, double: 1, skip: 1 },
  doubleActive: false,
  doubleTimer: null,
};

const difficultyScale = {
  easy: 1,
  medium: 1.35,
  hard: 1.7,
};

// ------------------------
// Utility helpers
// ------------------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function animateNumber(el, from, to) {
  const start = performance.now();
  const duration = 400;
  function tick(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    const value = Math.round(from + (to - from) * progress);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function showScreen(screen) {
  [ui.intro, ui.game, ui.missionComplete].forEach((section) => {
    section.classList.remove("active");
  });
  screen.classList.add("active");
}

function flash(type) {
  ui.flash.classList.remove("success", "fail");
  void ui.flash.offsetWidth;
  ui.flash.classList.add(type);
}

function shake() {
  ui.app.classList.remove("shake");
  void ui.app.offsetWidth;
  ui.app.classList.add("shake");
}

// ------------------------
// Audio (minimal, local)
// ------------------------
let audioCtx = null;

function playTone(freq, duration = 0.08) {
  if (!state.soundEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = 0.05;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ------------------------
// Mission + UI setup
// ------------------------
function setDifficulty(value) {
  state.difficulty = value;
  ui.difficultyButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === value);
  });
}

function updatePowerupUI() {
  ui.powerTimeCount.textContent = `x${state.powerups.time}`;
  ui.powerDoubleCount.textContent = `x${state.powerups.double}`;
  ui.powerSkipCount.textContent = `x${state.powerups.skip}`;
  ui.powerTime.disabled = state.powerups.time <= 0;
  ui.powerDouble.disabled = state.powerups.double <= 0;
  ui.powerSkip.disabled = state.powerups.skip <= 0;
}

function setEventBanner(text, accent = "") {
  ui.eventBanner.textContent = text;
  ui.eventBanner.style.color = accent || "";
}

function updateHUD() {
  ui.hudTime.textContent = Math.max(0, Math.ceil(state.timeLeft));
  animateNumber(ui.hudScore, state.displayScore, state.score);
  state.displayScore = state.score;
  ui.hudStreak.textContent = state.streak;
}

function updateProgress() {
  const mission = missions[state.missionIndex];
  const ratio = clamp(state.solved / mission.target, 0, 1);
  ui.missionProgress.style.width = `${ratio * 100}%`;
  ui.progressText.textContent = `${state.solved} / ${mission.target} solved`;
}

function updateMissionInfo() {
  const mission = missions[state.missionIndex];
  ui.hudMission.textContent = mission.name;
  ui.hudObjective.textContent = mission.objective;
  ui.missionTip.textContent = mission.tip;
  ui.missionList.innerHTML = `
    <li>${mission.objective}</li>
    <li>Maintain streaks to boost multipliers.</li>
    <li>Use power-ups when pressure spikes.</li>
  `;
}

// ------------------------
// Question generators
// ------------------------
function generateEquation() {
  const scale = difficultyScale[state.difficulty];
  const a = randomInt(1, Math.floor(4 * scale));
  const x = randomInt(2, Math.floor(9 * scale));
  const b = randomInt(-8, 12);
  const c = a * x + b;
  return {
    text: `Solve for x: ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${c}`,
    answer: x,
  };
}

function generateSequence() {
  const scale = difficultyScale[state.difficulty];
  const start = randomInt(2, Math.floor(6 * scale));
  const step = randomInt(2, Math.floor(5 * scale));
  const increment = randomInt(1, 3);
  const seq = [
    start,
    start + step,
    start + step + (step + increment),
    start + step + (step + increment) + (step + increment * 2),
  ];
  const answer = seq[3] + (step + increment * 3);
  return {
    text: `Sequence breach: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ?`,
    answer,
  };
}

function generateComparison() {
  const scale = difficultyScale[state.difficulty];
  const left = randomInt(10, Math.floor(40 * scale));
  const right = randomInt(10, Math.floor(40 * scale));
  const leftDelta = randomInt(3, 9);
  const rightDelta = randomInt(2, 8);
  const leftExpr = `${left} + ${leftDelta}`;
  const rightExpr = `${right} - ${rightDelta}`;
  const leftValue = left + leftDelta;
  const rightValue = right - rightDelta;
  let answer = 0;
  if (leftValue > rightValue) answer = 1;
  if (leftValue < rightValue) answer = 2;
  return {
    text: `Compare: (${leftExpr}) vs (${rightExpr}). Enter 1 for left, 2 for right, 0 for equal.`,
    answer,
    useChoices: true,
  };
}

function generateLogic() {
  const base = randomInt(4, 10);
  const step = randomInt(3, 6);
  const sequence = [base, base + step, base + step * 2, base + step * 3];
  const outlier = base + step * randomInt(4, 6) + randomInt(2, 6);
  const slot = randomInt(1, 4);
  const items = [...sequence];
  items.splice(slot, 0, outlier);
  return {
    text: `Logic anomaly detected: ${items.join(", ")}. Enter the anomaly.`,
    answer: outlier,
  };
}

function generateInequality() {
  const scale = difficultyScale[state.difficulty];
  const a = randomInt(2, Math.floor(6 * scale));
  const b = randomInt(-8, 12);
  const x = randomInt(3, Math.floor(9 * scale));
  const comparator = ">=";
  const c = a * x + b;
  const answer = Math.ceil((c - b) / a);
  return {
    text: `Inequality firewall: ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} ${comparator} ${c}. Smallest integer x?`,
    answer,
  };
}

function generateArithmetic() {
  const scale = difficultyScale[state.difficulty];
  const ops = ["+", "-", "×", "÷"];
  const op = ops[randomInt(0, ops.length - 1)];
  let left = randomInt(6, Math.floor(20 * scale));
  let right = randomInt(2, Math.floor(12 * scale));
  let answer;
  if (op === "+") answer = left + right;
  if (op === "-") answer = left - right;
  if (op === "×") answer = left * right;
  if (op === "÷") {
    answer = randomInt(2, Math.floor(10 * scale));
    right = randomInt(2, Math.floor(8 * scale));
    left = answer * right;
  }
  return {
    text: `Quick solve: ${left} ${op} ${right} = ?`,
    answer,
  };
}

function generateMixed() {
  const types = ["equation", "sequence", "comparison", "logic", "inequality", "arithmetic"];
  const type = types[randomInt(0, types.length - 1)];
  return generateByType(type);
}

function generateByType(type) {
  switch (type) {
    case "equation":
      return generateEquation();
    case "sequence":
      return generateSequence();
    case "comparison":
      return generateComparison();
    case "logic":
      return generateLogic();
    case "inequality":
      return generateInequality();
    case "arithmetic":
      return generateArithmetic();
    case "mixed":
      return generateMixed();
    default:
      return generateEquation();
  }
}

function setQuestion() {
  const mission = missions[state.missionIndex];
  const type = mission.type === "mixed" ? "mixed" : mission.type;
  const question = generateByType(type);
  state.currentAnswer = question.answer;
  state.currentType = type;
  ui.questionText.textContent = question.text;
  if (question.useChoices) {
    ui.choiceRow.setAttribute("aria-hidden", "false");
  } else {
    ui.choiceRow.setAttribute("aria-hidden", "true");
  }
  ui.answerInput.value = "";
  ui.answerInput.focus();
}

// ------------------------
// Game flow
// ------------------------
function resetMissionState() {
  const mission = missions[state.missionIndex];
  state.solved = 0;
  state.streak = 0;
  state.multiplier = 1;
  state.timeLeft = mission.time;
  state.speedRate = 1;
  state.powerups = { time: 1, double: 1, skip: 1 };
  state.doubleActive = false;
  clearInterval(state.timerId);
  clearTimeout(state.eventTimer);
  clearTimeout(state.doubleTimer);
  state.timerId = null;
  state.event = null;
  setEventBanner("System Ready");
  updatePowerupUI();
  updateProgress();
  updateHUD();
  setQuestion();
}

function startMission() {
  updateMissionInfo();
  resetMissionState();
  showScreen(ui.game);
  startTimer();
  playTone(520);
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timeLeft -= state.speedRate;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endMission(false);
    }
    updateHUD();
  }, 1000);
}

function applyAnswer(isCorrect) {
  if (isCorrect) {
    state.solved += 1;
    state.streak += 1;
    state.multiplier = clamp(1 + Math.floor(state.streak / 3) * 0.5, 1, 3);

    const base = 10 + state.solved * 2;
    const double = state.doubleActive ? 1.5 : 1;
    const delta = Math.round(base * state.multiplier * double);
    state.score += delta;

    ui.questionCard.classList.add("success");
    setTimeout(() => ui.questionCard.classList.remove("success"), 300);
    flash("success");
    playTone(680);

    updateProgress();
    updateHUD();

    if (state.solved >= missions[state.missionIndex].target) {
      endMission(true);
      return;
    }

    maybeTriggerEvent();
    setQuestion();
  } else {
    state.streak = 0;
    state.multiplier = 1;
    state.timeLeft = Math.max(0, state.timeLeft - 3);
    ui.questionCard.classList.add("fail");
    setTimeout(() => ui.questionCard.classList.remove("fail"), 300);
    flash("fail");
    shake();
    playTone(220);
    updateHUD();
  }
}

function parseAnswer() {
  const value = ui.answerInput.value.trim();
  if (value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function submitAnswer() {
  const answer = parseAnswer();
  if (answer === null) return;
  const isCorrect = Number(answer) === Number(state.currentAnswer);
  applyAnswer(isCorrect);
}

// ------------------------
// Events + Power-ups
// ------------------------
function maybeTriggerEvent() {
  if (state.event || missions[state.missionIndex].type === "equation") return;
  const roll = Math.random();
  if (roll > 0.18) return;

  const eventType = Math.random() > 0.5 ? "bonus" : "speed";
  state.event = eventType;

  if (eventType === "bonus") {
    setEventBanner("Bonus Round: +50% score", "var(--success)");
    state.doubleActive = true;
    clearTimeout(state.eventTimer);
    state.eventTimer = setTimeout(() => {
      state.doubleActive = false;
      state.event = null;
      setEventBanner("System Ready");
    }, 12000);
  } else {
    setEventBanner("Speed Round: timer accelerated", "var(--warning)");
    state.speedRate = 1.5;
    clearTimeout(state.eventTimer);
    state.eventTimer = setTimeout(() => {
      state.speedRate = 1;
      state.event = null;
      setEventBanner("System Ready");
    }, 12000);
  }
}

function usePowerup(type) {
  if (state.powerups[type] <= 0) return;
  state.powerups[type] -= 1;
  updatePowerupUI();

  if (type === "time") {
    state.timeLeft += 10;
    playTone(740);
    updateHUD();
    return;
  }

  if (type === "double") {
    state.doubleActive = true;
    setEventBanner("Double Score Active", "var(--success)");
    playTone(620);
    clearTimeout(state.doubleTimer);
    state.doubleTimer = setTimeout(() => {
      state.doubleActive = false;
      if (!state.event) setEventBanner("System Ready");
    }, 15000);
    return;
  }

  if (type === "skip") {
    state.streak = 0;
    state.multiplier = 1;
    state.solved += 1;
    updateProgress();
    updateHUD();
    playTone(460);
    if (state.solved >= missions[state.missionIndex].target) {
      endMission(true);
    } else {
      setQuestion();
    }
  }
}

// ------------------------
// Mission completion
// ------------------------
function endMission(success) {
  clearInterval(state.timerId);
  clearTimeout(state.eventTimer);
  clearTimeout(state.doubleTimer);
  state.timerId = null;
  state.event = null;

  const mission = missions[state.missionIndex];
  if (success) {
    ui.missionSummary.textContent = `Mission ${mission.name} cleared with ${state.score} total score.`;
    playTone(860, 0.12);
    ui.nextMission.textContent = state.missionIndex < missions.length - 1 ? "Deploy Next Mission" : "Restart Protocol";
  } else {
    ui.missionSummary.textContent = `Mission failed. You solved ${state.solved} of ${mission.target}. Try again.`;
    ui.nextMission.textContent = "Retry Mission";
  }

  ui.missionComplete.setAttribute("aria-hidden", "false");
  showScreen(ui.missionComplete);
}

function proceedMission() {
  const mission = missions[state.missionIndex];
  if (state.solved >= mission.target) {
    state.missionIndex = state.missionIndex < missions.length - 1 ? state.missionIndex + 1 : 0;
  }
  ui.missionComplete.setAttribute("aria-hidden", "true");
  startMission();
}

// ------------------------
// Event listeners
// ------------------------
ui.startMissionBtn.addEventListener("click", () => {
  startMission();
});

ui.submitAnswer.addEventListener("click", submitAnswer);
ui.answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitAnswer();
});

ui.choiceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    ui.answerInput.value = btn.dataset.choice;
    submitAnswer();
  });
});

ui.soundToggle.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  ui.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
});

ui.themeToggle.addEventListener("click", () => {
  const body = document.body;
  const magenta = body.classList.toggle("theme-magenta");
  ui.themeToggle.setAttribute("aria-pressed", String(magenta));
});

ui.difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setDifficulty(btn.dataset.difficulty);
    setQuestion();
  });
});

ui.powerTime.addEventListener("click", () => usePowerup("time"));
ui.powerDouble.addEventListener("click", () => usePowerup("double"));
ui.powerSkip.addEventListener("click", () => usePowerup("skip"));

ui.nextMission.addEventListener("click", proceedMission);

// ------------------------
// Initial safe state
// ------------------------
setDifficulty("easy");
updateMissionInfo();
updatePowerupUI();
updateProgress();
updateHUD();
showScreen(ui.intro);
ui.questionText.textContent = "Initialize to receive mission data.";
