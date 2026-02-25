const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const STORAGE_KEY = "neonRiftState";

const defaultState = {
  profile: {
    xp: 0,
    level: 1,
    missionsCompleted: 0,
    achievements: [],
    powerups: {
      time: 2,
      double: 2,
      skip: 2,
      freeze: 2,
    },
    daily: {
      lastClaim: null,
      streak: 0,
    },
  },
  bestScores: {},
  settings: {
    sound: true,
  },
  missionUnlock: 1,
};

const state = loadState();
const missions = buildMissions();

const run = {
  active: false,
  mission: null,
  timeLeft: 0,
  timerId: null,
  lastTick: 0,
  score: 0,
  streak: 0,
  combo: 1,
  comboPeak: 1,
  xpGained: 0,
  questions: 0,
  correct: 0,
  memory: [],
  event: null,
  eventEnds: 0,
  riskArmed: false,
  achievementsUnlocked: [],
  eventsTriggered: 0,
  freezeUntil: 0,
};

const elements = {
  screens: {
    home: $("#home"),
    missions: $("#missions"),
    game: $("#game"),
    results: $("#results"),
  },
  soundToggle: $("#soundToggle"),
  soundState: $("#soundState"),
  resetProgress: $("#resetProgress"),
  startRun: $("#startRun"),
  openMissions: $("#openMissions"),
  backHome: $("#backHome"),
  missionGrid: $("#missionGrid"),
  homeLevel: $("#homeLevel"),
  homeXp: $("#homeXp"),
  homeMissions: $("#homeMissions"),
  homeAchievements: $("#homeAchievements"),
  dailyText: $("#dailyText"),
  dailyRewardPanel: $("#dailyRewardPanel"),
  claimReward: $("#claimReward"),
  homeMicro: $("#homeMicro"),
  hudMission: $("#hudMission"),
  hudObjective: $("#hudObjective"),
  hudXp: $("#hudXp"),
  hudScore: $("#hudScore"),
  hudTime: $("#hudTime"),
  hudStreak: $("#hudStreak"),
  hudCombo: $("#hudCombo"),
  hudLevel: $("#hudLevel"),
  hudEvent: $("#hudEvent"),
  missionType: $("#missionType"),
  runStatus: $("#runStatus"),
  objectiveList: $("#objectiveList"),
  powerGrid: $("#powerGrid"),
  runAchievements: $("#runAchievements"),
  questionText: $("#questionText"),
  questionSub: $("#questionSub"),
  choiceRow: $("#choiceRow"),
  inputRow: $("#inputRow"),
  answerInput: $("#answerInput"),
  submitAnswer: $("#submitAnswer"),
  keypad: $("#keypad"),
  progressFill: $("#progressFill"),
  feedback: $("#feedback"),
  resultsTitle: $("#resultsTitle"),
  resultsSubtitle: $("#resultsSubtitle"),
  resultsSummary: $("#resultsSummary"),
  resultsRewards: $("#resultsRewards"),
  resultsAchievements: $("#resultsAchievements"),
  nextMission: $("#nextMission"),
  replayMission: $("#replayMission"),
  resultsHome: $("#resultsHome"),
};

const achievementList = [
  { id: "first-blood", name: "First Blood", desc: "Solve your first prompt." },
  { id: "hot-streak", name: "Hot Streak", desc: "Reach a streak of 5." },
  { id: "combo-master", name: "Combo Master", desc: "Hit combo x4." },
  { id: "boss-breaker", name: "Boss Breaker", desc: "Defeat a boss mission." },
  { id: "flawless", name: "Flawless Flow", desc: "Finish with 100% accuracy." },
  { id: "speed-demon", name: "Speed Demon", desc: "Finish with 50% time remaining." },
  { id: "rift-tamer", name: "Rift Tamer", desc: "Trigger 3 rift events." },
  { id: "risk-taker", name: "Risk Taker", desc: "Win a Risk Mode question." },
];

const powerupDefs = {
  time: { label: "Extra Time", desc: "+10s" },
  double: { label: "Double XP", desc: "15s boost" },
  skip: { label: "Skip", desc: "Skip prompt" },
  freeze: { label: "Freeze", desc: "Pause 5s" },
};

const eventDefs = [
  { id: "overclock", name: "Overclock", desc: "Double XP" },
  { id: "dilation", name: "Time Dilation", desc: "Timer slows" },
  { id: "flux", name: "Flux Surge", desc: "Streak +1 bonus" },
];

const microcopy = [
  "Neural oscillation stable.",
  "Rift sensors online.",
  "Cognitive lattice engaged.",
  "Signal integrity: optimal.",
  "Quantum relay synchronized.",
];

init();

function init() {
  buildKeypad();
  bindEvents();
  renderHome();
  renderMissions();
  setScreen("home");
}

function bindEvents() {
  elements.startRun.addEventListener("click", () => startMission(missions[0]));
  elements.openMissions.addEventListener("click", () => setScreen("missions"));
  elements.backHome.addEventListener("click", () => setScreen("home"));
  elements.resultsHome.addEventListener("click", () => setScreen("home"));
  elements.nextMission.addEventListener("click", () => goNextMission());
  elements.replayMission.addEventListener("click", () => replayMission());
  elements.claimReward.addEventListener("click", claimDailyReward);
  elements.soundToggle.addEventListener("click", toggleSound);
  elements.resetProgress.addEventListener("click", resetProgress);
  elements.submitAnswer.addEventListener("click", () => handleSubmit());
  elements.answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  });
}

function resetProgress() {
  Object.assign(state, structuredClone(defaultState));
  saveState();
  renderHome();
  renderMissions();
  setScreen("home");
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  elements.soundToggle.setAttribute("aria-pressed", state.settings.sound);
  elements.soundState.textContent = state.settings.sound ? "On" : "Off";
  saveState();
}

function setScreen(name) {
  Object.values(elements.screens).forEach((screen) => screen.classList.remove("active"));
  elements.screens[name].classList.add("active");
}

function renderHome() {
  state.profile.level = levelFromXp(state.profile.xp);
  elements.homeLevel.textContent = state.profile.level;
  elements.homeXp.textContent = state.profile.xp;
  elements.homeMissions.textContent = state.profile.missionsCompleted;
  elements.homeAchievements.textContent = state.profile.achievements.length;
  elements.soundState.textContent = state.settings.sound ? "On" : "Off";
  elements.soundToggle.setAttribute("aria-pressed", state.settings.sound);
  elements.homeMicro.textContent = microcopy[Math.floor(Math.random() * microcopy.length)];
  updateDailyRewardUI();
}

function renderMissions() {
  elements.missionGrid.innerHTML = "";
  missions.forEach((mission) => {
    const card = document.createElement("div");
    card.className = "mission-card" + (mission.isBoss ? " boss" : "");
    const unlocked = mission.id <= state.missionUnlock;
    if (!unlocked) card.classList.add("locked");
    card.innerHTML = `
      <div class="mission-tag">${mission.isBoss ? "Boss Mission" : mission.typeLabel}</div>
      <div class="mission-title">Mission ${mission.id}</div>
      <div class="mission-meta">${mission.title}</div>
      <div class="mission-meta">Difficulty ${mission.difficulty}</div>
      <div class="mission-meta">Best Score: ${state.bestScores[mission.id] || "--"}</div>
    `;
    card.addEventListener("click", () => {
      if (!unlocked) return;
      startMission(mission);
    });
    elements.missionGrid.appendChild(card);
  });
}

function startMission(mission) {
  cleanupRun();
  run.active = true;
  run.mission = mission;
  run.timeLeft = mission.timeLimit;
  run.lastTick = performance.now();
  run.score = 0;
  run.streak = 0;
  run.combo = 1;
  run.comboPeak = 1;
  run.xpGained = 0;
  run.questions = 0;
  run.correct = 0;
  run.memory = [];
  run.event = null;
  run.eventEnds = 0;
  run.riskArmed = false;
  run.achievementsUnlocked = [];
  run.eventsTriggered = 0;
  run.freezeUntil = 0;

  renderRunUI();
  setScreen("game");
  nextQuestion();
  run.timerId = setInterval(tick, 100);
}

function replayMission() {
  if (run.mission) {
    startMission(run.mission);
  }
}

function goNextMission() {
  const nextId = run.mission ? run.mission.id + 1 : 1;
  const next = missions.find((m) => m.id === nextId) || missions[0];
  startMission(next);
}

function renderRunUI() {
  elements.hudMission.textContent = run.mission.id;
  elements.hudObjective.textContent = run.mission.objective;
  elements.hudLevel.textContent = state.profile.level;
  elements.missionType.textContent = run.mission.typeLabel;
  elements.runStatus.textContent = "Neural link active";
  renderObjectives();
  renderPowerups();
  renderRunAchievements();
  updateHud();
}

function renderObjectives() {
  elements.objectiveList.innerHTML = "";
  const list = [
    `Solve ${run.mission.targetCount} prompts`,
    `Accuracy ${run.mission.minAccuracy}%`,
    `Time limit ${formatTime(run.mission.timeLimit)}`,
  ];
  if (run.mission.isBoss) list.push("Boss mechanics enabled");
  list.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    elements.objectiveList.appendChild(li);
  });
}

function renderPowerups() {
  elements.powerGrid.innerHTML = "";
  Object.entries(powerupDefs).forEach(([key, data]) => {
    const card = document.createElement("div");
    card.className = "power-card";
    const count = state.profile.powerups[key] || 0;
    card.innerHTML = `
      <div class="panel-title">${data.label}</div>
      <div class="panel-list">${data.desc}</div>
      <button class="btn small" data-power="${key}" ${count === 0 ? "disabled" : ""}>
        Use (${count})
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => usePowerup(key));
    elements.powerGrid.appendChild(card);
  });
}

function renderRunAchievements() {
  elements.runAchievements.innerHTML = "";
  if (run.achievementsUnlocked.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No achievements yet.";
    elements.runAchievements.appendChild(li);
    return;
  }
  run.achievementsUnlocked.forEach((id) => {
    const data = achievementList.find((a) => a.id === id);
    const li = document.createElement("li");
    li.textContent = data ? data.name : id;
    elements.runAchievements.appendChild(li);
  });
}

function updateHud() {
  elements.hudXp.textContent = run.xpGained;
  elements.hudScore.textContent = run.score;
  elements.hudTime.textContent = formatTime(run.timeLeft);
  elements.hudStreak.textContent = run.streak;
  elements.hudCombo.textContent = `x${run.combo}`;
  elements.hudEvent.textContent = run.event ? run.event.name : "None";
}

function buildKeypad() {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "←", "OK"];
  keys.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => handleKeypad(label));
    elements.keypad.appendChild(btn);
  });
}

function handleKeypad(label) {
  if (label === "OK") {
    handleSubmit();
    return;
  }
  if (label === "←") {
    elements.answerInput.value = elements.answerInput.value.slice(0, -1);
    return;
  }
  elements.answerInput.value += label;
  elements.answerInput.focus();
}

function handleSubmit() {
  if (!run.active) return;
  const current = run.currentQuestion;
  if (!current) return;
  const value = elements.answerInput.value.trim();
  if (current.mode === "choice") return;
  if (value === "") return;
  const numeric = Number(value);
  submitAnswer(numeric);
}

function submitAnswer(answer) {
  const current = run.currentQuestion;
  if (!current) return;
  elements.answerInput.value = "";
  const isCorrect = answer === current.answer;
  handleResult(isCorrect);
}

function submitChoice(answer) {
  const current = run.currentQuestion;
  if (!current) return;
  const isCorrect = answer === current.answer;
  handleResult(isCorrect);
}

function handleResult(isCorrect) {
  run.questions += 1;
  if (isCorrect) {
    run.correct += 1;
    run.streak += 1;
    if (run.streak % 3 === 0) run.combo += 1;
    if (run.combo > run.comboPeak) run.comboPeak = run.combo;
    const baseXp = 10 + run.mission.difficulty * 3;
    const eventMultiplier = run.event && run.event.id === "overclock" ? 2 : 1;
    let xpGain = Math.round(baseXp * run.combo * eventMultiplier);
    let scoreGain = xpGain * 2;
    if (run.riskArmed) {
      xpGain *= 3;
      scoreGain *= 2;
      run.riskArmed = false;
      unlockAchievement("risk-taker");
    }
    run.xpGained += xpGain;
    run.score += scoreGain;
    elements.feedback.textContent = `Correct. +${xpGain} XP`;
    if (run.event && run.event.id === "flux") {
      run.streak += 1;
      elements.feedback.textContent += " | Flux bonus +1 streak";
    }
  } else {
    run.streak = 0;
    run.combo = 1;
    if (run.riskArmed) {
      run.xpGained = Math.max(0, run.xpGained - 20);
      run.riskArmed = false;
      elements.feedback.textContent = "Risk failed. XP drained.";
    } else {
      elements.feedback.textContent = "Incorrect. Stabilize and retry.";
    }
  }

  updateAchievementsOnResult();
  updateHud();
  updateProgress();
  nextQuestionOrEnd();
}

function nextQuestionOrEnd() {
  if (run.questions >= run.mission.targetCount) {
    endMission();
    return;
  }
  nextQuestion();
}

function nextQuestion() {
  maybeTriggerEvent();
  const question = buildQuestion(run.mission);
  run.currentQuestion = question;
  renderQuestion(question);
}

function renderQuestion(question) {
  elements.choiceRow.innerHTML = "";
  elements.choiceRow.classList.add("hidden");
  elements.inputRow.classList.remove("hidden");
  elements.answerInput.value = "";
  elements.answerInput.focus();
  elements.questionText.textContent = question.prompt;
  elements.questionSub.textContent = question.sub || "";

  if (question.mode === "choice") {
    elements.inputRow.classList.add("hidden");
    elements.choiceRow.classList.remove("hidden");
    question.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "btn ghost";
      btn.textContent = choice.label;
      btn.addEventListener("click", () => submitChoice(choice.value));
      elements.choiceRow.appendChild(btn);
    });
  }

  if (question.mode === "memory") {
    elements.questionSub.textContent = "Memorize this expression";
    setTimeout(() => {
      if (run.currentQuestion !== question) return;
      elements.questionText.textContent = "What was the answer?";
      elements.questionSub.textContent = question.memoryPrompt;
    }, question.revealDelay);
  }
}

function buildQuestion(mission) {
  if (mission.isBoss) {
    return buildBossQuestion(mission);
  }
  if (useMemoryEcho()) return buildMemoryEcho();
  if (Math.random() < 0.12) return buildGlitch(mission);
  switch (mission.type) {
    case "compare":
      return buildComparison(mission);
    case "memory":
      return buildMemory(mission);
    case "pattern":
      return buildPattern(mission);
    case "accuracy":
      return buildArithmetic(mission, ["+", "-", "*"]);
    case "time":
      return buildArithmetic(mission, ["+", "-", "*"]);
    default:
      return buildArithmetic(mission, ["+", "-", "*"]);
  }
}

function buildArithmetic(mission, ops) {
  const range = 6 + mission.difficulty * 3;
  const a = rand(2, range);
  const b = rand(2, range);
  const op = ops[rand(0, ops.length - 1)];
  let answer;
  if (op === "+") answer = a + b;
  if (op === "-") answer = a - b;
  if (op === "*") answer = a * b;
  if (op === "/") answer = Math.round(a / b);
  const prompt = `${a} ${op} ${b} = ?`;
  storeMemory(prompt, answer);
  return { prompt, answer, mode: "input" };
}

function buildComparison(mission) {
  const range = 8 + mission.difficulty * 4;
  const left = rand(2, range) * rand(2, 6);
  const right = rand(2, range) + rand(2, range);
  const prompt = "Which side is larger?";
  const answer = left > right ? "L" : "R";
  storeMemory(`${left} vs ${right}`, answer);
  return {
    prompt,
    sub: `${left}  vs  ${right}`,
    answer,
    mode: "choice",
    choices: [
      { label: "Left", value: "L" },
      { label: "Right", value: "R" },
    ],
  };
}

function buildMemory(mission) {
  const range = 5 + mission.difficulty * 2;
  const a = rand(2, range);
  const b = rand(2, range);
  const answer = a + b;
  const prompt = `${a} + ${b} = ?`;
  storeMemory(prompt, answer);
  return {
    prompt,
    answer,
    mode: "memory",
    revealDelay: 1200,
    memoryPrompt: `${a} + ${b}`,
  };
}

function buildPattern(mission) {
  const start = rand(2, 8 + mission.difficulty);
  const step = rand(2, 4 + mission.difficulty);
  const seq = [start, start + step, start + step * 2, start + step * 3];
  const prompt = `${seq[0]}, ${seq[1]}, ${seq[2]}, ?`;
  const answer = seq[3];
  storeMemory(prompt, answer);
  return { prompt, answer, mode: "input" };
}

function buildGlitch(mission) {
  const range = 8 + mission.difficulty * 3;
  const a = rand(2, range);
  const b = rand(2, range);
  const answer = a + b;
  const prompt = `Corrupted: ${a} + ? = ${answer}`;
  storeMemory(prompt, b);
  return { prompt, answer: b, mode: "input", sub: "AI Glitch detected. Repair the missing value." };
}

function buildMemoryEcho() {
  const echo = run.memory[rand(0, run.memory.length - 1)];
  return {
    prompt: "Memory Echo",
    sub: `${echo.prompt}`,
    answer: echo.answer,
    mode: "input",
  };
}

function buildBossQuestion(mission) {
  const roll = Math.random();
  if (roll < 0.33) return buildArithmetic(mission, ["+", "-", "*"]);
  if (roll < 0.66) return buildComparison(mission);
  return buildGlitch(mission);
}

function storeMemory(prompt, answer) {
  run.memory.push({ prompt, answer });
  if (run.memory.length > 6) run.memory.shift();
}

function useMemoryEcho() {
  if (run.memory.length < 3) return false;
  return Math.random() < 0.18;
}

function maybeTriggerEvent() {
  const now = performance.now();
  if (run.event && now < run.eventEnds) return;
  run.event = null;
  if (Math.random() < 0.25) {
    const chosen = eventDefs[rand(0, eventDefs.length - 1)];
    run.event = chosen;
    run.eventEnds = now + 10000;
    run.eventsTriggered += 1;
    elements.runStatus.textContent = `${chosen.name} engaged`;
    elements.feedback.textContent = chosen.desc;
  }
}

function tick() {
  if (!run.active) return;
  const now = performance.now();
  const delta = (now - run.lastTick) / 1000;
  run.lastTick = now;
  if (now < run.freezeUntil) {
    updateHud();
    return;
  }
  const timeScale = run.event && run.event.id === "dilation" ? 0.5 : 1;
  run.timeLeft = Math.max(0, run.timeLeft - delta * timeScale);
  updateHud();
  if (run.timeLeft <= 0) {
    endMission();
  }
}

function updateProgress() {
  const progress = Math.min(1, run.questions / run.mission.targetCount);
  elements.progressFill.style.width = `${progress * 100}%`;
}

function endMission() {
  cleanupRun();
  run.active = false;
  const accuracy = run.questions === 0 ? 0 : Math.round((run.correct / run.questions) * 100);
  const timeLeft = Math.round(run.timeLeft);
  const success = accuracy >= run.mission.minAccuracy && run.questions >= run.mission.targetCount;
  if (success) {
    state.profile.xp += run.xpGained;
    state.profile.missionsCompleted += 1;
    if (run.mission.id >= state.missionUnlock && run.mission.id < missions.length) {
      state.missionUnlock = run.mission.id + 1;
    }
  }

  state.profile.level = levelFromXp(state.profile.xp);
  state.bestScores[run.mission.id] = Math.max(state.bestScores[run.mission.id] || 0, run.score);
  awardPowerups(success);
  finalizeAchievements(success, accuracy, timeLeft);
  saveState();
  renderHome();
  renderMissions();
  renderResults(success, accuracy, timeLeft);
  setScreen("results");
}

function cleanupRun() {
  if (run.timerId) clearInterval(run.timerId);
  run.timerId = null;
}

function renderResults(success, accuracy, timeLeft) {
  elements.resultsTitle.textContent = success ? "Mission Complete" : "Mission Failed";
  elements.resultsSubtitle.textContent = success
    ? "Rift stabilized. System secure."
    : "Rift destabilized. Train and retry.";

  const summary = [
    `Score: ${run.score}`,
    `XP gained: ${run.xpGained}`,
    `Accuracy: ${accuracy}%`,
    `Prompts answered: ${run.questions}`,
    `Combo peak: x${run.comboPeak}`,
    `Time remaining: ${formatTime(timeLeft)}`,
  ];
  renderList(elements.resultsSummary, summary);

  const rewards = [];
  rewards.push(success ? "Mission reward unlocked" : "No mission reward");
  rewards.push(`Power-ups earned: ${run.rewardedPowerups || 0}`);
  renderList(elements.resultsRewards, rewards);

  const achievements = run.achievementsUnlocked.map((id) => {
    const data = achievementList.find((a) => a.id === id);
    return data ? data.name : id;
  });
  renderList(elements.resultsAchievements, achievements.length ? achievements : ["None"]);
}

function renderList(el, items) {
  el.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
}

function updateDailyRewardUI() {
  const today = new Date().toISOString().slice(0, 10);
  const canClaim = state.profile.daily.lastClaim !== today;
  elements.claimReward.disabled = !canClaim;
  elements.dailyText.textContent = canClaim
    ? `Reward ready. Streak ${state.profile.daily.streak + 1}x.`
    : "Reward already claimed. Return tomorrow.";
}

function claimDailyReward() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.profile.daily.lastClaim === today) return;
  state.profile.daily.lastClaim = today;
  state.profile.daily.streak += 1;
  const roll = Math.random();
  if (roll < 0.5) {
    const xp = 40 + state.profile.daily.streak * 10;
    state.profile.xp += xp;
    elements.dailyText.textContent = `Claimed +${xp} XP.`;
  } else if (roll < 0.85) {
    const keys = Object.keys(state.profile.powerups);
    const pick = keys[rand(0, keys.length - 1)];
    state.profile.powerups[pick] += 1;
    elements.dailyText.textContent = `Claimed +1 ${powerupDefs[pick].label}.`;
  } else {
    state.missionUnlock = Math.min(state.missionUnlock + 1, missions.length);
    elements.dailyText.textContent = "Bonus mission unlocked.";
  }
  saveState();
  renderHome();
  renderMissions();
}

function awardPowerups(success) {
  if (!success) {
    run.rewardedPowerups = 0;
    return;
  }
  let earned = 0;
  if (run.comboPeak >= 3) {
    state.profile.powerups.double += 1;
    earned += 1;
  }
  if (run.streak >= 5 || run.comboPeak >= 4) {
    state.profile.powerups.time += 1;
    earned += 1;
  }
  if (run.mission.isBoss) {
    state.profile.powerups.skip += 1;
    earned += 1;
  }
  run.rewardedPowerups = earned;
}

function finalizeAchievements(success, accuracy, timeLeft) {
  if (success && run.mission.isBoss) unlockAchievement("boss-breaker");
  if (accuracy === 100) unlockAchievement("flawless");
  if (timeLeft >= Math.round(run.mission.timeLimit / 2)) unlockAchievement("speed-demon");
  if (run.eventsTriggered >= 3) unlockAchievement("rift-tamer");
  renderRunAchievements();
}

function updateAchievementsOnResult() {
  if (run.correct === 1) unlockAchievement("first-blood");
  if (run.streak >= 5) unlockAchievement("hot-streak");
  if (run.combo >= 4) unlockAchievement("combo-master");
  renderRunAchievements();
}

function unlockAchievement(id) {
  if (!state.profile.achievements.includes(id)) {
    state.profile.achievements.push(id);
  }
  if (!run.achievementsUnlocked.includes(id)) {
    run.achievementsUnlocked.push(id);
    renderRunAchievements();
  }
}

function usePowerup(key) {
  if (!run.active) return;
  if ((state.profile.powerups[key] || 0) <= 0) return;
  state.profile.powerups[key] -= 1;
  if (key === "time") run.timeLeft += 10;
  if (key === "double") {
    run.event = { id: "overclock", name: "Overclock", desc: "Double XP" };
    run.eventEnds = performance.now() + 15000;
  }
  if (key === "skip") {
    elements.feedback.textContent = "Prompt skipped.";
    nextQuestion();
  }
  if (key === "freeze") {
    run.freezeUntil = performance.now() + 5000;
    elements.feedback.textContent = "Timer frozen.";
  }
  renderPowerups();
  saveState();
}

function buildMissions() {
  const types = [
    { id: "speed", label: "Speed Arithmetic" },
    { id: "compare", label: "Logic Compare" },
    { id: "memory", label: "Memory Recall" },
    { id: "pattern", label: "Pattern Rift" },
    { id: "accuracy", label: "Precision Focus" },
    { id: "time", label: "Time Pressure" },
  ];
  const list = [];
  for (let i = 1; i <= 16; i += 1) {
    const isBoss = i % 4 === 0;
    const base = types[(i - 1) % types.length];
    const difficulty = 1 + Math.floor((i - 1) / 2);
    const timeLimit = 30 + i * 2;
    const targetCount = 8 + i;
    const minAccuracy = isBoss ? 85 : base.id === "accuracy" ? 90 : 75;
    list.push({
      id: i,
      title: isBoss ? "Rift Guardian" : `Tier ${Math.ceil(i / 4)} Node`,
      type: base.id,
      typeLabel: base.label,
      difficulty,
      timeLimit,
      targetCount,
      minAccuracy,
      objective: `Solve ${targetCount} in ${timeLimit}s`,
      isBoss,
    });
  }
  return list;
}

function levelFromXp(xp) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 120)) + 1);
}

function formatTime(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(clamped / 60)).padStart(2, "0");
  const secs = String(clamped % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(defaultState);
  try {
    return mergeDeep(structuredClone(defaultState), JSON.parse(stored));
  } catch (err) {
    return structuredClone(defaultState);
  }
}

function mergeDeep(target, source) {
  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

window.addEventListener("beforeunload", saveState);
