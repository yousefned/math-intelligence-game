(() => {
  'use strict';

  const el = {
    btnHome: document.getElementById('btn-home'),
    btnMissions: document.getElementById('btn-missions'),
    btnStart: document.getElementById('btn-start'),
    btnMissionSelect: document.getElementById('btn-mission-select'),
    btnClaimReward: document.getElementById('btn-claim-reward'),
    btnSubmit: document.getElementById('btn-submit'),
    btnRisk: document.getElementById('btn-risk'),
    btnNext: document.getElementById('btn-next'),
    btnReplay: document.getElementById('btn-replay'),
    btnHomeResult: document.getElementById('btn-home-result'),
    missionGrid: document.getElementById('mission-grid'),
    screens: {
      home: document.getElementById('screen-home'),
      missions: document.getElementById('screen-missions'),
      game: document.getElementById('screen-game'),
      result: document.getElementById('screen-result')
    },
    stats: {
      level: document.getElementById('stat-level'),
      xp: document.getElementById('stat-xp'),
      achievements: document.getElementById('stat-achievements'),
      streak: document.getElementById('stat-streak')
    },
    daily: {
      status: document.getElementById('daily-status'),
      item: document.getElementById('daily-reward-item')
    },
    hud: {
      mission: document.getElementById('hud-mission'),
      objective: document.getElementById('hud-objective'),
      xp: document.getElementById('hud-xp'),
      score: document.getElementById('hud-score'),
      time: document.getElementById('hud-time'),
      streak: document.getElementById('hud-streak'),
      combo: document.getElementById('hud-combo'),
      level: document.getElementById('hud-level'),
      event: document.getElementById('hud-event')
    },
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
    result: {
      title: document.getElementById('result-title'),
      xp: document.getElementById('result-xp'),
      accuracy: document.getElementById('result-accuracy'),
      streak: document.getElementById('result-streak'),
      combo: document.getElementById('result-combo'),
      rewards: document.getElementById('result-rewards')
    },
    riftOverlay: document.getElementById('rift-overlay'),
    flash: document.getElementById('flash'),
    achievementPopup: document.getElementById('achievement-popup')
  };

  const Utils = {
    randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    shuffle(arr) {
      const clone = [...arr];
      for (let i = clone.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
      }
      return clone;
    },
    clamp(num, min, max) {
      return Math.max(min, Math.min(max, num));
    },
    formatTime(sec) {
      const s = Math.max(0, Math.round(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r.toString().padStart(2, '0')}`;
    },
    todayKey() {
      const now = new Date();
      return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }
  };

  const GameState = {
    player: {
      xp: 0,
      level: 1,
      unlockedMission: 1,
      bestStreak: 0
    },
    run: null,
    settings: {
      baseXP: 120
    },
    inventory: {
      timeBoost: 2,
      doubleXP: 1,
      skip: 2,
      freeze: 1
    },
    achievements: {
      unlocked: []
    }
  };

  const Storage = {
    load() {
      try {
        const stored = JSON.parse(localStorage.getItem('neonRiftState') || '{}');
        if (stored.player) {
          GameState.player = { ...GameState.player, ...stored.player };
        }
        if (stored.inventory) {
          GameState.inventory = { ...GameState.inventory, ...stored.inventory };
        }
        if (stored.achievements) {
          GameState.achievements = { ...GameState.achievements, ...stored.achievements };
        }
      } catch (err) {
        // ignore
      }
    },
    save() {
      localStorage.setItem(
        'neonRiftState',
        JSON.stringify({
          player: GameState.player,
          inventory: GameState.inventory,
          achievements: GameState.achievements
        })
      );
    }
  };

  const DifficultyScaler = {
    getRange(level, performance) {
      const base = 6 + level * 2 + performance * 2;
      return Utils.clamp(base, 8, 60);
    },
    getTimeLimit(level, missionType) {
      const base = 45 - Math.min(level * 1.1, 18);
      const mod = missionType === 'speed' ? -6 : 0;
      const bossMod = missionType === 'boss' ? -4 : 0;
      return Utils.clamp(base + mod + bossMod, 24, 60);
    }
  };

  const MissionManager = {
    missions: [],
    init() {
      const types = ['speed', 'comparison', 'memory', 'pattern', 'logic', 'pressure'];
      for (let i = 1; i <= 40; i += 1) {
        const boss = i % 4 === 0;
        this.missions.push({
          id: i,
          title: boss ? `Boss Rift ${i}` : `Mission ${i}`,
          type: boss ? 'boss' : types[(i - 1) % types.length],
          objective: boss ? 'Survive the hybrid breach' : `Complete ${10 + i} questions`,
          target: boss ? 14 + i : 10 + i,
          boss
        });
      }
    },
    getMission(id) {
      return this.missions.find((m) => m.id === id);
    }
  };

  const QuestionEngine = {
    memoryStack: [],
    generate(mission, level, performance) {
      const types = {
        speed: ['arithmetic', 'comparison'],
        comparison: ['comparison', 'arithmetic'],
        memory: ['memory', 'arithmetic'],
        pattern: ['pattern', 'arithmetic'],
        logic: ['logic', 'comparison'],
        pressure: ['arithmetic', 'comparison', 'pattern'],
        boss: ['boss', 'glitch', 'memory', 'pattern', 'comparison']
      };
      const typePool = types[mission.type] || ['arithmetic'];
      const chosen = Utils.pick(typePool);
      const range = DifficultyScaler.getRange(level, performance);

      if (chosen === 'glitch') return this.generateGlitch(range);
      if (chosen === 'memory') return this.generateMemory(range);
      if (chosen === 'pattern') return this.generatePattern(range);
      if (chosen === 'comparison') return this.generateComparison(range);
      if (chosen === 'logic') return this.generateLogicBreach(range);
      if (chosen === 'boss') return this.generateBossHybrid(range);
      return this.generateArithmetic(range);
    },
    generateArithmetic(range) {
      const a = Utils.randInt(2, range);
      const b = Utils.randInt(2, range);
      const ops = ['+', '-', '*'];
      const op = Utils.pick(ops);
      let answer = 0;
      if (op === '+') answer = a + b;
      if (op === '-') answer = a - b;
      if (op === '*') answer = a * b;
      const choices = Utils.shuffle([answer, answer + Utils.randInt(1, 6), answer - Utils.randInt(1, 6), answer + Utils.randInt(7, 12)]);
      return {
        type: 'Arithmetic Burst',
        text: `${a} ${op} ${b}`,
        answer: answer.toString(),
        choices: choices.map((c) => c.toString()),
        input: false
      };
    },
    generateComparison(range) {
      const a = Utils.randInt(2, range);
      const b = Utils.randInt(2, range);
      const c = Utils.randInt(2, range);
      const d = Utils.randInt(2, range);
      const left = a + b;
      const right = c + d;
      const answer = left === right ? '=' : left > right ? '>' : '<';
      return {
        type: 'Comparison Lock',
        text: `${a} + ${b} ? ${c} + ${d}`,
        answer,
        choices: ['>', '<', '='],
        input: false
      };
    },
    generateMemory(range) {
      const shouldAsk = this.memoryStack.length > 3 && Math.random() < 0.5;
      if (shouldAsk) {
        const memory = Utils.pick(this.memoryStack);
        const choices = Utils.shuffle([
          memory.answer,
          (memory.answer + Utils.randInt(1, 8)).toString(),
          (memory.answer - Utils.randInt(1, 5)).toString(),
          (memory.answer + Utils.randInt(9, 15)).toString()
        ]);
        return {
          type: 'Memory Echo',
          text: `Recall: ${memory.text} = ?`,
          answer: memory.answer.toString(),
          choices,
          input: false,
          meta: { memory: true }
        };
      }
      const eq = this.generateArithmetic(range);
      this.memoryStack.push({ text: eq.text, answer: Number(eq.answer) });
      if (this.memoryStack.length > 8) this.memoryStack.shift();
      return {
        ...eq,
        type: 'Memory Encode'
      };
    },
    generatePattern(range) {
      const start = Utils.randInt(2, range / 2);
      const diff = Utils.randInt(2, 6 + Math.floor(range / 10));
      const seq = [start, start + diff, start + diff * 2, start + diff * 3];
      const answer = start + diff * 4;
      const text = `${seq.join('  ')}  ?`;
      const choices = Utils.shuffle([
        answer,
        answer + diff,
        answer - diff,
        answer + Utils.randInt(3, 9)
      ]).map((c) => c.toString());
      return {
        type: 'Pattern Rift',
        text,
        answer: answer.toString(),
        choices,
        input: false
      };
    },
    generateLogicBreach(range) {
      const a = Utils.randInt(2, range);
      const b = Utils.randInt(2, range);
      const c = Utils.randInt(2, range);
      const answer = a * b - c;
      const text = `(${a} × ${b}) − ${c}`;
      return {
        type: 'Logic Breach',
        text,
        answer: answer.toString(),
        choices: [],
        input: true
      };
    },
    generateGlitch(range) {
      const a = Utils.randInt(2, range);
      const b = Utils.randInt(2, range);
      const ops = ['+', '-', '×', '÷'];
      const op = Utils.pick(ops);
      let answer = '?';
      const choices = Utils.shuffle(ops);
      const text = `${a}  ?  ${b}  = ${this.resolveOp(a, b, op)}`;
      return {
        type: 'AI Glitch Repair',
        text,
        answer: op,
        choices,
        input: false
      };
    },
    generateBossHybrid(range) {
      const partA = this.generateArithmetic(range + 10);
      const partB = this.generatePattern(range);
      const text = `${partA.text}  |  ${partB.text}`;
      const combined = `${partA.answer}-${partB.answer}`;
      const choices = Utils.shuffle([
        combined,
        `${partA.answer}-${Number(partB.answer) + 2}`,
        `${Number(partA.answer) + 2}-${partB.answer}`,
        `${Number(partA.answer) - 3}-${Number(partB.answer) + 1}`
      ]);
      return {
        type: 'Boss Hybrid',
        text,
        answer: combined,
        choices,
        input: false
      };
    },
    resolveOp(a, b, op) {
      if (op === '+') return a + b;
      if (op === '-') return a - b;
      if (op === '×') return a * b;
      if (op === '÷') return Math.round((a / b) * 100) / 100;
      return 0;
    }
  };

  const EventSystem = {
    current: null,
    timer: 0,
    available: [
      { id: 'doubleXP', name: 'Double XP Surge', effect: 'doubleXP' },
      { id: 'slowmo', name: 'Slow Motion', effect: 'slowmo' },
      { id: 'invert', name: 'Inverted Reality', effect: 'invert' },
      { id: 'glitch', name: 'Glitch Storm', effect: 'glitch' },
      { id: 'distort', name: 'Time Distortion', effect: 'distort' }
    ],
    reset() {
      this.current = null;
      this.timer = 0;
      this.clearVisuals();
    },
    maybeTrigger(run) {
      if (this.current || run.questionIndex < 3) return;
      if (Math.random() < 0.18) {
        this.current = Utils.pick(this.available);
        this.timer = 3 + Utils.randInt(0, 2);
        this.applyVisuals();
        UIRenderer.setStatus(`${this.current.name} activated.`);
      }
    },
    tick() {
      if (!this.current) return;
      this.timer -= 1;
      if (this.timer <= 0) {
        this.clearVisuals();
        this.current = null;
        UIRenderer.setStatus('Rift event stabilized.');
      }
    },
    applyVisuals() {
      if (!this.current) return;
      el.riftOverlay.classList.remove('hidden');
      el.riftOverlay.classList.add('active');
      if (this.current.effect === 'invert') {
        document.body.classList.add('invert');
      }
      if (this.current.effect === 'glitch') {
        document.body.classList.add('glitch');
      }
    },
    clearVisuals() {
      el.riftOverlay.classList.remove('active');
      el.riftOverlay.classList.add('hidden');
      document.body.classList.remove('invert', 'glitch');
    },
    applyScore(xp) {
      if (!this.current) return xp;
      if (this.current.effect === 'doubleXP') return xp * 2;
      return xp;
    }
  };

  const PowerUpManager = {
    cooldowns: {},
    init() {
      this.cooldowns = {
        timeBoost: 0,
        doubleXP: 0,
        skip: 0,
        freeze: 0
      };
    },
    canUse(key) {
      if (key === 'skip' && RiskMode.armed) return false;
      return GameState.inventory[key] > 0 && this.cooldowns[key] === 0;
    },
    use(key) {
      if (!this.canUse(key)) return false;
      GameState.inventory[key] -= 1;
      this.cooldowns[key] = 4;
      if (key === 'timeBoost') GameState.run.time += 10;
      if (key === 'doubleXP') GameState.run.tempDoubleXP = 3;
      if (key === 'skip') Game.skipQuestion();
      if (key === 'freeze') GameState.run.freeze = 5;
      UIRenderer.animatePowerUp(key);
      return true;
    },
    tick() {
      Object.keys(this.cooldowns).forEach((key) => {
        if (this.cooldowns[key] > 0) this.cooldowns[key] -= 1;
      });
    }
  };

  const AchievementManager = {
    list: [],
    init() {
      this.list = [
        { id: 'first', name: 'Boot Sequence', desc: 'Complete your first mission.', check: (s) => s.completedMissions >= 1 },
        { id: 'streak5', name: 'Signal Lock', desc: 'Reach a 5 streak.', check: (s) => s.maxStreak >= 5 },
        { id: 'streak10', name: 'Neon Surge', desc: 'Reach a 10 streak.', check: (s) => s.maxStreak >= 10 },
        { id: 'combo5', name: 'Combo Pulse', desc: 'Reach a 5 combo.', check: (s) => s.maxCombo >= 5 },
        { id: 'combo10', name: 'Combo Reactor', desc: 'Reach a 10 combo.', check: (s) => s.maxCombo >= 10 },
        { id: 'fast', name: 'Quick Sync', desc: 'Answer within 2 seconds.', check: (s) => s.fastAnswer },
        { id: 'perfect', name: 'Zero Deviation', desc: 'Finish with 100% accuracy.', check: (s) => s.accuracy === 1 },
        { id: 'riskwin', name: 'Risk Protocol', desc: 'Win Risk Mode.', check: (s) => s.riskWin },
        { id: 'glitch', name: 'Glitch Doctor', desc: 'Repair an AI glitch.', check: (s) => s.glitchRepair },
        { id: 'memory', name: 'Echo Keeper', desc: 'Clear a Memory Echo.', check: (s) => s.memoryClear },
        { id: 'event', name: 'Rift Rider', desc: 'Experience a rift event.', check: (s) => s.eventSeen },
        { id: 'xp500', name: 'Rift Amplified', desc: 'Gain 500 XP total.', check: () => GameState.player.xp >= 500 },
        { id: 'xp2000', name: 'Neural Apex', desc: 'Gain 2000 XP total.', check: () => GameState.player.xp >= 2000 },
        { id: 'lvl5', name: 'Level 5', desc: 'Reach level 5.', check: () => GameState.player.level >= 5 },
        { id: 'lvl10', name: 'Level 10', desc: 'Reach level 10.', check: () => GameState.player.level >= 10 },
        { id: 'boss', name: 'Boss Breaker', desc: 'Clear a boss mission.', check: (s) => s.bossClear },
        { id: 'daily', name: 'Daily Sync', desc: 'Claim a daily reward.', check: (s) => s.dailyClaimed },
        { id: 'power', name: 'Power Surge', desc: 'Use 3 power-ups in a mission.', check: (s) => s.powerUses >= 3 },
        { id: 'endurance', name: 'Endurance Run', desc: 'Answer 20 questions in a mission.', check: (s) => s.questionsAnswered >= 20 },
        { id: 'accuracy80', name: 'Precision 80', desc: 'Finish with 80% accuracy.', check: (s) => s.accuracy >= 0.8 },
        { id: 'accuracy90', name: 'Precision 90', desc: 'Finish with 90% accuracy.', check: (s) => s.accuracy >= 0.9 },
        { id: 'unlock10', name: 'Sector 10', desc: 'Unlock mission 10.', check: () => GameState.player.unlockedMission >= 10 },
        { id: 'unlock20', name: 'Sector 20', desc: 'Unlock mission 20.', check: () => GameState.player.unlockedMission >= 20 },
        { id: 'unlock30', name: 'Sector 30', desc: 'Unlock mission 30.', check: () => GameState.player.unlockedMission >= 30 },
        { id: 'unlock40', name: 'Sector 40', desc: 'Unlock mission 40.', check: () => GameState.player.unlockedMission >= 40 },
        { id: 'flash', name: 'Surge Flash', desc: 'Trigger a streak flash.', check: (s) => s.flashTriggered },
        { id: 'streak15', name: 'Streak 15', desc: 'Reach a 15 streak.', check: (s) => s.maxStreak >= 15 },
        { id: 'combo15', name: 'Combo 15', desc: 'Reach a 15 combo.', check: (s) => s.maxCombo >= 15 },
        { id: 'time', name: 'Time Guardian', desc: 'Finish with 20s remaining.', check: (s) => s.timeRemaining >= 20 }
      ];
    },
    check(runSummary) {
      const unlocked = [];
      this.list.forEach((ach) => {
        if (GameState.achievements.unlocked.includes(ach.id)) return;
        if (ach.check(runSummary)) {
          GameState.achievements.unlocked.push(ach.id);
          unlocked.push(ach);
        }
      });
      if (unlocked.length) {
        UIRenderer.pushAchievements(unlocked);
        Storage.save();
      }
    }
  };

  const UIRenderer = {
    activeScreen: 'home',
    switchScreen(name) {
      Object.values(el.screens).forEach((screen) => screen.classList.remove('active'));
      el.screens[name].classList.add('active');
      this.activeScreen = name;
    },
    updateHome() {
      el.stats.level.textContent = GameState.player.level;
      el.stats.xp.textContent = GameState.player.xp;
      el.stats.achievements.textContent = GameState.achievements.unlocked.length;
      el.stats.streak.textContent = GameState.player.bestStreak;
      this.updateDaily();
    },
    updateDaily() {
      const lastClaim = localStorage.getItem('neonRiftDaily') || '';
      if (lastClaim === Utils.todayKey()) {
        el.daily.status.textContent = 'Claimed';
        el.daily.status.style.color = 'var(--muted)';
        el.btnClaimReward.disabled = true;
      } else {
        el.daily.status.textContent = 'Available';
        el.daily.status.style.color = 'var(--lime)';
        el.btnClaimReward.disabled = false;
      }
    },
    renderMissionGrid() {
      el.missionGrid.innerHTML = '';
      MissionManager.missions.forEach((mission) => {
        const card = document.createElement('div');
        const locked = mission.id > GameState.player.unlockedMission;
        card.className = `mission-card ${locked ? 'locked' : ''} ${mission.boss ? 'boss' : ''}`;
        card.innerHTML = `
          <div class="mission-title">${mission.title}</div>
          <div class="mission-meta">${mission.objective}</div>
          <div class="mission-meta">Type: ${mission.type.toUpperCase()}</div>
          ${mission.boss ? '<div class="mission-badge">BOSS</div>' : ''}
        `;
        if (!locked) {
          card.addEventListener('click', () => Game.startMission(mission.id));
        }
        el.missionGrid.appendChild(card);
      });
    },
    updateHUD() {
      const run = GameState.run;
      if (!run) return;
      el.hud.mission.textContent = run.mission.title;
      el.hud.objective.textContent = run.mission.objective;
      el.hud.xp.textContent = run.xp;
      el.hud.score.textContent = run.score;
      el.hud.time.textContent = Utils.formatTime(run.time);
      el.hud.streak.textContent = run.streak;
      el.hud.combo.textContent = run.combo;
      el.hud.level.textContent = GameState.player.level;
      el.hud.event.textContent = EventSystem.current ? EventSystem.current.name : 'None';
      el.progressBar.style.width = `${Math.min(100, (run.questionIndex / run.target) * 100)}%`;
    },
    setQuestion(payload) {
      el.questionType.textContent = payload.type;
      el.question.textContent = payload.text;
      el.choices.innerHTML = '';
      if (payload.input) {
        el.inputWrap.classList.remove('hidden');
        el.answerInput.value = '';
        el.answerInput.focus();
      } else {
        el.inputWrap.classList.add('hidden');
        payload.choices.forEach((choice) => {
          const button = document.createElement('button');
          button.className = 'choice';
          button.textContent = choice;
          button.addEventListener('click', () => Game.submitAnswer(choice));
          el.choices.appendChild(button);
        });
      }
    },
    updateObjectives(objectives) {
      el.objectiveList.innerHTML = '';
      objectives.forEach((obj) => {
        const li = document.createElement('li');
        li.textContent = obj;
        el.objectiveList.appendChild(li);
      });
    },
    updatePowerups() {
      el.powerups.innerHTML = '';
      const keys = [
        { key: 'timeBoost', label: 'Time Boost', icon: '+10s' },
        { key: 'doubleXP', label: 'Double XP', icon: 'x2' },
        { key: 'skip', label: 'Skip', icon: '>>' },
        { key: 'freeze', label: 'Freeze', icon: '||' }
      ];
      keys.forEach((item) => {
        const btn = document.createElement('button');
        const disabled = !PowerUpManager.canUse(item.key);
        btn.className = `powerup-btn ${disabled ? 'disabled' : ''}`;
        btn.innerHTML = `<span>${item.label}</span><span>${item.icon} · ${GameState.inventory[item.key]}</span>`;
        if (!disabled) {
          btn.addEventListener('click', () => {
            if (PowerUpManager.use(item.key)) {
              GameState.run.powerUses += 1;
              UIRenderer.updatePowerups();
              Storage.save();
            }
          });
        }
        el.powerups.appendChild(btn);
      });
    },
    pushAchievements(list) {
      list.forEach((ach) => {
        const item = document.createElement('div');
        item.textContent = `${ach.name} unlocked.`;
        el.achievementFeed.prepend(item);
        this.showAchievementPopup(ach);
      });
      el.stats.achievements.textContent = GameState.achievements.unlocked.length;
    },
    showAchievementPopup(ach) {
      el.achievementPopup.classList.remove('hidden');
      el.achievementPopup.textContent = `${ach.name} — ${ach.desc}`;
      setTimeout(() => {
        el.achievementPopup.classList.add('hidden');
      }, 2400);
    },
    setStatus(text) {
      el.status.textContent = text;
    },
    setFeedback(text, tone) {
      el.feedback.textContent = text;
      el.feedback.className = `feedback ${tone || ''}`;
    },
    animatePowerUp(key) {
      el.flash.classList.remove('hidden');
      el.flash.classList.add('active');
      setTimeout(() => {
        el.flash.classList.remove('active');
        el.flash.classList.add('hidden');
      }, 420);
      this.setStatus(`${key} activated.`);
    },
    renderResults(summary) {
      el.result.title.textContent = summary.success ? 'Mission Complete' : 'Mission Failed';
      el.result.xp.textContent = summary.xpGained;
      el.result.accuracy.textContent = `${Math.round(summary.accuracy * 100)}%`;
      el.result.streak.textContent = summary.maxStreak;
      el.result.combo.textContent = summary.maxCombo;
      el.result.rewards.textContent = summary.rewards;
    }
  };

  const Game = {
    timerId: null,
    startMission(id) {
      const mission = MissionManager.getMission(id || GameState.player.unlockedMission);
      if (!mission) return;

      const run = {
        mission,
        target: mission.target,
        questionIndex: 0,
        score: 0,
        xp: 0,
        streak: 0,
        combo: 0,
        maxStreak: 0,
        maxCombo: 0,
        time: DifficultyScaler.getTimeLimit(GameState.player.level, mission.type),
        correct: 0,
        total: 0,
        powerUses: 0,
        fastAnswer: false,
        memoryClear: false,
        glitchRepair: false,
        riskWin: false,
        eventSeen: false,
        flashTriggered: false,
        bossClear: mission.boss,
        dailyClaimed: false,
        questionsAnswered: 0,
        tempDoubleXP: 0,
        skipNext: false,
        freeze: 0,
        startedAt: performance.now(),
        lastQuestionTime: performance.now()
      };

      GameState.run = run;
      PowerUpManager.init();
      EventSystem.reset();
      QuestionEngine.memoryStack = [];
      UIRenderer.updatePowerups();
      UIRenderer.updateObjectives([mission.objective, 'Maintain streaks for bonus XP', 'Watch for rift events']);
      UIRenderer.switchScreen('game');
      UIRenderer.setStatus('Mission online.');
      this.nextQuestion();
      this.startTimer();
    },
    startTimer() {
      if (this.timerId) clearInterval(this.timerId);
      this.timerId = setInterval(() => {
        const run = GameState.run;
        if (!run) return;
        if (run.freeze > 0) {
          run.freeze -= 1;
        } else {
          run.time -= EventSystem.current && EventSystem.current.effect === 'slowmo' ? 0.6 : 1;
        }
        if (EventSystem.current && EventSystem.current.effect === 'distort') {
          run.time -= Math.random() < 0.3 ? -1.2 : 0.8;
        }
        if (run.time <= 0) {
          run.time = 0;
          this.finishMission(false);
          return;
        }
        UIRenderer.updateHUD();
      }, 1000);
    },
    stopTimer() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    },
    nextQuestion() {
      const run = GameState.run;
      if (!run) return;
      run.questionIndex += 1;
      run.questionsAnswered += 1;
      if (run.questionIndex > run.target) {
        this.finishMission(true);
        return;
      }
      EventSystem.maybeTrigger(run);
      if (EventSystem.current) run.eventSeen = true;

      const performanceScore = run.correct / Math.max(1, run.total);
      let question = QuestionEngine.generate(run.mission, GameState.player.level, performanceScore * 10);
      if (RiskMode.armed) {
        question = QuestionEngine.generateBossHybrid(DifficultyScaler.getRange(GameState.player.level + 2, performanceScore * 12));
        question.type = 'Risk Protocol';
      }
      run.currentQuestion = question;
      run.lastQuestionTime = performance.now();
      UIRenderer.setQuestion(question);
      UIRenderer.updateHUD();
      UIRenderer.setFeedback('');
      UIRenderer.setStatus('Answer quickly for bonuses.');
    },
    skipQuestion() {
      const run = GameState.run;
      if (!run) return;
      run.total += 1;
      run.combo = Math.max(0, run.combo - 1);
      UIRenderer.setFeedback('Skipped.', 'neutral');
      UIRenderer.setStatus('Question skipped.');
      PowerUpManager.tick();
      EventSystem.tick();
      UIRenderer.updateHUD();
      UIRenderer.updatePowerups();
      setTimeout(() => this.nextQuestion(), 300);
    },
    submitAnswer(value) {
      const run = GameState.run;
      if (!run || !run.currentQuestion) return;
      const answer = run.currentQuestion.answer.toString();
      const inputValue = value !== undefined ? value.toString() : el.answerInput.value.trim();
      if (inputValue.length === 0) return;

      run.total += 1;
      const elapsed = (performance.now() - run.lastQuestionTime) / 1000;
      if (elapsed <= 2) run.fastAnswer = true;

      let correct = inputValue === answer;

      if (correct) {
        run.correct += 1;
        run.streak += 1;
        run.combo = Math.min(run.combo + 1, 20);
        run.maxStreak = Math.max(run.maxStreak, run.streak);
        run.maxCombo = Math.max(run.maxCombo, run.combo);

        const baseXP = GameState.settings.baseXP + run.combo * 4;
        const xpGain = EventSystem.applyScore(baseXP + run.streak * 2);
        const bonusXP = run.tempDoubleXP > 0 ? xpGain * 2 : xpGain;
        run.xp += bonusXP;
        run.score += 10 + run.combo * 2;

        if (run.tempDoubleXP > 0) run.tempDoubleXP -= 1;

        if (run.currentQuestion.type === 'Memory Echo') run.memoryClear = true;
        if (run.currentQuestion.type === 'AI Glitch Repair') run.glitchRepair = true;

        if (run.streak > 0 && run.streak % 5 === 0) {
          run.flashTriggered = true;
          UIRenderer.setStatus(`Streak ${run.streak} activated.`);
          el.flash.classList.remove('hidden');
          el.flash.classList.add('active');
          setTimeout(() => {
            el.flash.classList.remove('active');
            el.flash.classList.add('hidden');
          }, 420);
        }

        UIRenderer.setFeedback('Correct.', 'good');
      } else {
        run.streak = 0;
        run.combo = Math.max(0, run.combo - 2);
        UIRenderer.setFeedback(`Incorrect. Answer was ${answer}.`, 'bad');
      }

      RiskMode.resolve(correct);
      PowerUpManager.tick();
      EventSystem.tick();
      UIRenderer.updatePowerups();
      UIRenderer.updateHUD();

      setTimeout(() => this.nextQuestion(), 450);
    },
    finishMission(success) {
      this.stopTimer();
      const run = GameState.run;
      if (!run) return;
      RiskMode.armed = false;

      const accuracy = run.correct / Math.max(1, run.total);
      const xpGained = Math.round(run.xp * (success ? 1 : 0.5));

      GameState.player.xp += xpGained;
      GameState.player.level = Progression.getLevel(GameState.player.xp);
      GameState.player.bestStreak = Math.max(GameState.player.bestStreak, run.maxStreak);
      if (success && GameState.player.unlockedMission < run.mission.id + 1) {
        GameState.player.unlockedMission = Math.min(40, run.mission.id + 1);
      }

      const summary = {
        success,
        xpGained,
        accuracy,
        maxStreak: run.maxStreak,
        maxCombo: run.maxCombo,
        rewards: success ? 'XP + Unlocks' : 'Partial XP',
        completedMissions: success ? 1 : 0,
        bossClear: success && run.mission.boss,
        powerUses: run.powerUses,
        fastAnswer: run.fastAnswer,
        glitchRepair: run.glitchRepair,
        memoryClear: run.memoryClear,
        riskWin: run.riskWin,
        eventSeen: run.eventSeen,
        flashTriggered: run.flashTriggered,
        questionsAnswered: run.questionsAnswered,
        accuracyRaw: accuracy,
        timeRemaining: run.time,
        dailyClaimed: run.dailyClaimed
      };

      AchievementManager.check({
        ...summary,
        accuracy
      });

      Storage.save();
      UIRenderer.renderResults(summary);
      UIRenderer.updateHome();
      UIRenderer.switchScreen('result');
      GameState.run = null;
    }
  };

  const Progression = {
    getLevel(xp) {
      let level = 1;
      let threshold = 200;
      let remaining = xp;
      while (remaining >= threshold) {
        remaining -= threshold;
        level += 1;
        threshold = Math.floor(threshold * 1.15);
      }
      return level;
    }
  };

  const RiskMode = {
    armed: false,
    arm() {
      if (!GameState.run || this.armed) return;
      this.armed = true;
      UIRenderer.setStatus('Risk Mode armed: next question is high stakes.');
    },
    resolve(correct) {
      if (!this.armed) return;
      const run = GameState.run;
      if (!run) return;
      if (correct) {
        run.xp += 160;
        run.score += 30;
        run.riskWin = true;
        UIRenderer.setStatus('Risk Mode success.');
      } else {
        run.xp = Math.max(0, run.xp - 80);
        UIRenderer.setStatus('Risk Mode failed.');
      }
      this.armed = false;
    }
  };

  const DailyReward = {
    claim() {
      const today = Utils.todayKey();
      const lastClaim = localStorage.getItem('neonRiftDaily') || '';
      if (lastClaim === today) return;
      localStorage.setItem('neonRiftDaily', today);
      GameState.player.xp += 120;
      GameState.inventory.timeBoost += 1;
      GameState.inventory.doubleXP += 1;
      GameState.inventory.skip += 1;
      GameState.player.level = Progression.getLevel(GameState.player.xp);
      Storage.save();
      UIRenderer.updateHome();
      UIRenderer.setStatus('Daily reward claimed.');
      AchievementManager.check({ dailyClaimed: true });
    }
  };

  const InputHandlers = {
    init() {
      el.btnHome.addEventListener('click', () => {
        if (GameState.run) Game.finishMission(false);
        UIRenderer.switchScreen('home');
      });
      el.btnMissions.addEventListener('click', () => {
        if (GameState.run) Game.finishMission(false);
        UIRenderer.switchScreen('missions');
      });
      el.btnStart.addEventListener('click', () => Game.startMission(GameState.player.unlockedMission));
      el.btnMissionSelect.addEventListener('click', () => UIRenderer.switchScreen('missions'));
      el.btnClaimReward.addEventListener('click', () => DailyReward.claim());
      el.btnSubmit.addEventListener('click', () => Game.submitAnswer());
      el.answerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') Game.submitAnswer();
      });
      el.btnRisk.addEventListener('click', () => RiskMode.arm());
      el.btnNext.addEventListener('click', () => Game.startMission(Math.min(40, GameState.player.unlockedMission)));
      el.btnReplay.addEventListener('click', () => Game.startMission(GameState.player.unlockedMission));
      el.btnHomeResult.addEventListener('click', () => UIRenderer.switchScreen('home'));
    }
  };

  const App = {
    init() {
      Storage.load();
      MissionManager.init();
      AchievementManager.init();
      UIRenderer.updateHome();
      UIRenderer.renderMissionGrid();
      UIRenderer.switchScreen('home');
      InputHandlers.init();
      UIRenderer.setStatus('Mainframe ready.');
    }
  };

  document.addEventListener('DOMContentLoaded', App.init);
})();
