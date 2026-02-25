(() => {
  'use strict';

  const Dom = {
    app: document.getElementById('app'),
    screenHome: document.getElementById('screen-home'),
    screenMissions: document.getElementById('screen-missions'),
    screenGame: document.getElementById('screen-game'),
    screenResult: document.getElementById('screen-result'),
    btnHome: document.getElementById('btn-home'),
    btnMissions: document.getElementById('btn-missions'),
    btnStart: document.getElementById('btn-start'),
    btnMissionSelect: document.getElementById('btn-mission-select'),
    btnClaimReward: document.getElementById('btn-claim-reward'),
    btnRisk: document.getElementById('btn-risk'),
    btnSubmit: document.getElementById('btn-submit'),
    btnNext: document.getElementById('btn-next'),
    btnReplay: document.getElementById('btn-replay'),
    btnHomeResult: document.getElementById('btn-home-result'),
    statLevel: document.getElementById('stat-level'),
    statXp: document.getElementById('stat-xp'),
    statAchievements: document.getElementById('stat-achievements'),
    statStreak: document.getElementById('stat-streak'),
    dailyStatus: document.getElementById('daily-status'),
    dailyRewardItem: document.getElementById('daily-reward-item'),
    missionGrid: document.getElementById('mission-grid'),
    hudMission: document.getElementById('hud-mission'),
    hudObjective: document.getElementById('hud-objective'),
    hudXp: document.getElementById('hud-xp'),
    hudScore: document.getElementById('hud-score'),
    hudTime: document.getElementById('hud-time'),
    hudStreak: document.getElementById('hud-streak'),
    hudCombo: document.getElementById('hud-combo'),
    hudLevel: document.getElementById('hud-level'),
    hudEvent: document.getElementById('hud-event'),
    questionType: document.getElementById('question-type'),
    question: document.getElementById('question'),
    choices: document.getElementById('choices'),
    inputWrap: document.getElementById('input-wrap'),
    answerInput: document.getElementById('answer-input'),
    feedback: document.getElementById('feedback'),
    objectiveList: document.getElementById('objective-list'),
    powerups: document.getElementById('powerups'),
    achievementFeed: document.getElementById('achievement-feed'),
    progressBar: document.getElementById('progress-bar'),
    status: document.getElementById('status'),
    resultTitle: document.getElementById('result-title'),
    resultXp: document.getElementById('result-xp'),
    resultAccuracy: document.getElementById('result-accuracy'),
    resultStreak: document.getElementById('result-streak'),
    resultCombo: document.getElementById('result-combo'),
    resultRewards: document.getElementById('result-rewards'),
    achievementPopup: document.getElementById('achievement-popup'),
    toast: document.getElementById('toast'),
    riftOverlay: document.getElementById('rift-overlay'),
    eventOverlay: document.getElementById('event-overlay'),
    flash: document.getElementById('flash')
  };

  const Storage = {
    key: 'neonRiftState',
    load() {
      try {
        const raw = localStorage.getItem(this.key);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    },
    save(state) {
      localStorage.setItem(this.key, JSON.stringify(state));
    }
  };

  const Utils = {
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    pick(list) {
      return list[Math.floor(Math.random() * list.length)];
    },
    shuffle(list) {
      const arr = [...list];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    formatTime(seconds) {
      return Math.max(0, seconds).toFixed(1);
    }
  };

  const DEFAULT_STATE = {
    player: {
      level: 1,
      xp: 0,
      totalXp: 0,
      unlockedMissions: 1,
      bestStreak: 0,
      achievements: [],
      powerups: {
        timeBoost: { count: 2, cooldown: 25, lastUsed: 0 },
        doubleXp: { count: 1, cooldown: 35, lastUsed: 0 },
        skip: { count: 2, cooldown: 20, lastUsed: 0 },
        freeze: { count: 1, cooldown: 40, lastUsed: 0 }
      },
      dailyClaim: null
    }
  };

  const GameState = {
    player: { ...DEFAULT_STATE.player },
    missions: [],
    achievements: [],
    run: null
  };

  const DifficultyScaler = {
    getDifficulty(player, run) {
      const accuracy = run.total ? run.correct / run.total : 0.75;
      const base = player.level + Math.floor(accuracy * 4) + Math.floor(run.combo / 3);
      const intensity = Utils.clamp(base, 1, 30);
      const range = 10 + intensity * 3;
      return {
        intensity,
        range,
        ops: intensity < 6 ? ['+', '-'] : intensity < 12 ? ['+', '-', '*'] : ['+', '-', '*', '/']
      };
    }
  };

  const MissionManager = {
    buildMissions() {
      const archetypes = [
        'Speed Arithmetic',
        'Comparison Challenge',
        'Memory Echo',
        'Pattern Recognition',
        'Logic Breach',
        'Time Pressure'
      ];
      const missions = [];
      for (let i = 1; i <= 40; i += 1) {
        const boss = i % 4 === 0;
        const archetype = boss ? 'Boss Rift' : archetypes[(i - 1) % archetypes.length];
        missions.push({
          id: i,
          name: boss ? `Boss Rift ${i}` : `Mission ${i}`,
          archetype,
          boss,
          objective: boss ? 'Survive the hybrid breach' : `Complete ${12 + i} correct answers`,
          target: 12 + i,
          time: boss ? 70 : 55 + Math.floor(i / 2),
          baseXp: boss ? 220 + i * 6 : 120 + i * 4
        });
      }
      return missions;
    },
    getMission(id) {
      return GameState.missions.find((mission) => mission.id === id);
    },
    isUnlocked(id) {
      return id <= GameState.player.unlockedMissions;
    },
    unlockNext() {
      GameState.player.unlockedMissions = Math.min(
        GameState.missions.length,
        GameState.player.unlockedMissions + 1
      );
    }
  };

  const QuestionEngine = {
    generate(mission, difficulty, run) {
      const archetype = mission.archetype;
      if (archetype === 'Boss Rift') {
        const options = ['Speed Arithmetic', 'Memory Echo', 'Pattern Recognition', 'Logic Breach', 'Comparison Challenge'];
        return this.generateByType(Utils.pick(options), difficulty, run, true);
      }
      return this.generateByType(archetype, difficulty, run, false);
    },
    generateByType(type, difficulty, run, bossMode) {
      switch (type) {
        case 'Speed Arithmetic':
        case 'Time Pressure':
          return this.arithmeticQuestion(difficulty, run, bossMode);
        case 'Comparison Challenge':
          return this.comparisonQuestion(difficulty);
        case 'Memory Echo':
          return this.memoryQuestion(difficulty, run);
        case 'Pattern Recognition':
          return this.patternQuestion(difficulty);
        case 'Logic Breach':
          return this.logicBreachQuestion(difficulty);
        default:
          return this.arithmeticQuestion(difficulty, run, bossMode);
      }
    },
    arithmeticQuestion(difficulty, run, bossMode) {
      const max = difficulty.range;
      const a = Utils.rand(2, max);
      const b = Utils.rand(2, max);
      const op = Utils.pick(difficulty.ops);
      let prompt = `${a} ${op} ${b}`;
      let answer = this.solve(a, b, op);
      if (bossMode) {
        const c = Utils.rand(2, Math.max(6, Math.floor(max / 2)));
        prompt = `(${a} ${op} ${b}) + ${c}`;
        answer = answer + c;
      }
      const choices = this.buildChoices(answer, difficulty.range, 3);
      const mode = Math.random() > 0.55 ? 'input' : 'choices';
      this.pushMemory(run, prompt, answer);
      return { type: 'Arithmetic Burst', prompt, answer, choices, mode };
    },
    comparisonQuestion(difficulty) {
      const max = difficulty.range;
      const a = Utils.rand(1, max);
      const b = Utils.rand(1, max);
      const prompt = `Which is larger?`;
      const choices = [`${a}`, `${b}`, `${Math.max(a, b) + Utils.rand(1, 6)}`];
      const answer = Math.max(a, b);
      return { type: 'Comparison Challenge', prompt, answer: `${answer}`, choices: Utils.shuffle(choices), mode: 'choices' };
    },
    memoryQuestion(difficulty, run) {
      if (run.memoryEchoes.length > 1 && Math.random() > 0.4) {
        const echo = Utils.pick(run.memoryEchoes);
        const prompt = `Memory Echo: ${echo.prompt} = ?`;
        const answer = echo.answer;
        const choices = this.buildChoices(answer, difficulty.range, 3);
        return { type: 'Memory Echo', prompt, answer, choices, mode: 'choices' };
      }
      return this.arithmeticQuestion(difficulty, run, false);
    },
    patternQuestion(difficulty) {
      const base = Utils.rand(2, Math.max(6, Math.floor(difficulty.range / 2)));
      const step = Utils.pick([2, 3, 4, 5]);
      const seq = [base, base + step, base + step * 2, base + step * 3];
      const answer = base + step * 4;
      const prompt = `Complete the sequence: ${seq.join(', ')}, ?`;
      const choices = this.buildChoices(answer, difficulty.range, 3);
      return { type: 'Pattern Recognition', prompt, answer, choices, mode: 'choices' };
    },
    logicBreachQuestion(difficulty) {
      const max = Math.max(6, Math.floor(difficulty.range / 2));
      const a = Utils.rand(2, max);
      const b = Utils.rand(2, max);
      const op = Utils.pick(['+', '-', '*']);
      const answer = this.solve(a, b, op);
      const prompt = `Repair the breach: ${a} ? ${b} = ${answer}`;
      const choices = ['+', '-', '*', '/'];
      return { type: 'Logic Breach', prompt, answer: op, choices, mode: 'choices', glitch: true };
    },
    solve(a, b, op) {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return Math.floor(a / b);
        default: return a + b;
      }
    },
    buildChoices(answer, range, count) {
      const choices = new Set([`${answer}`]);
      while (choices.size < count + 1) {
        choices.add(`${answer + Utils.rand(-Math.floor(range / 4), Math.floor(range / 4))}`);
      }
      return Utils.shuffle([...choices]);
    },
    pushMemory(run, prompt, answer) {
      run.memoryEchoes.push({ prompt, answer: `${answer}` });
      if (run.memoryEchoes.length > 6) {
        run.memoryEchoes.shift();
      }
    }
  };

  const EventSystem = {
    types: [
      { id: 'double_xp', label: 'Double XP', overlay: 'rgba(46, 255, 161, 0.18)', className: 'event-double-xp' },
      { id: 'slow_motion', label: 'Slow Motion', overlay: 'rgba(255, 200, 107, 0.18)', className: 'event-slow' },
      { id: 'inverted', label: 'Inverted Colors', overlay: 'rgba(107, 92, 255, 0.22)', className: 'event-invert' },
      { id: 'glitch_storm', label: 'Glitch Storm', overlay: 'rgba(255, 46, 166, 0.22)', className: 'event-glitch' },
      { id: 'time_distortion', label: 'Time Distortion', overlay: 'rgba(0, 244, 255, 0.2)', className: 'event-distort' }
    ],
    active: null,
    activate(run) {
      if (this.active || !run) return;
      const event = Utils.pick(this.types);
      this.active = event;
      run.event = event.id;
      run.eventLabel = event.label;
      run.eventEndsAt = Date.now() + 12000;
      Dom.hudEvent.textContent = event.label;
      Dom.eventOverlay.style.background = event.overlay;
      Dom.eventOverlay.style.opacity = '1';
      Dom.app.classList.add(event.className);
      this.applyEffects(run);
      UIRenderer.toast(`${event.label} engaged`);
      this.scheduleDeactivate(run);
    },
    applyEffects(run) {
      if (!run || !this.active) return;
      run.speedModifier = 1;
      run.doubleXpEvent = false;
      if (this.active.id === 'slow_motion') run.speedModifier = 0.6;
      if (this.active.id === 'time_distortion') run.speedModifier = 1.4;
      if (this.active.id === 'double_xp') run.doubleXpEvent = true;
      if (this.active.id === 'glitch_storm') run.glitchBoost = 0.3;
      if (this.active.id === 'inverted') run.inverted = true;
    },
    scheduleDeactivate(run) {
      if (!run) return;
      run.timers.push(setTimeout(() => this.deactivate(run), 12000));
    },
    deactivate(run) {
      if (!this.active) return;
      Dom.eventOverlay.style.opacity = '0';
      Dom.app.classList.remove(this.active.className);
      this.active = null;
      Dom.hudEvent.textContent = 'None';
      if (run) {
        run.event = null;
        run.eventLabel = 'None';
        run.speedModifier = 1;
        run.doubleXpEvent = false;
        run.glitchBoost = 0;
        run.inverted = false;
      }
    }
  };

  const PowerUpManager = {
    apply(powerId, run) {
      const power = GameState.player.powerups[powerId];
      if (!power || power.count <= 0) return;
      const now = Date.now();
      if (now - power.lastUsed < power.cooldown * 1000) return;
      power.count -= 1;
      power.lastUsed = now;
      if (powerId === 'timeBoost') {
        run.timeLeft += 10;
        UIRenderer.flash();
        UIRenderer.toast('Time Boost +10s');
      }
      if (powerId === 'doubleXp') {
        run.doubleXpPower = true;
        run.timers.push(setTimeout(() => { run.doubleXpPower = false; }, 15000));
        UIRenderer.toast('Double XP Activated');
      }
      if (powerId === 'skip') {
        run.skipPending = true;
        UIRenderer.toast('Skip armed');
      }
      if (powerId === 'freeze') {
        run.freezeActive = true;
        run.timers.push(setTimeout(() => { run.freezeActive = false; }, 5000));
        UIRenderer.toast('Timer Frozen');
      }
      UIRenderer.renderPowerups();
      Storage.save({ player: GameState.player });
    }
  };

  const AchievementManager = {
    build() {
      return [
        { id: 'first_blood', name: 'First Blood', desc: 'Answer 1 question', check: (run) => run.total >= 1 },
        { id: 'streak_5', name: 'Streak 5', desc: 'Reach streak 5', check: (run) => run.peakStreak >= 5 },
        { id: 'streak_10', name: 'Streak 10', desc: 'Reach streak 10', check: (run) => run.peakStreak >= 10 },
        { id: 'combo_5', name: 'Combo 5', desc: 'Reach combo 5', check: (run) => run.peakCombo >= 5 },
        { id: 'combo_10', name: 'Combo 10', desc: 'Reach combo 10', check: (run) => run.peakCombo >= 10 },
        { id: 'accuracy_90', name: 'Precision 90', desc: 'Achieve 90% accuracy', check: (run) => run.total >= 10 && run.correct / run.total >= 0.9 },
        { id: 'accuracy_100', name: 'Perfect Run', desc: 'Achieve 100% accuracy', check: (run) => run.total >= 10 && run.correct === run.total },
        { id: 'xp_500', name: 'XP 500', desc: 'Earn 500 XP total', check: () => GameState.player.totalXp >= 500 },
        { id: 'xp_2000', name: 'XP 2000', desc: 'Earn 2000 XP total', check: () => GameState.player.totalXp >= 2000 },
        { id: 'mission_1', name: 'Mission 1', desc: 'Complete mission 1', check: (run) => run.completedMission === 1 },
        { id: 'mission_10', name: 'Mission 10', desc: 'Complete mission 10', check: (run) => run.completedMission >= 10 },
        { id: 'mission_20', name: 'Mission 20', desc: 'Complete mission 20', check: (run) => run.completedMission >= 20 },
        { id: 'boss_1', name: 'First Boss', desc: 'Defeat a boss mission', check: (run) => run.bossComplete },
        { id: 'memory_3', name: 'Memory Echo', desc: 'Answer 3 memory questions', check: (run) => run.memoryCorrect >= 3 },
        { id: 'pattern_3', name: 'Pattern Seeker', desc: 'Answer 3 pattern questions', check: (run) => run.patternCorrect >= 3 },
        { id: 'logic_3', name: 'Logic Repair', desc: 'Repair 3 logic breaches', check: (run) => run.logicCorrect >= 3 },
        { id: 'risk_1', name: 'Risk Taker', desc: 'Win a risk mode challenge', check: (run) => run.riskWins >= 1 },
        { id: 'risk_5', name: 'High Roller', desc: 'Win 5 risk mode challenges', check: (run) => run.riskWins >= 5 },
        { id: 'power_5', name: 'Power Operator', desc: 'Use 5 power-ups', check: (run) => run.powerUses >= 5 },
        { id: 'event_3', name: 'Event Rider', desc: 'Survive 3 rift events', check: (run) => run.eventsTriggered >= 3 },
        { id: 'speed_25', name: 'Speed Core', desc: 'Answer 25 questions', check: (run) => run.total >= 25 },
        { id: 'level_3', name: 'Level 3', desc: 'Reach level 3', check: () => GameState.player.level >= 3 },
        { id: 'level_5', name: 'Level 5', desc: 'Reach level 5', check: () => GameState.player.level >= 5 },
        { id: 'level_8', name: 'Level 8', desc: 'Reach level 8', check: () => GameState.player.level >= 8 },
        { id: 'daily_1', name: 'Daily Claim', desc: 'Claim daily reward', check: () => !!GameState.player.dailyClaim },
        { id: 'time_master', name: 'Time Master', desc: 'Finish with 10s left', check: (run) => run.timeLeft >= 10 },
        { id: 'steady', name: 'Steady Hand', desc: 'No wrong answers in last 10', check: (run) => run.recentMistakes === 0 && run.total >= 10 },
        { id: 'boss_3', name: 'Boss Hunter', desc: 'Defeat 3 bosses', check: (run) => run.bossWins >= 3 },
        { id: 'echo_master', name: 'Echo Master', desc: 'Answer 8 memory echoes', check: (run) => run.memoryCorrect >= 8 },
        { id: 'pattern_master', name: 'Pattern Master', desc: 'Answer 8 patterns', check: (run) => run.patternCorrect >= 8 },
        { id: 'logic_master', name: 'Logic Master', desc: 'Repair 8 breaches', check: (run) => run.logicCorrect >= 8 }
      ];
    },
    check(run) {
      const unlocked = [];
      GameState.achievements.forEach((achievement) => {
        if (GameState.player.achievements.includes(achievement.id)) return;
        if (achievement.check(run)) {
          GameState.player.achievements.push(achievement.id);
          unlocked.push(achievement);
        }
      });
      if (unlocked.length) {
        unlocked.forEach((achievement) => UIRenderer.showAchievement(achievement));
        UIRenderer.renderHomeStats();
        UIRenderer.renderAchievementFeed(unlocked);
        Storage.save({ player: GameState.player });
      }
    }
  };

  const UIRenderer = {
    showScreen(screen) {
      [Dom.screenHome, Dom.screenMissions, Dom.screenGame, Dom.screenResult].forEach((node) => {
        node.classList.remove('active');
      });
      screen.classList.add('active');
    },
    renderHomeStats() {
      Dom.statLevel.textContent = GameState.player.level;
      Dom.statXp.textContent = GameState.player.totalXp;
      Dom.statAchievements.textContent = GameState.player.achievements.length;
      Dom.statStreak.textContent = GameState.player.bestStreak;
      const today = new Date().toDateString();
      const claimed = GameState.player.dailyClaim === today;
      Dom.dailyStatus.textContent = claimed ? 'Claimed' : 'Available';
      Dom.btnClaimReward.disabled = claimed;
    },
    renderMissionGrid() {
      Dom.missionGrid.innerHTML = '';
      GameState.missions.forEach((mission) => {
        const card = document.createElement('div');
        card.className = 'mission-card';
        if (mission.boss) card.classList.add('boss');
        if (!MissionManager.isUnlocked(mission.id)) card.classList.add('locked');
        card.innerHTML = `
          <div class="mission-title">${mission.name}</div>
          <div class="mission-meta">${mission.archetype} · ${mission.time}s</div>
          <div class="mission-tag">${mission.boss ? 'Boss' : 'Standard'}</div>
        `;
        card.addEventListener('click', () => {
          if (!MissionManager.isUnlocked(mission.id)) return;
          GameController.startMission(mission.id);
        });
        Dom.missionGrid.appendChild(card);
      });
    },
    renderHUD(run, mission) {
      Dom.hudMission.textContent = mission.name;
      Dom.hudObjective.textContent = mission.objective;
      Dom.hudXp.textContent = run.xpGained;
      Dom.hudScore.textContent = run.score;
      Dom.hudTime.textContent = Utils.formatTime(run.timeLeft);
      Dom.hudStreak.textContent = run.streak;
      Dom.hudCombo.textContent = run.combo;
      Dom.hudLevel.textContent = GameState.player.level;
      Dom.hudEvent.textContent = run.eventLabel || 'None';
    },
    renderObjective(mission, run) {
      Dom.objectiveList.innerHTML = '';
      const items = [
        `Target: ${mission.target} correct`,
        `Boss: ${mission.boss ? 'Yes' : 'No'}`,
        `Time: ${mission.time}s`,
        `Accuracy: ${Math.round(run.accuracy * 100) || 0}%`
      ];
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        Dom.objectiveList.appendChild(li);
      });
    },
    renderPowerups() {
      Dom.powerups.innerHTML = '';
      const entries = Object.entries(GameState.player.powerups);
      entries.forEach(([id, data]) => {
        const button = document.createElement('button');
        const now = Date.now();
        const ready = now - data.lastUsed >= data.cooldown * 1000;
        const label = id === 'timeBoost' ? 'Time Boost' :
          id === 'doubleXp' ? 'Double XP' :
          id === 'skip' ? 'Skip' : 'Freeze Timer';
        button.className = 'powerup-btn';
        button.disabled = data.count <= 0 || !ready;
        button.innerHTML = `<span>${label}</span><span>${data.count}</span>`;
        button.addEventListener('click', () => {
          if (!GameState.run) return;
          GameState.run.powerUses += 1;
          PowerUpManager.apply(id, GameState.run);
        });
        Dom.powerups.appendChild(button);
      });
    },
    renderQuestion(question) {
      Dom.questionType.textContent = question.type;
      Dom.question.textContent = question.prompt;
      Dom.question.classList.toggle('glitch', !!question.glitch);
      Dom.choices.innerHTML = '';
      Dom.inputWrap.classList.add('hidden');
      if (question.mode === 'choices') {
        question.choices.forEach((choice) => {
          const btn = document.createElement('button');
          btn.className = 'choice-btn';
          btn.textContent = choice;
          btn.addEventListener('click', () => GameController.submitAnswer(choice));
          Dom.choices.appendChild(btn);
        });
      } else {
        Dom.inputWrap.classList.remove('hidden');
        Dom.answerInput.value = '';
        Dom.answerInput.focus();
      }
    },
    renderProgress(run, mission) {
      const ratio = Utils.clamp(run.correct / mission.target, 0, 1);
      Dom.progressBar.style.width = `${ratio * 100}%`;
      Dom.status.textContent = run.status;
    },
    renderAchievementFeed(newItems) {
      newItems.forEach((item) => {
        const chip = document.createElement('div');
        chip.className = 'achievement-chip';
        chip.textContent = item.name;
        Dom.achievementFeed.prepend(chip);
        if (Dom.achievementFeed.children.length > 6) {
          Dom.achievementFeed.removeChild(Dom.achievementFeed.lastChild);
        }
      });
    },
    showAchievement(achievement) {
      Dom.achievementPopup.innerHTML = `<strong>${achievement.name}</strong><div>${achievement.desc}</div>`;
      Dom.achievementPopup.classList.add('show');
      setTimeout(() => Dom.achievementPopup.classList.remove('show'), 2600);
    },
    toast(message) {
      Dom.toast.textContent = message;
      Dom.toast.classList.add('show');
      setTimeout(() => Dom.toast.classList.remove('show'), 2000);
    },
    flash() {
      Dom.flash.classList.add('active');
      setTimeout(() => Dom.flash.classList.remove('active'), 300);
    },
    renderResults(run, mission) {
      Dom.resultTitle.textContent = run.success ? 'Mission Complete' : 'Mission Failed';
      Dom.resultXp.textContent = run.xpGained;
      Dom.resultAccuracy.textContent = `${Math.round(run.accuracy * 100)}%`;
      Dom.resultStreak.textContent = run.peakStreak;
      Dom.resultCombo.textContent = run.peakCombo;
      Dom.resultRewards.textContent = run.success ? `+${mission.baseXp} XP · Power-up drop` : 'Recovery protocol engaged';
    }
  };

  const GameController = {
    init() {
      const saved = Storage.load();
      if (saved && saved.player) {
        GameState.player = { ...DEFAULT_STATE.player, ...saved.player };
      }
      GameState.missions = MissionManager.buildMissions();
      GameState.achievements = AchievementManager.build();
      UIRenderer.renderHomeStats();
      UIRenderer.renderMissionGrid();
      this.bindEvents();
    },
    bindEvents() {
      Dom.btnHome.addEventListener('click', () => this.goHome());
      Dom.btnMissions.addEventListener('click', () => this.goMissions());
      Dom.btnStart.addEventListener('click', () => this.startMission(GameState.player.unlockedMissions));
      Dom.btnMissionSelect.addEventListener('click', () => this.goMissions());
      Dom.btnClaimReward.addEventListener('click', () => this.claimDaily());
      Dom.btnRisk.addEventListener('click', () => this.activateRisk());
      Dom.btnSubmit.addEventListener('click', () => {
        const value = Dom.answerInput.value.trim();
        if (!value) return;
        this.submitAnswer(value);
      });
      Dom.answerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          Dom.btnSubmit.click();
        }
      });
      Dom.btnNext.addEventListener('click', () => this.nextMission());
      Dom.btnReplay.addEventListener('click', () => this.replayMission());
      Dom.btnHomeResult.addEventListener('click', () => this.goHome());
    },
    goHome() {
      this.cleanupRun();
      UIRenderer.renderHomeStats();
      UIRenderer.showScreen(Dom.screenHome);
    },
    goMissions() {
      this.cleanupRun();
      UIRenderer.renderMissionGrid();
      UIRenderer.showScreen(Dom.screenMissions);
    },
    claimDaily() {
      const today = new Date().toDateString();
      if (GameState.player.dailyClaim === today) return;
      GameState.player.dailyClaim = today;
      GameState.player.totalXp += 120;
      GameState.player.xp += 120;
      GameState.player.powerups.timeBoost.count += 1;
      GameState.player.unlockedMissions = Math.min(GameState.missions.length, GameState.player.unlockedMissions + 1);
      UIRenderer.toast('Daily reward claimed');
      this.checkLevelUp();
      UIRenderer.renderHomeStats();
      Storage.save({ player: GameState.player });
      AchievementManager.check(this.mockRun());
    },
    startMission(id) {
      const mission = MissionManager.getMission(id);
      if (!mission) return;
      this.cleanupRun();
      const run = {
        missionId: id,
        score: 0,
        xpGained: 0,
        streak: 0,
        combo: 0,
        peakStreak: 0,
        peakCombo: 0,
        correct: 0,
        total: 0,
        accuracy: 0,
        timeLeft: mission.time,
        baseTime: mission.time,
        status: 'Neural sync complete',
        powerUses: 0,
        memoryEchoes: [],
        memoryCorrect: 0,
        patternCorrect: 0,
        logicCorrect: 0,
        riskWins: 0,
        riskActive: false,
        riskPending: false,
        skipPending: false,
        freezeActive: false,
        doubleXpPower: false,
        doubleXpEvent: false,
        event: null,
        eventLabel: 'None',
        speedModifier: 1,
        glitchBoost: 0,
        inverted: false,
        eventsTriggered: 0,
        bossWins: 0,
        recentMistakes: 0,
        timers: [],
        success: false,
        completedMission: 0,
        bossComplete: false
      };
      GameState.run = run;
      UIRenderer.showScreen(Dom.screenGame);
      UIRenderer.renderPowerups();
      this.loadQuestion();
      this.startTimer();
    },
    startTimer() {
      const run = GameState.run;
      if (!run) return;
      run.timers.push(setInterval(() => {
        if (!GameState.run) return;
        if (run.freezeActive) return;
        run.timeLeft = Utils.clamp(run.timeLeft - 0.1 * run.speedModifier, 0, run.baseTime);
        if (run.timeLeft <= 0) {
          this.finishMission(false);
          return;
        }
        if (!EventSystem.active && Math.random() > 0.975) {
          run.eventsTriggered += 1;
          EventSystem.activate(run);
        }
        UIRenderer.renderHUD(run, MissionManager.getMission(run.missionId));
        UIRenderer.renderProgress(run, MissionManager.getMission(run.missionId));
      }, 100));
    },
    loadQuestion() {
      const run = GameState.run;
      if (!run) return;
      const mission = MissionManager.getMission(run.missionId);
      const difficulty = DifficultyScaler.getDifficulty(GameState.player, run);
      const question = QuestionEngine.generate(mission, difficulty, run);
      if (Math.random() < 0.12 + run.glitchBoost) {
        question.glitch = true;
        question.type = 'AI Glitch';
      }
      run.currentQuestion = question;
      UIRenderer.renderQuestion(question);
      UIRenderer.renderHUD(run, mission);
      UIRenderer.renderObjective(mission, run);
      UIRenderer.renderProgress(run, mission);
    },
    submitAnswer(value) {
      const run = GameState.run;
      if (!run || !run.currentQuestion) return;
      const mission = MissionManager.getMission(run.missionId);
      const question = run.currentQuestion;
      if (run.skipPending) {
        run.skipPending = false;
        UIRenderer.toast('Skip executed');
        this.loadQuestion();
        return;
      }
      const normalized = String(value).trim();
      const correct = String(question.answer) === normalized;
      run.total += 1;
      if (correct) {
        run.correct += 1;
        run.streak += 1;
        run.combo += 1;
        run.peakStreak = Math.max(run.peakStreak, run.streak);
        run.peakCombo = Math.max(run.peakCombo, run.combo);
        if (question.type === 'Memory Echo') run.memoryCorrect += 1;
        if (question.type === 'Pattern Recognition') run.patternCorrect += 1;
        if (question.type === 'Logic Breach') run.logicCorrect += 1;
        if (question.type === 'AI Glitch') run.logicCorrect += 1;
        run.recentMistakes = 0;
        const base = 12 + run.combo;
        const multiplier = run.doubleXpPower || run.doubleXpEvent ? 2 : 1;
        const gain = Math.round(base * multiplier);
        run.xpGained += gain;
        run.score += gain;
        Dom.feedback.textContent = `Correct +${gain} XP`;
        UIRenderer.flash();
      } else {
        run.streak = 0;
        run.combo = 0;
        run.recentMistakes += 1;
        const penalty = run.riskActive ? Math.floor(run.xpGained * 0.25) : 0;
        run.xpGained = Math.max(0, run.xpGained - penalty);
        Dom.feedback.textContent = `Incorrect${penalty ? ` -${penalty} XP` : ''}`;
      }
      if (run.riskActive) {
        if (correct) {
          run.riskWins += 1;
          run.xpGained += 40;
          Dom.feedback.textContent = 'Risk win +40 XP';
        }
        run.riskActive = false;
      }
      run.accuracy = run.total ? run.correct / run.total : 0;
      if (run.correct >= mission.target) {
        this.finishMission(true);
        return;
      }
      AchievementManager.check(run);
      UIRenderer.renderHUD(run, mission);
      UIRenderer.renderObjective(mission, run);
      UIRenderer.renderProgress(run, mission);
      this.loadQuestion();
    },
    finishMission(success) {
      const run = GameState.run;
      if (!run) return;
      const mission = MissionManager.getMission(run.missionId);
      run.success = success;
      run.completedMission = success ? mission.id : 0;
      run.bossComplete = success && mission.boss;
      if (run.bossComplete) run.bossWins += 1;
      if (success) {
        run.xpGained += mission.baseXp;
        GameState.player.totalXp += run.xpGained;
        GameState.player.xp += run.xpGained;
        GameState.player.bestStreak = Math.max(GameState.player.bestStreak, run.peakStreak);
        MissionManager.unlockNext();
      }
      this.checkLevelUp();
      AchievementManager.check(run);
      Storage.save({ player: GameState.player });
      this.cleanupRun();
      UIRenderer.renderResults(run, mission);
      UIRenderer.showScreen(Dom.screenResult);
    },
    checkLevelUp() {
      const required = 200 + GameState.player.level * 120;
      if (GameState.player.xp >= required) {
        GameState.player.xp -= required;
        GameState.player.level += 1;
        UIRenderer.toast(`Level ${GameState.player.level} reached`);
      }
    },
    activateRisk() {
      const run = GameState.run;
      if (!run) return;
      run.riskActive = true;
      UIRenderer.toast('Risk Mode armed');
    },
    nextMission() {
      const nextId = Math.min(GameState.missions.length, GameState.player.unlockedMissions);
      this.startMission(nextId);
    },
    replayMission() {
      if (!GameState.run && GameState.player.unlockedMissions > 0) {
        this.startMission(GameState.player.unlockedMissions);
      }
    },
    cleanupRun() {
      if (!GameState.run) return;
      GameState.run.timers.forEach((timer) => clearInterval(timer));
      GameState.run.timers.forEach((timer) => clearTimeout(timer));
      EventSystem.deactivate(GameState.run);
      GameState.run = null;
      Dom.hudEvent.textContent = 'None';
    },
    mockRun() {
      return {
        total: 0,
        correct: 0,
        peakStreak: 0,
        peakCombo: 0,
        accuracy: 0,
        completedMission: GameState.player.unlockedMissions,
        bossComplete: false,
        memoryCorrect: 0,
        patternCorrect: 0,
        logicCorrect: 0,
        riskWins: 0,
        powerUses: 0,
        eventsTriggered: 0,
        timeLeft: 0,
        recentMistakes: 0,
        bossWins: 0
      };
    }
  };

  GameController.init();
})();
