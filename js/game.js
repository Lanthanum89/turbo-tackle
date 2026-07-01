const LANE_COUNT = 3;

const DIFFICULTY_SETTINGS = {
  easy: { lives: 5, spawnIntervalMs: 1400, ballSpeed: 140, speedRampPerSec: 3 },
  normal: { lives: 3, spawnIntervalMs: 1000, ballSpeed: 190, speedRampPerSec: 6 },
  hard: { lives: 2, spawnIntervalMs: 750, ballSpeed: 240, speedRampPerSec: 10 },
};

export class Game {
  constructor(canvas, difficulty, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
    this.callbacks = callbacks;

    this.carLane = 1;
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.lives = this.settings.lives;
    this.score = 0;
    this.balls = [];
    this.ballSpeed = this.settings.ballSpeed;
    this.timeSinceSpawn = 0;
    this.running = false;
    this.lastTimestamp = null;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.min(window.innerWidth, 480);
    const height = window.innerHeight;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = width;
    this.displayHeight = height;
    this.laneWidth = this.displayWidth / LANE_COUNT;
    this.carWidth = this.laneWidth * 0.5;
    this.carHeight = this.carWidth * 1.4;
    for (const ball of this.balls || []) {
      ball.radius = this.laneWidth * 0.18;
    }
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

  loop(timestamp) {
    if (!this.running) return;
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    if (this.running) requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    this.score += dt * 10;
    this.ballSpeed += this.settings.speedRampPerSec * dt;

    this.timeSinceSpawn += dt * 1000;
    if (this.timeSinceSpawn >= this.settings.spawnIntervalMs) {
      this.timeSinceSpawn = 0;
      this.spawnBall();
    }

    const carTop = this.displayHeight - this.carHeight - 20;
    for (const ball of this.balls) {
      ball.y += this.ballSpeed * dt;
    }

    for (const ball of this.balls) {
      if (ball.hit) continue;
      const ballBottom = ball.y + ball.radius;
      const ballTop = ball.y - ball.radius;
      const inCarLane = ball.lane === this.carLane;
      if (inCarLane && ballBottom >= carTop && ballTop <= carTop + this.carHeight) {
        ball.hit = true;
        this.lives -= 1;
        this.callbacks.onHit(this.lives);
        if (this.lives <= 0) {
          this.stop();
          this.callbacks.onGameOver(Math.floor(this.score));
          return;
        }
      }
    }

    this.balls = this.balls.filter((b) => !b.hit && b.y - b.radius < this.displayHeight);

    this.callbacks.onScoreUpdate(Math.floor(this.score));
  }

  spawnBall() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    this.balls.push({
      lane,
      y: -20,
      radius: this.laneWidth * 0.18,
      hit: false,
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    ctx.strokeStyle = "#3a3a6e";
    ctx.lineWidth = 2;
    for (let i = 1; i < LANE_COUNT; i++) {
      const x = this.laneWidth * i;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.displayHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    for (const ball of this.balls) {
      const cx = this.laneWidth * ball.lane + this.laneWidth / 2;
      this.drawFootball(cx, ball.y, ball.radius);
    }

    const carX = this.laneWidth * this.carLane + this.laneWidth / 2;
    const carTop = this.displayHeight - this.carHeight - 20;
    this.drawCar(carX, carTop);
  }

  drawFootball(cx, cy, r) {
    const ctx = this.ctx;
    ctx.fillStyle = "#8b5a2b";
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy);
    ctx.lineTo(cx + r * 0.5, cy);
    ctx.stroke();
  }

  drawCar(cx, top) {
    const ctx = this.ctx;
    const w = this.carWidth;
    const h = this.carHeight;
    const x = cx - w / 2;

    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(x, top, w, h);

    ctx.fillStyle = "#7ee7ff";
    ctx.fillRect(x + w * 0.15, top + h * 0.1, w * 0.7, h * 0.25);

    ctx.fillStyle = "#222";
    ctx.fillRect(x - 3, top + h * 0.1, 5, h * 0.25);
    ctx.fillRect(x + w - 2, top + h * 0.1, 5, h * 0.25);
    ctx.fillRect(x - 3, top + h * 0.65, 5, h * 0.25);
    ctx.fillRect(x + w - 2, top + h * 0.65, 5, h * 0.25);
  }
}
