import { Game } from "./game.js";
import { THEME } from "./theme.js";
import { getHighScore, setHighScoreIfBetter } from "./storage.js";

const canvas = document.getElementById("game-canvas");
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
const statDodged = document.getElementById("stat-dodged");
const highScoreDisplay = document.getElementById("high-score-display");
const restartBtn = document.getElementById("restart-btn");
const changeDifficultyBtn = document.getElementById("change-difficulty-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const quitBtn = document.getElementById("quit-btn");
const muteBtn = document.getElementById("mute-btn");
const pauseMuteBtn = document.getElementById("pause-mute-btn");

let game = null;
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

function updateMuteIcons() {
  const icon = muted ? "🔇" : "🔊";
  muteBtn.textContent = icon;
  pauseMuteBtn.textContent = `${icon} Sound`;
}

function toggleMute() {
  muted = !muted;
  updateMuteIcons();
}

function renderLives(count) {
  livesHud.textContent = "❤".repeat(Math.max(count, 0));
}

function formatTime(sec) {
  const s = Math.max(0, sec || 0);
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}m ${r}s`;
}

function showStartScreen() {
  if (game) {
    game.destroy();
    game = null;
  }
  startScreen.classList.remove("hidden");
  gameOverScreen.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
  highScoreDisplay.textContent = `High Score: ${getHighScore()}`;
}

async function runCountdown() {
  countdownOverlay.classList.remove("hidden");
  for (const label of ["3", "2", "1", "GO!"]) {
    countdownText.textContent = label;
    await wait(500);
  }
  countdownOverlay.classList.add("hidden");
}

async function startGame(difficulty) {
  lastDifficulty = difficulty;
  ensureAudio();
  if (game) {
    game.destroy();
    game = null;
  }
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseOverlay.classList.add("hidden");

  game = new Game(canvas, difficulty, THEME, {
    onScoreUpdate: (score) => {
      scoreHud.textContent = String(score);
    },
    onHit: (livesLeft) => {
      renderLives(livesLeft);
      playTone(140, 0.18, "sawtooth");
    },
    onGameOver: (finalScore, stats) => {
      const prevBest = getHighScore();
      const best = setHighScoreIfBetter(finalScore);
      gameOverMessage.textContent =
        finalScore > prevBest && finalScore > 0 ? "New high score!" : "Nice run — go again?";
      finalScoreEl.textContent = String(finalScore);
      statBest.textContent = `Best: ${best}`;
      statTime.textContent = `Time: ${formatTime(stats.elapsed)}`;
      statDodged.textContent = `Dodged: ${stats.dodged}`;
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

  renderLives(game.lives);
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

document.querySelectorAll(".diff-card[data-difficulty]").forEach((btn) => {
  bindPress(btn, () => startGame(btn.dataset.difficulty));
});

bindPress(restartBtn, () => startGame(lastDifficulty));
bindPress(changeDifficultyBtn, showStartScreen);
bindPress(quitBtn, showStartScreen);
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
showStartScreen();
