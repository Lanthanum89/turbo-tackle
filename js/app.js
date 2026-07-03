import { Game, MODES } from "./game.js";
import { THEME } from "./theme.js";
import { getHighScore, setHighScoreIfBetter } from "./storage.js";

const canvas = document.getElementById("game-canvas");
const modeScreen = document.getElementById("mode-screen");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const pauseOverlay = document.getElementById("pause-overlay");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");
const hud = document.getElementById("hud");
const touchControls = document.getElementById("touch-controls");
const scoreHud = document.getElementById("score-hud");
const livesHud = document.getElementById("lives-hud");
const gameOverMessage = document.getElementById("game-over-message");
const finalScoreEl = document.getElementById("final-score");
const statBest = document.getElementById("stat-best");
const statTime = document.getElementById("stat-time");
const statStars = document.getElementById("stat-stars");
const statDodged = document.getElementById("stat-dodged");
const statAccuracy = document.getElementById("stat-accuracy");
const highScoreDisplay = document.getElementById("high-score-display");
const restartBtn = document.getElementById("restart-btn");
const changeDifficultyBtn = document.getElementById("change-difficulty-btn");
const backToModesBtn = document.getElementById("back-to-modes-btn");
const difficultyModeTitle = document.getElementById("difficulty-mode-title");
const difficultyModeDesc = document.getElementById("difficulty-mode-desc");
const controlHint = document.getElementById("control-hint");
const gameOverTitle = document.getElementById("game-over-title");
const difficultySelect = document.getElementById("difficulty-select");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const quitBtn = document.getElementById("quit-btn");
const muteBtn = document.getElementById("mute-btn");
const pauseMuteBtn = document.getElementById("pause-mute-btn");

const DIFFICULTY_DESCRIPTIONS = {
  easy: "Slow & steady — great for first runs",
  normal: "Picks up speed as you go",
  hard: "Fast, less warning before things arrive",
};

const CONTROL_HINTS = {
  dodge: "← → or swipe to dodge",
  collect: "← → or swipe to collect",
  rainbow: "← → or swipe to steer",
};

const GAME_OVER_TITLES = {
  dodge: "GAME OVER",
  collect: "GAME OVER",
  rainbow: "TIME'S UP",
};

let game = null;
let lastMode = "dodge";
let lastDifficulty = "normal";
let muted = false;
let audioCtx = null;

function bindPress(el, handler) {
  el.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      handler();
    },
    { passive: false }
  );
  el.addEventListener("click", handler);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, dur, type) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

const MELODY = [
  523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 783.99, 1046.5,
  880.0, 783.99, 659.25, 783.99, 523.25, 587.33, 659.25, 783.99,
];
const MELODY_STEP_MS = 220;
let melodyIndex = 0;
let musicInterval = null;

function playMelodyNote(freq) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}

function startMusic() {
  if (muted || musicInterval) return;
  musicInterval = setInterval(() => {
    playMelodyNote(MELODY[melodyIndex % MELODY.length]);
    melodyIndex += 1;
  }, MELODY_STEP_MS);
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

function updateMuteIcons() {
  const icon = muted ? "🔇" : "🔊";
  muteBtn.textContent = icon;
  pauseMuteBtn.textContent = `${icon} Sound`;
}

function toggleMute() {
  muted = !muted;
  updateMuteIcons();
  if (muted) {
    stopMusic();
  } else {
    startMusic();
  }
}

function renderLives(count) {
  const lives = Math.max(count, 0);
  livesHud.innerHTML = "";
  livesHud.setAttribute("aria-label", `${lives} ${lives === 1 ? "life" : "lives"} remaining`);
  for (let i = 0; i < lives; i++) {
    const heart = document.createElement("img");
    heart.src = "icons/heart.svg";
    heart.className = "life-icon";
    heart.alt = "";
    heart.setAttribute("aria-hidden", "true");
    livesHud.appendChild(heart);
  }
}

function formatTime(sec) {
  const s = Math.max(0, sec || 0);
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}m ${r}s`;
}

function renderDifficultyCards(mode) {
  const modeConfig = MODES[mode];
  difficultySelect.innerHTML = "";
  for (const tier of ["easy", "normal", "hard"]) {
    const settings = modeConfig.difficulties[tier];
    const btn = document.createElement("button");
    btn.className = `diff-card diff-${tier}`;
    btn.dataset.difficulty = tier;

    const row = document.createElement("span");
    row.className = "diff-card-row";

    const name = document.createElement("span");
    name.className = "diff-name";
    name.textContent = tier.toUpperCase();
    row.appendChild(name);

    if (modeConfig.hasLives) {
      const hearts = document.createElement("span");
      hearts.className = "diff-hearts";
      hearts.textContent = "❤".repeat(settings.lives);
      row.appendChild(hearts);
    } else {
      const time = document.createElement("span");
      time.className = "diff-time";
      time.textContent = `${settings.timeLimitSec}s`;
      row.appendChild(time);
    }
    btn.appendChild(row);

    const desc = document.createElement("span");
    desc.className = "diff-desc";
    desc.textContent = DIFFICULTY_DESCRIPTIONS[tier];
    btn.appendChild(desc);

    bindPress(btn, () => startGame(mode, tier));
    difficultySelect.appendChild(btn);
  }
}

function showModeScreen() {
  if (game) {
    game.destroy();
    game = null;
  }
  modeScreen.classList.remove("hidden");
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
}

function showDifficultyScreen(mode) {
  const modeConfig = MODES[mode];
  difficultyModeTitle.textContent = modeConfig.label.toUpperCase();
  difficultyModeDesc.textContent = modeConfig.description;
  controlHint.textContent = CONTROL_HINTS[mode];
  renderDifficultyCards(mode);
  highScoreDisplay.textContent = `High Score: ${getHighScore(mode)}`;
  modeScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

async function runCountdown() {
  countdownOverlay.classList.remove("hidden");
  for (const label of ["3", "2", "1", "GO!"]) {
    countdownText.textContent = label;
    await wait(500);
  }
  countdownOverlay.classList.add("hidden");
}

async function startGame(mode, difficulty) {
  lastMode = mode;
  lastDifficulty = difficulty;
  ensureAudio();
  startMusic();
  if (game) {
    game.destroy();
    game = null;
  }
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseOverlay.classList.add("hidden");

  const modeConfig = MODES[mode];

  game = new Game(canvas, mode, difficulty, THEME, {
    onScoreUpdate: (score) => {
      scoreHud.textContent = String(score);
    },
    onHit: (livesLeft) => {
      renderLives(livesLeft);
      playTone(140, 0.18, "sawtooth");
    },
    onPickup: () => {
      playTone(880, 0.12, "sine");
    },
    onGameOver: (finalScore, stats) => {
      const prevBest = getHighScore(mode);
      const best = setHighScoreIfBetter(finalScore, mode);
      gameOverTitle.textContent = GAME_OVER_TITLES[mode];
      gameOverMessage.textContent =
        finalScore > prevBest && finalScore > 0 ? "New high score!" : "Nice run — go again?";
      finalScoreEl.textContent = String(finalScore);
      statBest.textContent = `Best: ${best}`;
      statTime.textContent = `Time: ${formatTime(stats.elapsed)}`;

      statStars.classList.add("hidden");
      statDodged.classList.add("hidden");
      statAccuracy.classList.add("hidden");
      if (mode === "collect") {
        statStars.textContent = `Stars: ${stats.starsCollected}`;
        statStars.classList.remove("hidden");
        statDodged.textContent = `Dodged: ${stats.dodged}`;
        statDodged.classList.remove("hidden");
      } else if (mode === "dodge") {
        statDodged.textContent = `Dodged: ${stats.dodged}`;
        statDodged.classList.remove("hidden");
      } else if (mode === "rainbow") {
        const pct = stats.elapsed > 0 ? Math.round((stats.matchedTime / stats.elapsed) * 100) : 0;
        statAccuracy.textContent = `On Target: ${pct}%`;
        statAccuracy.classList.remove("hidden");
      }

      gameOverScreen.classList.remove("hidden");
      hud.classList.add("hidden");
      touchControls.classList.add("hidden");
      playTone(finalScore > prevBest ? 660 : 220, 0.35, "square");
      if (game) {
        game.destroy();
        game = null;
      }
    },
  });

  if (modeConfig.hasLives) {
    livesHud.style.display = "";
    renderLives(game.lives);
  } else {
    livesHud.style.display = "none";
    livesHud.innerHTML = "";
  }
  scoreHud.textContent = "0";
  game.draw();

  await runCountdown();
  if (!game) return;
  hud.classList.remove("hidden");
  touchControls.classList.remove("hidden");
  game.start();
}

function setPaused(paused) {
  if (!game) return;
  if (paused) {
    game.pause();
    pauseOverlay.classList.remove("hidden");
  } else {
    game.resume();
    pauseOverlay.classList.add("hidden");
  }
}

document.querySelectorAll(".mode-card[data-mode]").forEach((btn) => {
  bindPress(btn, () => showDifficultyScreen(btn.dataset.mode));
});

bindPress(backToModesBtn, showModeScreen);
bindPress(restartBtn, () => startGame(lastMode, lastDifficulty));
bindPress(changeDifficultyBtn, showModeScreen);
bindPress(quitBtn, showModeScreen);
bindPress(pauseBtn, () => setPaused(true));
bindPress(resumeBtn, () => setPaused(false));
bindPress(muteBtn, toggleMute);
bindPress(pauseMuteBtn, toggleMute);

document.addEventListener("keydown", (e) => {
  if (!game) return;
  const key = e.key.toLowerCase();
  if (key === "arrowleft" || key === "arrowright" || key === " ") {
    e.preventDefault();
  }
  if (game.paused) {
    if (key === " " || key === "escape") setPaused(false);
    return;
  }
  if (key === "arrowleft" || key === "a") game.moveLeft();
  if (key === "arrowright" || key === "d") game.moveRight();
  if (key === " " || key === "escape") setPaused(true);
});

bindPress(document.getElementById("btn-left"), () => game && !game.paused && game.moveLeft());
bindPress(document.getElementById("btn-right"), () => game && !game.paused && game.moveRight());

let touchStartX = null;
canvas.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].clientX;
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);
canvas.addEventListener("touchend", (e) => {
  if (touchStartX === null || !game || game.paused) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 30) {
    if (dx < 0) game.moveLeft();
    else game.moveRight();
  }
  touchStartX = null;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

updateMuteIcons();
showModeScreen();
