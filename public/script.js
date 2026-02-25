// Neon Rift: World-class mission-based brain training

const ui = {
  screens: {
    home: document.getElementById("home"),
    missions: document.getElementById("missions"),
    game: document.getElementById("game"),
    result: document.getElementById("result"),
  },
  homeLevel: document.getElementById("homeLevel"),
  homeXp: document.getElementById("homeXp"),
  homeAchievements: document.getElementById("homeAchievements"),
  startRun: document.getElementById("startRun"),
  openMissions: document.getElementById("openMissions"),
  backHome: document.getElementById("backHome"),
  missionGrid: document.getElementById("missionGrid"),
  dailyRewardPanel: document.getElementById("dailyRewardPanel"),
  dailyText: document.getElementById("dailyText"),
  claimReward: document.getElementById("claimReward"),
  soundToggle: document.getElementById("soundToggle"),
  hudMission: document.getElementById("hudMission"),
  hudObjective: document.getElementById("hudObjective"),
  hudXp: document.getElementById("hudXp"),
  hudScore: document.getElementById("hudScore"),
  hudTime: document.getElementById("hudTime"),
  hudStreak: document.getElementById("hudStreak"),
  hudCombo: document.getElementById("hudCombo"),
  hudLevel: document.getElementById("hudLevel"),
  hudEvent: document.getElementById("hudEvent"),
  objectiveText: document.getElementById("objectiveText"),
  objectiveList: document.getElementById("objectiveList"),
  questionCard: document.getElementById("questionCard"),
  questionText: document.getElementById("questionText"),
  memoryReveal: document.getElementById("memoryReveal"),
  choiceRow: document.getElementById("choiceRow"),
  answerInput: document.getElementById("answerInput"),
  submitAnswer: document.getElementById("submitAnswer"),
  progressText: document.getElementById("progressText"),
  missionProgress: document.getElementById("missionProgress"),
  feedback: document.getElementById("feedback"),
  powerTime: document.getElementById("powerTime"),
  powerDouble: document.getElementById("powerDouble"),
  powerSkip: document.getElementById("powerSkip"),
  powerFreeze: document.getElementById("powerFreeze"),
  powerTimeCount: document.getElementById("powerTimeCount"),
  powerDoubleCount: document.getElementById("powerDoubleCount"),
  powerSkipCount: document.getElementById("powerSkipCount"),
  powerFreezeCount: document.getElementById("powerFreezeCount"),
  achievementList: document.getElementById("achievementList"),
  exitRun: document.getElementById("exitRun"),
  resultTitle: document.getElementById("resultTitle"),
  resultSummary: document.getElementById("resultSummary"),
  nextMission: document.getElementById("nextMission"),
  backToHome: document.getElementById("backToHome"),
  flash: document.getElementById("flash"),
  choiceButtons: Array.from(document.querySelectorAll(".choice-row .chip")),
};

const questionTypes = ["arithmetic", "sequence", "logic", "inequality", "comparison", "memory"];

const missions = [
  { id: 1, name: "Bootlink", type: "arithmetic", target: 8, time: 40, objective: "Solve 8 in 40s" },
  { id: 2, name: "Cipher Ladder", type: "sequence", target: 9, time: 45, objective: "Crack 9 sequences" },
  { id: 3, name: "Logic Echo", type: "logic", target: 10, time: 50, objective: "Spot 10 anomalies" },
  { id: 4, name: "Boss: Neural Gate", type: "mixed", target: 12, time: 55, objective: "Boss challenge: 12 mixed" , boss: true},
  { id: 5, name: "Inequality Mesh", type: "inequality", target: 10, time: 50, objective: "Solve 10 inequalities" },
  { id: 6, name: "Quantum Compare", type: "comparison", target: 12, time: 55, objective: "Compare 12 signals" },
  { id: 7, name: "Memory Drift", type: "memory", target: 10, time: 50, objective: "Recall 10 sequences" },
  { id: 8, name: "Boss: Rift Core", type: "mixed", target: 14, time: 60, objective: "Boss challenge: 14 mixed" , boss: true},
];

const achievements = [
  { id: "first-mission", name: "Rift Initiate", desc: "Clear your first mission" },
  { id: "boss-clear", name: "Boss Breaker", desc: "Clear a boss mission" },
  { id: "streak-10", name: "Combo Architect", desc: "Reach a 10 streak" },
  { id: "score-1000", name: "Score Surge", desc: "Reach 1000 score" },
  { id: "perfect", name: "Flawless Circuit", desc: "Clear a mission with no mistakes" },
];

const state = {
  missionIndex: 0,
  score: 0,
  xp: 0,
  level: 1,
  streak: 0,
  combo: 1,
  solved: 0,
  mistakes: 0,
  timeLeft: 0,
  timerId: null,
  event: null,
  eventTimer: null,
  speedRate: 1,
  freezeActive: false,
  freezeTimer: null,
  doubleActive: false,
  doubleTimer: null,
  currentAnswer: null,
  currentType: "arithmetic",
  memoryRevealActive: false,
  powerups: { time: 1, double: 1, skip: 1, freeze: 1 },
  achievementsUnlocked: new Set(),
  soundEnabled: true,
  missionXpEarned: 0,
};

// ------------------------
// Utilities
// ------------------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function showScreen(target) {
  Object.values(ui.screens).forEach((screen) => screen.classList.remove("active"));
  target.classList.add("active");
}

function flash(type) {
  ui.flash.classList.remove("success", "fail");
  void ui.flash.offsetWidth;
  ui.flash.classList.add(type);
}

function setFeedback(text, type = "") {
  ui.feedback.textContent = text;
  ui.feedback.style.color = type === "good" ? "var(--success)" : type === "bad" ? "var(--danger)" : "";
}

// ------------------------
// Audio
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
// Persistence
// ------------------------
function loadProfile() {
  const saved = JSON.parse(localStorage.getItem("neonRiftProfile") || "{}");
  state.xp = saved.xp || 0;
  state.level = saved.level || 1;
  state.achievementsUnlocked = new Set(saved.achievements || []);
}

function saveProfile() {
  localStorage.setItem(
    "neonRiftProfile",
    JSON.stringify({
      xp: state.xp,
      level: state.level,
      achievements: Array.from(state.achievementsUnlocked),
    })
  );
}

// ------------------------
// XP + Leveling
// ------------------------
function xpToNextLevel(level) {
  return 100 + level * 40;
}

function addXp(amount) {
  state.xp += amount;
  let needed = xpToNextLevel(state.level);
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    grantPowerupBonus();
    needed = xpToNextLevel(state.level);
    playTone(920, 0.12);
  }
  saveProfile();
  updateHomeStats();
  updateHudStats();
}

function grantPowerupBonus() {
  state.powerups.time += 1;
  state.powerups.double += 1;
  state.powerups.freeze += 1;
  updatePowerupUI();
}

// ------------------------
// Achievements
// ------------------------
function unlockAchievement(id) {
  if (state.achievementsUnlocked.has(id)) return;
  state.achievementsUnlocked.add(id);
  saveProfile();
  updateAchievementUI();
}

function updateAchievementUI() {
  ui.achievementList.innerHTML = "";
  achievements.forEach((ach) => {
    const row = document.createElement("div");
    row.className = "achievement";
    row.innerHTML = `<span>${ach.name}</span><span class="tag">${
      state.achievementsUnlocked.has(ach.id) ? "Unlocked" : "Locked"
    }</span>`;
    ui.achievementList.appendChild(row);
  });
  ui.homeAchievements.textContent = String(state.achievementsUnlocked.size);
}

// ------------------------
// Daily Rewards
// ------------------------
function refreshDailyReward() {
  const lastClaim = localStorage.getItem("neonRiftRewardDate");
  const today = formatDateKey();
  if (lastClaim === today) {
    ui.dailyText.textContent = "Reward claimed. Come back tomorrow.";
    ui.claimReward.disabled = true;
  } else {
    ui.dailyText.textContent = "Claim +20 XP and 1 random power-up.";
    ui.claimReward.disabled = false;
  }
}

function claimDailyReward() {
  const today = formatDateKey();
  localStorage.setItem("neonRiftRewardDate", today);
  addXp(20);
  const keys = Object.keys(state.powerups);
  const pick = keys[randomInt(0, keys.length - 1)];
  state.powerups[pick] += 1;
  updatePowerupUI();
  refreshDailyReward();
  playTone(780, 0.12);
}

// ------------------------
// Missions + UI
// ------------------------
function updateHomeStats() {
  ui.homeLevel.textContent = String(state.level);
  ui.homeXp.textContent = String(state.xp);
}

function updateHudStats() {
  ui.hudLevel.textContent = String(state.level);
  ui.hudXp.textContent = String(state.xp);
  ui.hudScore.textContent = String(state.score);
  ui.hudTime.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
  ui.hudStreak.textContent = String(state.streak);
  ui.hudCombo.textContent = `x${state.combo.toFixed(1)}`.replace(".0", "");
}

function updatePowerupUI() {
  ui.powerTimeCount.textContent = `x${state.powerups.time}`;
  ui.powerDoubleCount.textContent = `x${state.powerups.double}`;
  ui.powerSkipCount.textContent = `x${state.powerups.skip}`;
  ui.powerFreezeCount.textContent = `x${state.powerups.freeze}`;
  ui.powerTime.disabled = state.powerups.time <= 0;
  ui.powerDouble.disabled = state.powerups.double <= 0;
  ui.powerSkip.disabled = state.powerups.skip <= 0;
  ui.powerFreeze.disabled = state.powerups.freeze <= 0;
}

function updateProgress() {
  const mission = missions[state.missionIndex];
  const ratio = clamp(state.solved / mission.target, 0, 1);
  ui.missionProgress.style.width = `${ratio * 100}%`;
  ui.progressText.textContent = `${state.solved} / ${mission.target}`;
}

function updateObjectives() {
  const mission = missions[state.missionIndex];
  ui.hudMission.textContent = `${mission.id}. ${mission.name}`;
  ui.hudObjective.textContent = mission.objective;
  ui.objectiveText.textContent = mission.objective;
  ui.objectiveList.innerHTML = "";
  const items = [
    mission.objective,
    "Maintain streaks to boost combo",
    mission.boss ? "Boss mission: fewer power-ups" : "Random events can trigger bonuses",
  ];
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ui.objectiveList.appendChild(li);
  });
}

function renderMissionGrid() {
  ui.missionGrid.innerHTML = "";
  missions.forEach((mission, index) => {
    const card = document.createElement("div");
    card.className = "mission-card";
    card.innerHTML = `
      <div class="mission-tag">${mission.boss ? "Boss" : "Mission"}</div>
      <div class="value">${mission.id}. ${mission.name}</div>
      <div class="sub">${mission.objective}</div>
    `;
    card.addEventListener("click", () => {
      state.missionIndex = index;
      startMission();
    });
    ui.missionGrid.appendChild(card);
  });
}

// ------------------------
// Question Generators
// ------------------------
function generateArithmetic() {
  const ops = ["+", "-", "×", "÷"];
  const op = ops[randomInt(0, ops.length - 1)];
  let left = randomInt(6, 18);
  let right = randomInt(2, 12);
  let answer;
  if (op === "+") answer = left + right;
  if (op === "-") answer = left - right;
  if (op === "×") answer = left * right;
  if (op === "÷") {
    answer = randomInt(2, 10);
    right = randomInt(2, 8);
    left = answer * right;
  }
  return { text: `Solve: ${left} ${op} ${right}`, answer };
}

function generateSequence() {
  const start = randomInt(2, 10);
  const step = randomInt(2, 6);
  const bump = randomInt(1, 3);
  const seq = [start, start + step, start + step + (step + bump), start + step * 3 + bump * 2];
  const answer = seq[3] + step + bump * 2;
  return { text: `Sequence: ${seq.join(", ")}, ?`, answer };
}

function generateLogic() {
  const base = randomInt(3, 8);
  const step = randomInt(2, 5);
  const list = [base, base + step, base + step * 2, base + step * 3, base + step * 4];
  const outlier = base + step * randomInt(6, 8) + randomInt(1, 4);
  const slot = randomInt(1, list.length - 1);
  list.splice(slot, 0, outlier);
  return { text: `Find the anomaly: ${list.join(", ")}`, answer: outlier };
}

function generateInequality() {
  const a = randomInt(2, 6);
  const b = randomInt(-6, 10);
  const x = randomInt(3, 10);
  const c = a * x + b;
  const answer = Math.ceil((c - b) / a);
  return { text: `Solve: ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} ≥ ${c}. Smallest x?`, answer };
}

function generateComparison() {
  const left = randomInt(10, 40);
  const right = randomInt(10, 40);
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
    text: `Compare: (${leftExpr}) vs (${rightExpr}). 1=Left, 2=Right, 0=Equal.`,
    answer,
    useChoices: true,
  };
}

function generateMemory() {
  const length = randomInt(4, 6);
  const sequence = Array.from({ length }, () => randomInt(1, 9));
  const index = randomInt(1, length - 2);
  const answer = sequence[index];
  return {
    text: `Memorize and recall: What was the ${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "th"} number?`,
    answer,
    memory: sequence,
  };
}

function generateByType(type) {
  switch (type) {
    case "arithmetic":
      return generateArithmetic();
    case "sequence":
      return generateSequence();
    case "logic":
      return generateLogic();
    case "inequality":
      return generateInequality();
    case "comparison":
      return generateComparison();
    case "memory":
      return generateMemory();
    default:
      return generateArithmetic();
  }
}

// ------------------------
// Game Flow
// ------------------------
function resetRunState() {
  const mission = missions[state.missionIndex];
  state.score = 0;
  state.streak = 0;
  state.combo = 1;
  state.solved = 0;
  state.mistakes = 0;
  state.missionXpEarned = 0;
  state.timeLeft = mission.time;
  state.speedRate = 1;
  state.event = null;
  state.freezeActive = false;
  state.doubleActive = false;
  state.powerups = mission.boss
    ? { time: 1, double: 1, skip: 0, freeze: 1 }
    : { time: 1, double: 1, skip: 1, freeze: 1 };
  updatePowerupUI();
  updateObjectives();
  updateProgress();
  updateHudStats();
  setFeedback("Ready");
}

function startMission() {
  resetTimers();
  resetRunState();
  showScreen(ui.screens.game);
  setQuestion();
  startTimer();
  playTone(520);
}

function resetTimers() {
  clearInterval(state.timerId);
  clearTimeout(state.eventTimer);
  clearTimeout(state.freezeTimer);
  clearTimeout(state.doubleTimer);
}

function startTimer() {
  state.timerId = setInterval(() => {
    if (!state.freezeActive) {
      state.timeLeft -= state.speedRate;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        endMission(false);
      }
    }
    updateHudStats();
  }, 1000);
}

function setQuestion() {
  const mission = missions[state.missionIndex];
  const type = mission.type === "mixed" ? questionTypes[randomInt(0, questionTypes.length - 1)] : mission.type;
  const question = generateByType(type);
  state.currentType = type;
  state.currentAnswer = question.answer;
  ui.questionText.textContent = question.text;
  ui.answerInput.value = "";

  if (question.useChoices) {
    ui.choiceRow.setAttribute("aria-hidden", "false");
  } else {
    ui.choiceRow.setAttribute("aria-hidden", "true");
  }

  if (question.memory) {
    ui.memoryReveal.setAttribute("aria-hidden", "false");
    ui.memoryReveal.textContent = `Memory: ${question.memory.join(" ")}`;
    state.memoryRevealActive = true;
    setTimeout(() => {
      ui.memoryReveal.textContent = "Memory hidden";
      state.memoryRevealActive = false;
    }, 2200);
  } else {
    ui.memoryReveal.setAttribute("aria-hidden", "true");
    ui.memoryReveal.textContent = "";
  }

  ui.answerInput.focus();
}

function parseAnswer() {
  const value = ui.answerInput.value.trim();
  if (!value) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function applyCorrect() {
  state.solved += 1;
  state.streak += 1;
  state.combo = clamp(1 + Math.floor(state.streak / 4) * 0.5, 1, 3);
  const base = 12 + state.solved * 2;
  const double = state.doubleActive ? 1.5 : 1;
  const eventBonus = state.event === "bonus" ? 1.3 : 1;
  const delta = Math.round(base * state.combo * double * eventBonus);
  state.score += delta;
  const xpGain = 5 + Math.floor(state.combo) + (state.event === "accuracy" ? 2 : 0);
  state.missionXpEarned += xpGain;
  addXp(xpGain);

  ui.questionCard.classList.add("success");
  setTimeout(() => ui.questionCard.classList.remove("success"), 250);
  flash("success");
  setFeedback(`+${delta} score`, "good");
  playTone(700);

  if (state.streak >= 10) unlockAchievement("streak-10");
  if (state.score >= 1000) unlockAchievement("score-1000");

  updateProgress();
  updateHudStats();

  if (state.solved >= missions[state.missionIndex].target) {
    endMission(true);
  } else {
    maybeTriggerEvent();
    setQuestion();
  }
}

function applyWrong() {
  state.mistakes += 1;
  state.streak = 0;
  state.combo = 1;
  const penalty = state.event === "accuracy" ? 6 : 3;
  state.timeLeft = Math.max(0, state.timeLeft - penalty);
  ui.questionCard.classList.add("fail");
  setTimeout(() => ui.questionCard.classList.remove("fail"), 250);
  flash("fail");
  setFeedback("Incorrect", "bad");
  playTone(220);
  updateHudStats();
}

function submitAnswer() {
  if (state.memoryRevealActive) return;
  const answer = parseAnswer();
  if (answer === null) return;
  const isCorrect = Number(answer) === Number(state.currentAnswer);
  if (isCorrect) applyCorrect();
  else applyWrong();
}

// ------------------------
// Events + Power-Ups
// ------------------------
function maybeTriggerEvent() {
  if (state.event || missions[state.missionIndex].boss) return;
  if (Math.random() > 0.2) return;
  const types = ["bonus", "speed", "accuracy"];
  const event = types[randomInt(0, types.length - 1)];
  state.event = event;
  if (event === "bonus") {
    ui.hudEvent.textContent = "Bonus Round";
  }
  if (event === "speed") {
    ui.hudEvent.textContent = "Speed Round";
    state.speedRate = 1.5;
  }
  if (event === "accuracy") {
    ui.hudEvent.textContent = "Accuracy Round";
  }

  clearTimeout(state.eventTimer);
  state.eventTimer = setTimeout(() => {
    state.event = null;
    state.speedRate = 1;
    ui.hudEvent.textContent = "None";
  }, 12000);
}

function usePowerup(type) {
  if (state.powerups[type] <= 0) return;
  state.powerups[type] -= 1;
  updatePowerupUI();

  if (type === "time") {
    state.timeLeft += 10;
    setFeedback("+10s", "good");
    playTone(760);
    updateHudStats();
    return;
  }

  if (type === "double") {
    state.doubleActive = true;
    setFeedback("Double score", "good");
    playTone(640);
    clearTimeout(state.doubleTimer);
    state.doubleTimer = setTimeout(() => {
      state.doubleActive = false;
    }, 12000);
    return;
  }

  if (type === "skip") {
    state.streak = 0;
    state.combo = 1;
    state.solved += 1;
    updateProgress();
    updateHudStats();
    playTone(500);
    if (state.solved >= missions[state.missionIndex].target) {
      endMission(true);
    } else {
      setQuestion();
    }
    return;
  }

  if (type === "freeze") {
    state.freezeActive = true;
    setFeedback("Time frozen", "good");
    playTone(820);
    clearTimeout(state.freezeTimer);
    state.freezeTimer = setTimeout(() => {
      state.freezeActive = false;
    }, 6000);
  }
}

// ------------------------
// Mission Completion
// ------------------------
function endMission(success) {
  resetTimers();
  ui.hudEvent.textContent = "None";

  const mission = missions[state.missionIndex];
  if (success) {
    ui.resultTitle.textContent = mission.boss ? "Boss Cleared" : "Mission Complete";
    ui.resultSummary.textContent = `Score ${state.score}. Solved ${state.solved}/${mission.target}. XP +${state.missionXpEarned}.`;
    if (mission.boss) unlockAchievement("boss-clear");
    if (state.missionIndex === 0) unlockAchievement("first-mission");
    if (state.mistakes === 0) unlockAchievement("perfect");
    playTone(920, 0.12);
  } else {
    ui.resultTitle.textContent = "Mission Failed";
    ui.resultSummary.textContent = `Solved ${state.solved}/${mission.target}. Try again.`;
    playTone(260, 0.12);
  }
  showScreen(ui.screens.result);
}

function proceedMission() {
  state.missionIndex = state.missionIndex < missions.length - 1 ? state.missionIndex + 1 : 0;
  startMission();
}

// ------------------------
// Event Listeners
// ------------------------
ui.startRun.addEventListener("click", () => {
  state.missionIndex = 0;
  startMission();
});

ui.openMissions.addEventListener("click", () => {
  renderMissionGrid();
  showScreen(ui.screens.missions);
});

ui.backHome.addEventListener("click", () => {
  showScreen(ui.screens.home);
});

ui.exitRun.addEventListener("click", () => {
  showScreen(ui.screens.home);
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

ui.powerTime.addEventListener("click", () => usePowerup("time"));
ui.powerDouble.addEventListener("click", () => usePowerup("double"));
ui.powerSkip.addEventListener("click", () => usePowerup("skip"));
ui.powerFreeze.addEventListener("click", () => usePowerup("freeze"));

ui.soundToggle.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  ui.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
});

ui.claimReward.addEventListener("click", claimDailyReward);

ui.nextMission.addEventListener("click", proceedMission);
ui.backToHome.addEventListener("click", () => showScreen(ui.screens.home));

// ------------------------
// Initial State
// ------------------------
loadProfile();
updateHomeStats();
updateAchievementUI();
refreshDailyReward();
updatePowerupUI();
showScreen(ui.screens.home);
ui.hudEvent.textContent = "None";
ui.questionText.textContent = "Initialize the Neon Rift...";
