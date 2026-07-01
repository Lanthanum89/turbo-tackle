import { Game } from "./game.js";
import { getHighScore, setHighScoreIfBetter } from "./storage.js";

const canvas = document.getElementById("game-canvas");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const hud = document.getElementById("hud");
const touchControls = document.getElementById("touch-controls");
const scoreHud = document.getElementById("score-hud");
const livesHud = document.getElementById("lives-hud");
const finalScoreEl = document.getElementById("final-score");
const highScoreLineEl = document.getElementById("high-score-line");
const highScoreDisplay = document.getElementById("high-score-display");
const restartBtn = document.getElementById("restart-btn");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");

let game = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCountdown() {
  countdownOverlay.classList.remove("hidden");
  for (const label of ["3", "2", "1", "GO!"]) {
    countdownText.textContent = label;
    await wait(600);
  }
  countdownOverlay.classList.add("hidden");
}

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

function renderLives(count) {
  livesHud.textContent = "❤".repeat(Math.max(count, 0));
}

function showStartScreen() {
  if (game) {
    game.stop();
    game.destroy();
    game = null;
  }
  startScreen.classList.remove("hidden");
  gameOverScreen.classList.add("hidden");
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
  highScoreDisplay.textContent = `High Score: ${getHighScore()}`;
}

function triggerHitShake() {
  canvas.classList.remove("hit-shake");
  void canvas.offsetWidth; // force reflow so the animation restarts on repeat hits
  canvas.classList.add("hit-shake");
}

async function startGame(difficulty) {
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  game = new Game(canvas, difficulty, {
    onScoreUpdate: (score) => {
      scoreHud.textContent = String(score);
    },
    onHit: (livesLeft) => {
      renderLives(livesLeft);
      triggerHitShake();
    },
    onGameOver: (finalScore) => {
      const best = setHighScoreIfBetter(finalScore);
      finalScoreEl.textContent = `Score: ${finalScore}`;
      highScoreLineEl.textContent = `High Score: ${best}`;
      gameOverScreen.classList.remove("hidden");
      hud.classList.add("hidden");
      touchControls.classList.add("hidden");
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

document.querySelectorAll(".diff-btn[data-difficulty]").forEach((btn) => {
  bindPress(btn, () => startGame(btn.dataset.difficulty));
});

bindPress(restartBtn, showStartScreen);

document.addEventListener("keydown", (e) => {
  if (!game) return;
  const key = e.key.toLowerCase();
  if (key === "arrowleft" || key === "a") game.moveLeft();
  if (key === "arrowright" || key === "d") game.moveRight();
});

bindPress(document.getElementById("btn-left"), () => game && game.moveLeft());
bindPress(document.getElementById("btn-right"), () => game && game.moveRight());

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
  if (touchStartX === null || !game) return;
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

showStartScreen();
