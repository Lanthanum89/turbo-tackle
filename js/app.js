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

let game = null;

function renderLives(count) {
  livesHud.textContent = "❤".repeat(Math.max(count, 0));
}

function showStartScreen() {
  startScreen.classList.remove("hidden");
  gameOverScreen.classList.add("hidden");
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
  highScoreDisplay.textContent = `High Score: ${getHighScore()}`;
}

function startGame(difficulty) {
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  touchControls.classList.remove("hidden");

  game = new Game(canvas, difficulty, {
    onScoreUpdate: (score) => {
      scoreHud.textContent = String(score);
    },
    onHit: (livesLeft) => {
      renderLives(livesLeft);
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
  game.start();
}

document.querySelectorAll(".diff-btn[data-difficulty]").forEach((btn) => {
  btn.addEventListener("click", () => startGame(btn.dataset.difficulty));
});

restartBtn.addEventListener("click", showStartScreen);

document.addEventListener("keydown", (e) => {
  if (!game) return;
  if (e.key === "ArrowLeft" || e.key === "a") game.moveLeft();
  if (e.key === "ArrowRight" || e.key === "d") game.moveRight();
});

document.getElementById("btn-left").addEventListener("click", () => game && game.moveLeft());
document.getElementById("btn-right").addEventListener("click", () => game && game.moveRight());

let touchStartX = null;
canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
});
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
