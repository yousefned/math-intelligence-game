(() => {
  'use strict';

  const Dom = {
    loading: document.getElementById('loading'),
    loadingBar: document.getElementById('loading-bar-fill'),
    app: document.getElementById('app'),
    screenHome: document.getElementById('screen-home'),
    screenMissions: document.getElementById('screen-missions'),
    screenGame: document.getElementById('screen-game'),
    screenResult: document.getElementById('screen-result'),
    btnHome: document.getElementById('btn-home'),
    btnMissions: document.getElementById('btn-missions'),
    btnSettings: document.getElementById('btn-settings'),
    btnPause: document.getElementById('btn-pause'),
    btnStart: document.getElementById('btn-start'),
    btnMissionSelect: document.getElementById('btn-mission-select'),
    btnTutorial: document.getElementById('btn-tutorial'),
    btnClaimReward: document.getElementById('btn-claim-reward'),
    btnRisk: document.getElementById('btn-risk'),
    btnSubmit: document.getElementById('btn-submit'),
    btnNext: document.getElementById('btn-next'),
    btnReplay: document.getElementById('btn-replay'),
    btnHomeResult: document.getElementById('btn-home-result'),
    btnResume: document.getElementById('btn-resume'),
    btnQuit: document.getElementById('btn-quit'),
    btnSettingsClose: document.getElementById('btn-settings-close'),
    btnTutorialClose: document.getElementById('btn-tutorial-close'),
    statLevel: document.getElementById('stat-level'),
    statXp: document.getElementById('stat-xp'),
    statAchievements: document.getElementById('stat-achievements'),
    statStreak: document.getElementById('stat-streak'),
    dailyStatus: document.getElementById('daily-status'),
    dailyRewardItem: document.getElementById('daily-reward-item'),
    dailyQuest: document.getElementById('daily-quest'),
    weeklyChallenge: document.getElementById('weekly-challenge'),
    moduleInsight: document.getElementById('module-insight'),
    riftStatus: document.getElementById('rift-status'),
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
    progressBar: document.getElementById('progress-bar'),
    status: document.getElementById('status'),
    resultTitle: document.getElementById('result-title'),
    resultXp: document.getElementById('result-xp'),
    resultAccuracy: document.getElementById('result-accuracy'),
    resultStreak: document.getElementById('result-streak'),
    resultCombo: document.getElementById('result-combo'),
    resultRewards: document.getElementById('result-rewards'),
    resultXpBar: document.getElementById('result-xp-bar'),
    resultXpText: document.getElementById('result-xp-text'),
    achievementFeed: document.getElementById('achievement-feed'),
    achievementPopup: document.getElementById('achievement-popup'),
    toast: document.getElementById('toast'),
    riftOverlay: document.getElementById('rift-overlay'),
    eventOverlay: document.getElementById('event-overlay'),
    tintOverlay: document.getElementById('tint-overlay'),
    flashOverlay: document.getElementById('flash-overlay'),
    bossOverlay: document.getElementById('boss-overlay'),
    particleLayer: document.getElementById('particle-layer'),
    pauseMenu: document.getElementById('pause-menu'),
    settingsPanel: document.getElementById('settings-panel'),
    tutorial: document.getElementById('tutorial'),
    xpFloater: document.getElementById('xp-floater'),
    toggleMotion: document.getElementById('toggle-motion'),
    toggleSound: document.getElementById('toggle-sound'),
    selectTheme: document.getElementById('select-theme'),
    selectFont: document.getElementById('select-font'),
    rangeVolume: document.getElementById('range-volume'),
    volumeValue: document.getElementById('volume-value'),
    questionCard: document.querySelector('.question-card'),
    riskPanel: document.getElementById('risk-panel'),
    streakIndicator: document.getElementById('streak-indicator')
  };

  const Utils = {
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    lerp(a, b, t) {
      return a + (b - a) * t;
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
    },
    now() {
      return performance.now();
    },
    todayKey() {
      const now = new Date();
      return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }
  };

  const TimerManager = {
    timeouts: new Set(),
    intervals: new Set(),
    setTimeout(fn, delay) {
      const id = window.setTimeout(() => {
        this.timeouts.delete(id);
        fn();
      }, delay);
      this.timeouts.add(id);
      return id;
    },
    setInterval(fn, delay) {
      const id = window.setInterval(fn, delay);
      this.intervals.add(id);
      return id;
    },
    clearAll() {
      this.timeouts.forEach((id) => window.clearTimeout(id));
      this.intervals.forEach((id) => window.clearInterval(id));
      this.timeouts.clear();
      this.intervals.clear();
    }
  };

  const Storage = {
    stateKey: 'neonRiftState',
    settingsKey: 'neonRiftSettings',
    loadState() {
      try {
        const raw = localStorage.getItem(this.stateKey);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    },
    saveState(state) {
      localStorage.setItem(this.stateKey, JSON.stringify(state));
    },
    loadSettings() {
      try {
        const raw = localStorage.getItem(this.settingsKey);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    },
    saveSettings(settings) {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
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
    run: null,
    paused: false,
    hydrate() {
      const saved = Storage.loadState();
      if (saved && saved.player) {
        this.player = { ...DEFAULT_STATE.player, ...saved.player };
      }
    },
    save() {
      Storage.saveState({ player: this.player });
    },
    resetRun() {
      this.run = null;
      this.paused = false;
    }
  };

  const SettingsManager = {
    settings: {
      reduceMotion: false,
      theme: 'neon',
      fontScale: 1,
      sound: true,
      volume: 0.5
    },
    init() {
      const saved = Storage.loadSettings();
      if (saved) {
        const normalized = { ...saved };
        if (typeof normalized.volume === 'number' && normalized.volume > 1) {
          normalized.volume = Utils.clamp(normalized.volume / 100, 0, 1);
        }
        this.settings = { ...this.settings, ...normalized };
      }
      Dom.toggleMotion.checked = this.settings.reduceMotion;
      Dom.toggleSound.checked = this.settings.sound;
      Dom.selectTheme.value = this.settings.theme;
      Dom.selectFont.value = String(this.settings.fontScale);
      Dom.rangeVolume.value = String(Math.round(this.settings.volume * 100));
      Dom.volumeValue.textContent = `${Math.round(this.settings.volume * 100)}%`;
      this.apply();
    },
    apply() {
      document.body.classList.toggle('reduce-motion', this.settings.reduceMotion);
      document.body.dataset.theme = this.settings.theme;
      document.documentElement.style.setProperty('--hud-scale', this.settings.fontScale);
    },
    update(partial) {
      this.settings = { ...this.settings, ...partial };
      this.apply();
      Storage.saveSettings(this.settings);
    }
  };

  const AudioManager = {
    context: null,
    master: null,
    ambient: null,
    unlocked: false,
    init() {
      if (this.context) return;
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.context.createGain();
      this.master.gain.value = SettingsManager.settings.sound ? SettingsManager.settings.volume : 0;
      this.master.connect(this.context.destination);
      this.unlocked = true;
      this.playAmbientLoop();
    },
    resume() {
      if (this.context && this.context.state === 'suspended') {
        this.context.resume();
      }
    },
    setVolume(value) {
      if (!this.master) return;
      this.master.gain.value = SettingsManager.settings.sound ? value : 0;
      if (this.ambient) {
        const ambientBase = SettingsManager.settings.sound ? Math.max(0.005, value * 0.08) : 0;
        this.ambient.gain.gain.setTargetAtTime(ambientBase, this.context.currentTime, 0.05);
      }
    },
    createTone(freq, duration, type = 'sine', gain = 0.3, glide = 0) {
      if (!SettingsManager.settings.sound || !this.context) return;
      const osc = this.context.createOscillator();
      const g = this.context.createGain();
      const now = this.context.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + glide), now + duration);
      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + duration);
    },
    play(name) {
      if (!this.context) this.init();
      if (!SettingsManager.settings.sound || !this.context) return;
      this.resume();
      switch (name) {
        case 'correct':
          this.createTone(760, 0.18, 'triangle', 0.22, 80);
          break;
        case 'wrong':
          this.createTone(180, 0.24, 'sawtooth', 0.28, -40);
          break;
        case 'level':
          this.createTone(880, 0.28, 'square', 0.28, 120);
          break;
        case 'power':
          this.createTone(540, 0.2, 'triangle', 0.2, 60);
          break;
        case 'boss':
          this.createTone(130, 0.45, 'sawtooth', 0.3, -30);
          break;
        case 'click':
          this.createTone(420, 0.07, 'square', 0.15);
          break;
        case 'start':
          this.createTone(520, 0.16, 'sine', 0.18, 60);
          break;
        default:
          this.createTone(360, 0.1, 'sine', 0.12);
      }
    },
    playClick() { this.play('click'); },
    playCorrect() { this.play('correct'); },
    playWrong() { this.play('wrong'); },
    playLevelUp() { this.play('level'); },
    playPowerUp() { this.play('power'); },
    playBossWarning() { this.play('boss'); },
    playAmbientLoop() {
      if (!this.context) return;
      if (!SettingsManager.settings.sound) return;
      if (!this.ambient) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        this.ambient = { osc, gain };
      }
      this.setVolume(SettingsManager.settings.volume);
    },
    stopAmbient() {
      if (this.ambient && this.context) {
        this.ambient.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.08);
      }
    }
  };

  const AnimationEngine = {
    tweens: new Set(),
    raf: null,
    tick(time) {
      this.tweens.forEach((tween) => {
        const progress = Utils.clamp((time - tween.start) / tween.duration, 0, 1);
        const eased = tween.easing(progress);
        tween.update(eased);
        if (progress >= 1) {
          this.tweens.delete(tween);
          if (tween.complete) tween.complete();
        }
      });
      if (this.tweens.size > 0) {
        this.raf = requestAnimationFrame(this.tick.bind(this));
      } else {
        this.raf = null;
      }
    },
    animate({ duration, update, easing, complete }) {
      const tween = {
        start: Utils.now(),
        duration,
        update,
        easing: easing || ((t) => t),
        complete
      };
      this.tweens.add(tween);
      if (!this.raf) {
        this.raf = requestAnimationFrame(this.tick.bind(this));
      }
    },
    clear() {
      this.tweens.clear();
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  };

  const ParticleEngine = {
    spawn(x, y, count = 12, color = 'rgba(46, 247, 255, 0.7)') {
      if (SettingsManager.settings.reduceMotion) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i += 1) {
        const p = document.createElement('span');
        p.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const distance = Utils.rand(10, 50);
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
        p.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
        p.style.background = color;
        frag.appendChild(p);
        TimerManager.setTimeout(() => p.remove(), 1200);
      }
      Dom.particleLayer.appendChild(frag);
    },
    burstFromElement(el, color) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      this.spawn(x, y, 14, color);
    }
  };

  const UIRenderer = {
    cache: new Map(),
    update(id, value) {
      if (this.cache.get(id) === value) return;
      this.cache.set(id, value);
      const el = Dom[id];
      if (el) el.textContent = value;
    },
    updateHtml(el, value) {
      if (el.innerHTML === value) return;
      el.innerHTML = value;
    },
    setClass(el, className, active) {
      el.classList.toggle(className, active);
    }
  };

  const ScreenManager = {
    current: Dom.screenHome,
    switchTo(target) {
      if (this.current === target) return;
      TimerManager.clearAll();
      AnimationEngine.clear();
      if (GameState.run && target !== Dom.screenGame) {
        GameLoop.stop();
        EventSystem.stop();
        GameState.resetRun();
      }
      this.current.classList.add('exiting');
      const prev = this.current;
      TimerManager.setTimeout(() => {
        prev.classList.remove('active', 'exiting');
      }, 420);
      this.current = target;
      target.classList.add('active');
      Dom.pauseMenu.classList.remove('show');
      Dom.settingsPanel.classList.remove('show');
      Dom.tutorial.classList.remove('show');
      document.body.classList.remove('glitch-mode', 'boss-mode');
      Dom.riftOverlay.style.opacity = 0;
      Dom.eventOverlay.style.opacity = 0;
      Dom.tintOverlay.style.opacity = 0;
      Dom.flashOverlay.classList.remove('good', 'bad');
      Dom.bossOverlay.classList.remove('show');
      document.body.classList.remove('risk-mode');
    }
  };

  const DifficultyScaler = {
    getDifficulty(run) {
      const base = 1 + Math.floor(run.level / 2);
      const accuracy = run.total > 0 ? run.correct / run.total : 0.5;
      const streakBoost = Math.min(run.streak / 10, 1);
      const difficulty = Utils.clamp(base + accuracy * 2 + streakBoost * 2, 1, 8);
      return difficulty;
    }
  };

  const MissionManager = {
    list: [
      { id: 1, name: 'Quickfire Arithmetic', type: 'quick', desc: 'Rapid calculations with accelerating tempo.', difficulty: 1, duration: 50 },
      { id: 2, name: 'Pattern Pulse', type: 'pattern', desc: 'Detect number patterns and predict the next value.', difficulty: 2, duration: 55 },
      { id: 3, name: 'Memory Echo', type: 'memory', desc: 'Remember and solve with a delayed reveal.', difficulty: 2, duration: 55 },
      { id: 4, name: 'Boss Hybrid: Rift Core', type: 'boss', desc: 'Multi-layer logic under time distortion.', difficulty: 3, duration: 60, boss: true },
      { id: 5, name: 'Logic Chain', type: 'logic', desc: 'Two-step logic puzzles with variable weights.', difficulty: 3, duration: 60 },
      { id: 6, name: 'Time-Freeze Gauntlet', type: 'freeze', desc: 'Solve while time freezes after accuracy streaks.', difficulty: 3, duration: 60 },
      { id: 7, name: 'Pattern Forge', type: 'pattern', desc: 'Pattern recognition with hidden gaps.', difficulty: 4, duration: 65 },
      { id: 8, name: 'Boss Hybrid: Prism Gate', type: 'boss', desc: 'Boss hybrid mission with rift events.', difficulty: 4, duration: 65, boss: true },
      { id: 9, name: 'Multi-Step Logic', type: 'logic', desc: 'Solve chained equations under pressure.', difficulty: 4, duration: 70 },
      { id: 10, name: 'Echo Memory', type: 'memory', desc: 'Hold numbers and combine after delays.', difficulty: 4, duration: 70 },
      { id: 11, name: 'Risk Protocol', type: 'quick', desc: 'High stakes arithmetic with amplified XP.', difficulty: 5, duration: 70 },
      { id: 12, name: 'Boss Hybrid: Signal Storm', type: 'boss', desc: 'Boss hybrid with adaptive distortion.', difficulty: 5, duration: 75, boss: true }
    ],
    init() {
      GameState.missions = this.list;
      this.renderGrid();
    },
    renderGrid() {
      Dom.missionGrid.innerHTML = '';
      GameState.missions.forEach((mission) => {
      const card = document.createElement('div');
        card.className = `mission-card${mission.boss ? ' boss' : ''}${mission.id > GameState.player.unlockedMissions ? ' locked' : ''}`;
        card.dataset.id = mission.id;
        card.dataset.type = mission.boss ? 'boss' : mission.type;
        card.innerHTML = `
          <div class="mission-badge">${mission.boss ? 'BOSS' : 'MISSION'} · LVL ${mission.difficulty}</div>
          <div class="mission-title">${mission.name}</div>
          <div class="mission-desc">${mission.desc}</div>
          <div class="mission-meta">
            <span>${mission.type.toUpperCase()}</span>
            <span>${mission.duration}s</span>
          </div>
        `;
        card.addEventListener('click', () => {
          if (mission.id <= GameState.player.unlockedMissions) {
            AudioManager.playClick();
            startMission(mission);
          }
        });
        Dom.missionGrid.appendChild(card);
      });
    }
  };

  const QuestionEngine = {
    lastMemory: null,
    generate(run) {
      const diff = DifficultyScaler.getDifficulty(run);
      const type = run.mission.type;
      if (type === 'pattern') return this.patternQuestion(diff);
      if (type === 'memory') return this.memoryQuestion(diff);
      if (type === 'logic') return this.logicQuestion(diff);
      if (type === 'freeze') return this.freezeQuestion(diff);
      if (type === 'boss') return this.bossQuestion(diff);
      return this.quickQuestion(diff);
    },
    quickQuestion(diff) {
      const a = Utils.rand(2, 10 + diff * 2);
      const b = Utils.rand(2, 10 + diff * 2);
      const ops = ['+', '-', '×'];
      const op = Utils.pick(ops);
      let answer = 0;
      if (op === '+') answer = a + b;
      if (op === '-') answer = a - b;
      if (op === '×') answer = a * b;
      return { type: 'Quickfire', text: `${a} ${op} ${b}`, answer };
    },
    patternQuestion(diff) {
      const base = Utils.rand(2, 6 + diff);
      const step = Utils.rand(2, 4 + Math.floor(diff / 2));
      const seq = [base, base + step, base + step * 2, base + step * 3];
      const missing = seq.pop();
      return { type: 'Pattern', text: `${seq.join(' , ')} , ?`, answer: missing };
    },
    memoryQuestion(diff) {
      const a = Utils.rand(2, 8 + diff);
      const b = Utils.rand(2, 8 + diff);
      const c = Utils.rand(2, 8 + diff);
      const sum = a + b + c;
      this.lastMemory = { a, b, c, sum };
      return { type: 'Memory Echo', text: `Memorize: ${a} · ${b} · ${c}`, answer: sum, delayed: true };
    },
    logicQuestion(diff) {
      const a = Utils.rand(1, 6 + diff);
      const b = Utils.rand(1, 6 + diff);
      const c = Utils.rand(1, 6 + diff);
      const text = `(${a} + ${b}) × ${c}`;
      return { type: 'Logic Chain', text, answer: (a + b) * c };
    },
    freezeQuestion(diff) {
      const a = Utils.rand(2, 10 + diff);
      const b = Utils.rand(2, 10 + diff);
      return { type: 'Time-Freeze', text: `${a * b} ÷ ${a}`, answer: b };
    },
    bossQuestion(diff) {
      const a = Utils.rand(3, 8 + diff);
      const b = Utils.rand(2, 7 + diff);
      const c = Utils.rand(1, 5 + diff);
      const text = `${a} × ${b} - ${c}`;
      return { type: 'Boss Hybrid', text, answer: a * b - c };
    }
  };

  const EventSystem = {
    active: null,
    nextEventTimeout: null,
    start(run) {
      this.stop();
      this.schedule(run);
    },
    schedule(run) {
      const delay = Utils.rand(8000, 14000);
      this.nextEventTimeout = TimerManager.setTimeout(() => {
        const event = Utils.pick(['glitch', 'slow', 'surge']);
        this.activate(event, run);
      }, delay);
    },
    activate(event, run) {
      this.active = event;
      if (event === 'glitch') {
        document.body.classList.add('glitch-mode');
        Dom.eventOverlay.style.background = 'rgba(255,255,255,0.08)';
        Dom.eventOverlay.style.opacity = 1;
        Dom.tintOverlay.style.background = 'rgba(255, 255, 255, 0.08)';
        Dom.tintOverlay.style.opacity = 1;
      }
      if (event === 'slow') {
        document.body.classList.add('slow-mode');
        Dom.riftOverlay.style.opacity = 0.7;
        run.timeScale = 0.6;
      }
      if (event === 'surge') {
        Dom.tintOverlay.style.background = 'rgba(61,255,154,0.2)';
        Dom.tintOverlay.style.opacity = 1;
        run.xpBoost = 1.4;
      }
      showToast(`Rift event: ${event.toUpperCase()}`);
      UIRenderer.update('hudEvent', event.toUpperCase());
      Dom.riftStatus.textContent = `Rift event active: ${event}`;
      TimerManager.setTimeout(() => {
        this.deactivate(run);
      }, 5000);
    },
    deactivate(run) {
      this.active = null;
      document.body.classList.remove('glitch-mode');
      document.body.classList.remove('slow-mode');
      Dom.eventOverlay.style.opacity = 0;
      Dom.riftOverlay.style.opacity = 0;
      Dom.tintOverlay.style.opacity = 0;
      run.timeScale = 1;
      run.xpBoost = 1;
      UIRenderer.update('hudEvent', 'STABLE');
      Dom.riftStatus.textContent = 'Randomized AI anomalies amplify performance windows.';
      this.schedule(run);
    },
    stop() {
      this.active = null;
      Dom.eventOverlay.style.opacity = 0;
      Dom.riftOverlay.style.opacity = 0;
      Dom.tintOverlay.style.opacity = 0;
      if (this.nextEventTimeout) window.clearTimeout(this.nextEventTimeout);
      this.nextEventTimeout = null;
    }
  };

  const PowerUpManager = {
    definitions: [
      { key: 'timeBoost', label: 'Time Boost', desc: '+6s', effect: (run) => { run.timeLeft += 6; } },
      { key: 'doubleXp', label: 'Double XP', desc: 'x2 XP 8s', effect: (run) => { run.doubleXpUntil = Utils.now() + 8000; } },
      { key: 'skip', label: 'Skip', desc: 'Skip question', effect: (run) => { run.skipNext = true; } },
      { key: 'freeze', label: 'Freeze', desc: 'Freeze time 4s', effect: (run) => { run.frozenUntil = Utils.now() + 4000; } }
    ],
    render() {
      Dom.powerups.innerHTML = '';
      this.definitions.forEach((def) => {
        const item = document.createElement('div');
        item.className = 'powerup';
        item.dataset.key = def.key;
        item.innerHTML = `<span>${def.label}</span><span>${GameState.player.powerups[def.key].count}</span>`;
        item.addEventListener('click', () => this.activate(def.key));
        Dom.powerups.appendChild(item);
      });
    },
    activate(key) {
      if (!GameState.run) return;
      const power = GameState.player.powerups[key];
      if (!power || power.count <= 0) return;
      const now = Utils.now();
      if (now - power.lastUsed < power.cooldown * 1000) return;
      power.count -= 1;
      power.lastUsed = now;
      const def = this.definitions.find((d) => d.key === key);
      if (def) def.effect(GameState.run);
      Dom.tintOverlay.style.background = 'rgba(46,247,255,0.2)';
      Dom.tintOverlay.style.opacity = 1;
      TimerManager.setTimeout(() => { Dom.tintOverlay.style.opacity = 0; }, 400);
      AudioManager.playPowerUp();
      ParticleEngine.burstFromElement(Dom.powerups.querySelector(`[data-key="${key}"]`), 'rgba(46, 247, 255, 0.8)');
      this.render();
      updateStatus(`${def.label} activated`);
      if (key === 'skip') presentQuestion(GameState.run);
    }
  };

  const AchievementManager = {
    list: [
      'First Contact', 'Quickfire Novice', 'Quickfire Pro', 'Pattern Initiate', 'Pattern Savant',
      'Memory Spark', 'Memory Anchor', 'Logic Apprentice', 'Logic Architect', 'Boss Slayer I',
      'Boss Slayer II', 'Combo Builder', 'Combo Master', 'Streak 5', 'Streak 10',
      'Streak 20', 'Risk Taker', 'Risk Legend', 'Time Controller', 'Speedrunner',
      'Perfectionist', 'Adaptive Mind', 'Neural Surge', 'Daily Devotee', 'Weekly Warrior',
      'Rift Survivor', 'Rift Bender', 'XP Hoarder', 'XP Titan', 'Level 5',
      'Level 10', 'Level 15', 'Calm Under Fire', 'Hyper Focus', 'Echo Keeper',
      'Freeze Master', 'Power Collector', 'Boss Hunter', 'Mission Specialist', 'All-Rounder',
      'Accuracy 80', 'Accuracy 90', 'Accuracy 95', 'Combo 6', 'Combo 10'
    ],
    unlock(name) {
      if (GameState.player.achievements.includes(name)) return;
      GameState.player.achievements.push(name);
      const item = document.createElement('div');
      item.className = 'module-card';
      item.textContent = `Achievement unlocked: ${name}`;
      Dom.achievementFeed.appendChild(item);
      TimerManager.setTimeout(() => item.remove(), 4000);
      Dom.achievementPopup.textContent = `Unlocked: ${name}`;
      Dom.achievementPopup.classList.add('show');
      TimerManager.setTimeout(() => Dom.achievementPopup.classList.remove('show'), 1800);
      GameState.save();
      AudioManager.playLevelUp();
      updateHomeStats();
    },
    evaluate(run) {
      if (run.total === 1) this.unlock('First Contact');
      if (run.streak >= 5) this.unlock('Streak 5');
      if (run.streak >= 10) this.unlock('Streak 10');
      if (run.streak >= 20) this.unlock('Streak 20');
      if (run.combo >= 6) this.unlock('Combo 6');
      if (run.combo >= 10) this.unlock('Combo 10');
      const accuracy = run.total ? run.correct / run.total : 0;
      if (accuracy >= 0.8) this.unlock('Accuracy 80');
      if (accuracy >= 0.9) this.unlock('Accuracy 90');
      if (accuracy >= 0.95) this.unlock('Accuracy 95');
      if (GameState.player.level >= 5) this.unlock('Level 5');
      if (GameState.player.level >= 10) this.unlock('Level 10');
      if (GameState.player.level >= 15) this.unlock('Level 15');
      if (run.risk) this.unlock('Risk Taker');
    }
  };

  const GameLoop = {
    raf: null,
    lastTime: 0,
    start() {
      this.stop();
      this.lastTime = Utils.now();
      const tick = (time) => {
        if (!GameState.run) return;
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;
        if (!GameState.paused) {
          updateRun(delta);
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    },
    stop() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  };

  function updateStatus(message) {
    Dom.status.textContent = message;
  }

  function showToast(message) {
    Dom.toast.textContent = message;
    Dom.toast.classList.add('show');
    TimerManager.setTimeout(() => Dom.toast.classList.remove('show'), 1600);
  }

  function showXp(amount) {
    Dom.xpFloater.textContent = `+${amount} XP`;
    Dom.xpFloater.classList.remove('show');
    void Dom.xpFloater.offsetWidth;
    Dom.xpFloater.classList.add('show');
  }

  function triggerFlash(type) {
    if (SettingsManager.settings.reduceMotion) return;
    Dom.flashOverlay.classList.remove('good', 'bad');
    void Dom.flashOverlay.offsetWidth;
    Dom.flashOverlay.classList.add(type);
    TimerManager.setTimeout(() => Dom.flashOverlay.classList.remove(type), 420);
  }

  function updateStreakIndicator(run) {
    if (!Dom.streakIndicator) return;
    const streakLevel = Utils.clamp(run.streak / Math.max(6, run.targetStreak), 0, 1);
    Dom.streakIndicator.classList.toggle('hot', run.streak >= 6);
    Dom.streakIndicator.style.setProperty('--streak-width', `${Math.round(streakLevel * 100)}%`);
  }

  function updateHomeStats() {
    UIRenderer.update('statLevel', GameState.player.level);
    UIRenderer.update('statXp', GameState.player.totalXp);
    UIRenderer.update('statAchievements', GameState.player.achievements.length);
    UIRenderer.update('statStreak', GameState.player.bestStreak);
  }

  function updateObjectives(run) {
    const objectives = [
      `Maintain ${Math.min(10, run.targetStreak)} streak`,
      `Reach ${run.targetScore} score`,
      `Accuracy ${Math.round(run.targetAccuracy * 100)}%`
    ];
    Dom.objectiveList.innerHTML = '';
    objectives.forEach((obj) => {
      const li = document.createElement('li');
      li.textContent = obj;
      Dom.objectiveList.appendChild(li);
    });
  }

  function updateHud(run) {
    UIRenderer.update('hudMission', run.mission.name);
    UIRenderer.update('hudObjective', run.objectiveLabel);
    UIRenderer.update('hudXp', Math.round(run.xpEarned));
    UIRenderer.update('hudScore', run.score);
    UIRenderer.update('hudTime', Utils.formatTime(run.timeLeft));
    UIRenderer.update('hudStreak', run.streak);
    UIRenderer.update('hudCombo', `x${run.combo}`);
    UIRenderer.update('hudLevel', GameState.player.level);
    updateStreakIndicator(run);
    const streakWrap = Dom.hudStreak.closest('.hud-mini');
    if (streakWrap) streakWrap.classList.toggle('hot', run.streak >= 8);
  }

  function setupChoices(question) {
    Dom.choices.innerHTML = '';
    Dom.inputWrap.style.display = 'none';
    if (question.choices) {
      question.choices.forEach((choice) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = choice;
        btn.addEventListener('click', () => {
          AudioManager.playClick();
          submitAnswer(choice);
        });
        Dom.choices.appendChild(btn);
      });
    } else {
      Dom.inputWrap.style.display = 'flex';
      Dom.answerInput.value = '';
      Dom.answerInput.focus();
    }
  }

  function presentQuestion(run) {
    run.currentQuestion = QuestionEngine.generate(run);
    Dom.questionType.textContent = run.currentQuestion.type;
    Dom.question.textContent = run.currentQuestion.text;
    Dom.feedback.textContent = 'Awaiting input...';
    Dom.questionCard.classList.remove('correct', 'wrong', 'flash', 'fail');

    if (run.currentQuestion.delayed) {
      setupChoices({ choices: null });
      Dom.inputWrap.style.display = 'none';
      TimerManager.setTimeout(() => {
        Dom.question.textContent = `Sum the values: ?`;
        Dom.inputWrap.style.display = 'flex';
        Dom.answerInput.focus();
      }, 1200);
    } else if (run.currentQuestion.type === 'Pattern') {
      const choices = Utils.shuffle([
        run.currentQuestion.answer,
        run.currentQuestion.answer + Utils.rand(1, 4),
        run.currentQuestion.answer - Utils.rand(1, 4),
        run.currentQuestion.answer + Utils.rand(5, 9)
      ]).map((n) => String(n));
      run.currentQuestion.choices = choices;
      setupChoices(run.currentQuestion);
    } else {
      setupChoices({ choices: null });
    }
  }

  function updateRun(delta) {
    const run = GameState.run;
    if (!run) return;

    const now = Utils.now();
    const timeScale = run.timeScale || 1;
    if (run.frozenUntil && now < run.frozenUntil) {
      run.frozen = true;
    } else {
      run.frozen = false;
    }

    if (!run.frozen) {
      run.timeLeft -= delta * timeScale;
    }

    if (run.timeLeft <= 0) {
      run.timeLeft = 0;
      finishMission();
      return;
    }

    updateHud(run);
    Dom.progressBar.style.width = `${(run.timeLeft / run.duration) * 100}%`;
  }

  function submitAnswer(value) {
    const run = GameState.run;
    if (!run) return;
    const answer = value ?? Dom.answerInput.value.trim();
    if (answer === '') return;
    const correct = Number(answer) === Number(run.currentQuestion.answer);
    run.total += 1;
    if (correct) {
      run.correct += 1;
      run.streak += 1;
      run.combo = Math.min(run.combo + 1, 12);
      const baseXp = 20 + Math.round(run.combo * 3);
      const riskMultiplier = run.risk ? 1.6 : 1;
      const doubleXp = run.doubleXpUntil && Utils.now() < run.doubleXpUntil ? 2 : 1;
      const xpGain = Math.round(baseXp * riskMultiplier * doubleXp * run.xpBoost);
      run.xpEarned += xpGain;
      run.score += Math.round(10 * run.combo);
      Dom.feedback.textContent = 'Correct. Momentum up.';
      Dom.questionCard.classList.add('correct', 'flash');
      ParticleEngine.burstFromElement(Dom.questionCard, 'rgba(61, 255, 154, 0.8)');
      showXp(xpGain);
      AudioManager.playCorrect();
      triggerFlash('good');
      Dom.hudStreak.classList.add('pulse');
      Dom.hudCombo.classList.add('pulse');
      TimerManager.setTimeout(() => {
        Dom.hudStreak.classList.remove('pulse');
        Dom.hudCombo.classList.remove('pulse');
        Dom.questionCard.classList.remove('flash');
      }, 520);
      if (run.streak > GameState.player.bestStreak) {
        GameState.player.bestStreak = run.streak;
      }
      if (run.mission.type === 'freeze' && run.streak % 3 === 0) {
        run.frozenUntil = Utils.now() + 2500;
        showToast('Time freeze engaged');
      }
    } else {
      run.combo = 1;
      run.streak = 0;
      run.score = Math.max(0, run.score - 10);
      if (run.risk) run.xpEarned = Math.max(0, run.xpEarned - 15);
      Dom.feedback.textContent = `Incorrect. Answer was ${run.currentQuestion.answer}.`;
      Dom.questionCard.classList.add('wrong', 'fail');
      Dom.questionCard.classList.add('glitch');
      ParticleEngine.burstFromElement(Dom.questionCard, 'rgba(255, 77, 94, 0.8)');
      AudioManager.playWrong();
      triggerFlash('bad');
      if (run.mission.boss) {
        Dom.app.classList.add('shake');
        TimerManager.setTimeout(() => Dom.app.classList.remove('shake'), 320);
      }
      TimerManager.setTimeout(() => Dom.questionCard.classList.remove('glitch'), 240);
      TimerManager.setTimeout(() => Dom.questionCard.classList.remove('fail'), 520);
    }

    AchievementManager.evaluate(run);
    updateHud(run);
    presentQuestion(run);
  }

  function startMission(mission) {
    ScreenManager.switchTo(Dom.screenGame);
    document.body.classList.toggle('boss-mode', !!mission.boss);
    AudioManager.play('start');
    GameState.run = {
      mission,
      level: mission.difficulty,
      score: 0,
      xpEarned: 0,
      correct: 0,
      total: 0,
      streak: 0,
      combo: 1,
      timeLeft: mission.duration,
      duration: mission.duration,
      targetStreak: 6 + mission.difficulty,
      targetScore: 160 + mission.difficulty * 30,
      targetAccuracy: 0.75,
      objectiveLabel: mission.type.toUpperCase(),
      xpBoost: 1,
      timeScale: 1,
      risk: false,
      skipNext: false
    };
    updateObjectives(GameState.run);
    PowerUpManager.render();
    updateHud(GameState.run);
    EventSystem.start(GameState.run);
    if (mission.boss) {
      const bossDuration = SettingsManager.settings.reduceMotion ? 600 : 2000;
      Dom.bossOverlay.classList.add('show');
      AudioManager.playBossWarning();
      if (!SettingsManager.settings.reduceMotion) {
        Dom.app.classList.add('shake');
        triggerFlash('bad');
        ParticleEngine.spawn(window.innerWidth / 2, window.innerHeight / 2, 30, 'rgba(255, 77, 94, 0.85)');
        TimerManager.setTimeout(() => Dom.app.classList.remove('shake'), 320);
      }
      TimerManager.setTimeout(() => Dom.bossOverlay.classList.remove('show'), bossDuration);
    }
    presentQuestion(GameState.run);
    GameLoop.start();
  }

  function finishMission() {
    const run = GameState.run;
    if (!run) return;
    GameLoop.stop();
    EventSystem.stop();
    Dom.riskPanel.classList.remove('active');
    document.body.classList.remove('boss-mode');
    document.body.classList.remove('risk-mode');
    ScreenManager.switchTo(Dom.screenResult);

    const accuracy = run.total ? Math.round((run.correct / run.total) * 100) : 0;
    Dom.resultTitle.textContent = accuracy >= 80 ? 'Mission Complete' : 'Mission Logged';
    Dom.resultXp.textContent = `${run.xpEarned}`;
    Dom.resultAccuracy.textContent = `${accuracy}%`;
    Dom.resultStreak.textContent = `${run.streak}`;
    Dom.resultCombo.textContent = `x${run.combo}`;
    Dom.resultRewards.textContent = accuracy >= 80 ? 'Rewards: +1 Time Boost · Rift Token' : 'Rewards: Focus Token';

    const xpNeeded = 200 + GameState.player.level * 60;
    GameState.player.xp += run.xpEarned;
    GameState.player.totalXp += run.xpEarned;
    let leveled = false;
    if (GameState.player.xp >= xpNeeded) {
      GameState.player.level += 1;
      GameState.player.xp = GameState.player.xp - xpNeeded;
      GameState.player.unlockedMissions = Math.min(GameState.player.unlockedMissions + 1, GameState.missions.length);
      leveled = true;
      AudioManager.playLevelUp();
    }

    const targetXp = Math.min(100, (GameState.player.xp / xpNeeded) * 100);
    if (SettingsManager.settings.reduceMotion) {
      Dom.resultXpBar.style.width = `${targetXp}%`;
    } else {
      Dom.resultXpBar.style.width = '0%';
      AnimationEngine.animate({
        duration: 800,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        update: (t) => {
          Dom.resultXpBar.style.width = `${Math.round(targetXp * t)}%`;
        }
      });
    }
    Dom.resultXpText.textContent = `${GameState.player.xp} / ${xpNeeded}`;

    AchievementManager.evaluate(run);
    GameState.save();
    updateHomeStats();
    MissionManager.renderGrid();
    if (leveled) {
      showToast('Level up!');
      ParticleEngine.burstFromElement(Dom.resultXpBar, 'rgba(61, 255, 154, 0.9)');
      triggerFlash('good');
    }
  }

  function setupDailyReward() {
    const today = Utils.todayKey();
    if (GameState.player.dailyClaim === today) {
      Dom.dailyStatus.textContent = 'Claimed';
      Dom.btnClaimReward.disabled = true;
      return;
    }
    Dom.dailyStatus.textContent = 'Available';
    Dom.btnClaimReward.disabled = false;
  }

  function claimDailyReward() {
    const today = Utils.todayKey();
    if (GameState.player.dailyClaim === today) return;
    GameState.player.dailyClaim = today;
    GameState.player.totalXp += 120;
    GameState.player.xp += 120;
    GameState.player.powerups.timeBoost.count += 1;
    GameState.save();
    updateHomeStats();
    setupDailyReward();
    showToast('Daily reward claimed');
  }

  function togglePause() {
    if (!GameState.run) return;
    GameState.paused = !GameState.paused;
    Dom.pauseMenu.classList.toggle('show', GameState.paused);
    if (GameState.paused) {
      AudioManager.playClick();
    }
  }

  function toggleRisk() {
    if (!GameState.run) return;
    GameState.run.risk = !GameState.run.risk;
    Dom.riskPanel.classList.toggle('active', GameState.run.risk);
    document.body.classList.toggle('risk-mode', GameState.run.risk);
    Dom.btnRisk.textContent = GameState.run.risk ? 'Risk Active' : 'Activate Risk';
    showToast(GameState.run.risk ? 'Risk mode engaged' : 'Risk mode disabled');
  }

  function setupControls() {
    Dom.btnHome.addEventListener('click', () => {
      AudioManager.playClick();
      ScreenManager.switchTo(Dom.screenHome);
    });
    Dom.btnMissions.addEventListener('click', () => {
      AudioManager.playClick();
      ScreenManager.switchTo(Dom.screenMissions);
    });
    Dom.btnSettings.addEventListener('click', () => {
      AudioManager.playClick();
      Dom.settingsPanel.classList.add('show');
    });
    Dom.btnPause.addEventListener('click', togglePause);
    Dom.btnStart.addEventListener('click', () => {
      AudioManager.playClick();
      startMission(GameState.missions[0]);
    });
    Dom.btnMissionSelect.addEventListener('click', () => {
      AudioManager.playClick();
      ScreenManager.switchTo(Dom.screenMissions);
    });
    Dom.btnTutorial.addEventListener('click', () => {
      AudioManager.playClick();
      Dom.tutorial.classList.add('show');
    });
    Dom.btnTutorialClose.addEventListener('click', () => {
      AudioManager.playClick();
      Dom.tutorial.classList.remove('show');
    });
    Dom.btnClaimReward.addEventListener('click', () => {
      AudioManager.playClick();
      claimDailyReward();
    });
    Dom.btnRisk.addEventListener('click', () => {
      AudioManager.playClick();
      toggleRisk();
    });
    Dom.btnSubmit.addEventListener('click', () => {
      AudioManager.playClick();
      submitAnswer();
    });
    Dom.answerInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitAnswer();
    });
    Dom.btnNext.addEventListener('click', () => {
      AudioManager.playClick();
      const next = GameState.run ? GameState.run.mission.id + 1 : 1;
      const mission = GameState.missions.find((m) => m.id === next) || GameState.missions[0];
      startMission(mission);
    });
    Dom.btnReplay.addEventListener('click', () => {
      AudioManager.playClick();
      const mission = GameState.run ? GameState.run.mission : GameState.missions[0];
      startMission(mission);
    });
    Dom.btnHomeResult.addEventListener('click', () => {
      AudioManager.playClick();
      ScreenManager.switchTo(Dom.screenHome);
    });
    Dom.btnResume.addEventListener('click', togglePause);
    Dom.btnQuit.addEventListener('click', () => {
      AudioManager.playClick();
      GameState.resetRun();
      ScreenManager.switchTo(Dom.screenHome);
    });
    Dom.btnSettingsClose.addEventListener('click', () => {
      AudioManager.playClick();
      Dom.settingsPanel.classList.remove('show');
    });
    Dom.toggleMotion.addEventListener('change', (event) => {
      SettingsManager.update({ reduceMotion: event.target.checked });
    });
    Dom.toggleSound.addEventListener('change', (event) => {
      SettingsManager.update({ sound: event.target.checked });
      AudioManager.init();
      if (SettingsManager.settings.sound) {
        AudioManager.playAmbientLoop();
      } else {
        AudioManager.stopAmbient();
      }
      AudioManager.setVolume(SettingsManager.settings.volume);
    });
    Dom.selectTheme.addEventListener('change', (event) => {
      SettingsManager.update({ theme: event.target.value });
    });
    Dom.selectFont.addEventListener('change', (event) => {
      SettingsManager.update({ fontScale: Number(event.target.value) });
    });
    Dom.rangeVolume.addEventListener('input', (event) => {
      const value = Utils.clamp(Number(event.target.value) / 100, 0, 1);
      SettingsManager.update({ volume: value });
      Dom.volumeValue.textContent = `${Math.round(value * 100)}%`;
      AudioManager.init();
      AudioManager.setVolume(value);
    });

    document.addEventListener('click', () => {
      if (!AudioManager.unlocked) AudioManager.init();
    }, { once: true });
    document.addEventListener('keydown', () => {
      if (!AudioManager.unlocked) AudioManager.init();
    }, { once: true });
  }

  function setupDailyQuest() {
    const dailyOptions = [
      'Win 3 pattern missions with 80% accuracy.',
      'Chain a 6x combo in any mission.',
      'Collect 200 XP in a single run.',
      'Solve 12 questions in 60 seconds.'
    ];
    const weeklyOptions = [
      'Complete 15 missions in risk mode.',
      'Defeat 3 boss missions.',
      'Reach level 5 this week.',
      'Maintain 85% accuracy across 10 missions.'
    ];
    Dom.dailyQuest.textContent = Utils.pick(dailyOptions);
    Dom.weeklyChallenge.textContent = Utils.pick(weeklyOptions);
  }

  function boot() {
    GameState.hydrate();
    SettingsManager.init();
    MissionManager.init();
    updateHomeStats();
    setupDailyReward();
    setupDailyQuest();
    setupControls();

    AnimationEngine.animate({
      duration: 1200,
      update: (t) => {
        Dom.loadingBar.style.width = `${Math.round(t * 100)}%`;
      },
      complete: () => {
        Dom.loading.classList.add('hidden');
      }
    });
  }

  boot();
})();
