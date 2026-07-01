import {
  CAR_SPRITE,
  CAR_COLORS,
  FOOTBALL_SPRITE,
  FOOTBALL_COLORS,
  drawSprite,
} from "./sprites.js";

const LANE_COUNT = 3;
const TRACK_MARGIN_RATIO = 0.1;
const CAR_COLS = CAR_SPRITE[0].length;
const CAR_ROWS = CAR_SPRITE.length;
const BALL_COLS = FOOTBALL_SPRITE[0].length;
const BALL_ROWS = FOOTBALL_SPRITE.length;
const TARGET_ASPECT = 9 / 16;
const MAX_WIDTH = 520;
const INVULNERABLE_SECONDS = 1;

const DIFFICULTY_SETTINGS = {
  easy: { lives: 5, spawnIntervalMs: 1400, ballSpeed: 140, speedRampPerSec: 3 },
  normal: { lives: 3, spawnIntervalMs: 1000, ballSpeed: 190, speedRampPerSec: 6 },
  hard: { lives: 2, spawnIntervalMs: 750, ballSpeed: 240, speedRampPerSec: 10 },
};

export class Game {
  constructor(canvas, difficulty, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
    this.callbacks = callbacks;

    this.carLane = 1;
    this.balls = [];
    this.particles = [];
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);

    this.lives = this.settings.lives;
    this.score = 0;
    this.ballSpeed = this.settings.ballSpeed;
    this.timeSinceSpawn = 0;
    this.roadOffset = 0;
    this.invulnerableTimer = 0;
    this.running = false;
    this.lastTimestamp = null;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;

    let width;
    let height;
    if (availableWidth / availableHeight > TARGET_ASPECT) {
      height = availableHeight;
      width = height * TARGET_ASPECT;
    } else {
      width = availableWidth;
      height = width / TARGET_ASPECT;
    }
    if (width > MAX_WIDTH) {
      width = MAX_WIDTH;
      height = width / TARGET_ASPECT;
    }

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.displayWidth = width;
    this.displayHeight = height;
    this.trackMargin = this.displayWidth * TRACK_MARGIN_RATIO;
    this.trackWidth = this.displayWidth - this.trackMargin * 2;
    this.laneWidth = this.trackWidth / LANE_COUNT;

    this.carPixelSize = (this.laneWidth * 0.55) / CAR_COLS;
    this.carWidth = this.carPixelSize * CAR_COLS;
    this.carHeight = this.carPixelSize * CAR_ROWS;

    this.ballPixelSize = (this.laneWidth * 0.4) / BALL_COLS;
    for (const ball of this.balls) {
      ball.radius = this.laneWidth * 0.18;
    }
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onResize);
  }

  start() {
    this.running = true;
    this.lastTimestamp = null;
    requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.running = false;
  }

  moveLeft() {
    if (this.carLane > 0) this.carLane -= 1;
  }

  moveRight() {
    if (this.carLane < LANE_COUNT - 1) this.carLane += 1;
  }

  laneCenterX(lane) {
    return this.trackMargin + this.laneWidth * lane + this.laneWidth / 2;
  }

  loop(timestamp) {
    if (!this.running) return;
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    if (this.running) requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    this.score += dt * 10;
    this.ballSpeed += this.settings.speedRampPerSec * dt;
    this.roadOffset += this.ballSpeed * dt;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    this.timeSinceSpawn += dt * 1000;
    if (this.timeSinceSpawn >= this.settings.spawnIntervalMs) {
      this.timeSinceSpawn = 0;
      this.spawnBall();
    }

    const carTop = this.displayHeight - this.carHeight - 20;
    for (const ball of this.balls) {
      ball.y += this.ballSpeed * dt;
      ball.spin += dt * 6;
    }

    if (this.invulnerableTimer <= 0) {
      for (const ball of this.balls) {
        if (ball.hit) continue;
        const ballBottom = ball.y + ball.radius;
        const ballTop = ball.y - ball.radius;
        const inCarLane = ball.lane === this.carLane;
        if (inCarLane && ballBottom >= carTop && ballTop <= carTop + this.carHeight) {
          ball.hit = true;
          this.lives -= 1;
          this.invulnerableTimer = INVULNERABLE_SECONDS;
          this.spawnHitParticles(this.laneCenterX(this.carLane), carTop + this.carHeight * 0.5);
          this.callbacks.onHit(this.lives);
          if (this.lives <= 0) {
            this.stop();
            this.callbacks.onGameOver(Math.floor(this.score));
            return;
          }
          break;
        }
      }
    }

    this.balls = this.balls.filter((b) => !b.hit && b.y - b.radius < this.displayHeight);
    this.updateParticles(dt);

    this.callbacks.onScoreUpdate(Math.floor(this.score));
  }

  spawnBall() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    this.balls.push({
      lane,
      y: -this.ballPixelSize * BALL_ROWS,
      radius: this.laneWidth * 0.18,
      spin: 0,
      hit: false,
    });
  }

  spawnHitParticles(cx, cy) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.5,
        maxLife: 0.5,
        color: Math.random() > 0.5 ? "#8a5a2c" : "#ffd60a",
      });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    this.drawGrass();
    this.drawTrack();

    for (const ball of this.balls) {
      const cx = this.laneCenterX(ball.lane);
      this.drawFootball(cx, ball.y);
    }

    const carX = this.laneCenterX(this.carLane);
    const carTop = this.displayHeight - this.carHeight - 20;
    const blinkOff =
      this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 12) % 2 === 0;

    this.drawCarShadow(carX, carTop);
    if (!blinkOff) this.drawCar(carX, carTop);

    this.drawParticles();
  }

  drawGrass() {
    const ctx = this.ctx;
    const blockSize = 16;
    const offset = this.roadOffset % (blockSize * 2);
    const stripes = [
      [0, this.trackMargin],
      [this.displayWidth - this.trackMargin, this.displayWidth],
    ];
    for (const [left, right] of stripes) {
      for (let y = -blockSize * 2; y < this.displayHeight + blockSize * 2; y += blockSize) {
        for (let x = left; x < right; x += blockSize) {
          const row = Math.round((y + offset) / blockSize);
          const col = Math.round(x / blockSize);
          ctx.fillStyle = (row + col) % 2 === 0 ? "#1f7a3d" : "#256b34";
          ctx.fillRect(x, y + offset, blockSize, blockSize);
        }
      }
    }
  }

  drawTrack() {
    const ctx = this.ctx;
    ctx.fillStyle = "#3a3a52";
    ctx.fillRect(this.trackMargin, 0, this.trackWidth, this.displayHeight);

    ctx.strokeStyle = "#f4f1e8";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.trackMargin, 0, this.trackWidth, this.displayHeight);

    ctx.strokeStyle = "#c9c9d8";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.lineDashOffset = -(this.roadOffset % 32);
    for (let i = 1; i < LANE_COUNT; i++) {
      const x = this.trackMargin + this.laneWidth * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.displayHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  drawFootball(cx, cy) {
    const ctx = this.ctx;
    const w = this.ballPixelSize * BALL_COLS;
    const h = this.ballPixelSize * BALL_ROWS;
    drawSprite(ctx, FOOTBALL_SPRITE, FOOTBALL_COLORS, cx - w / 2, cy - h / 2, this.ballPixelSize);
  }

  drawCarShadow(cx, top) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, top + this.carHeight + 4, this.carWidth * 0.42, this.carWidth * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCar(cx, top) {
    const ctx = this.ctx;
    const w = this.carWidth;
    drawSprite(ctx, CAR_SPRITE, CAR_COLORS, cx - w / 2, top, this.carPixelSize);
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(p.life / p.maxLife, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}
