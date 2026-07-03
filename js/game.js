import { CAR_SPRITE, STAR_SPRITE, ROCK_SPRITE, drawSprite } from "./sprites.js";

const LANE_COUNT = 3;
const TRACK_MARGIN_RATIO = 0.1;
const CAR_COLS = CAR_SPRITE[0].length;
const CAR_ROWS = CAR_SPRITE.length;
const ENTITY_COLS = ROCK_SPRITE[0].length;
const ENTITY_ROWS = ROCK_SPRITE.length;
const PORTRAIT_ASPECT = 9 / 16;
const LANDSCAPE_ASPECT = 0.8;
const MAX_WIDTH = 720;
const INVULNERABLE_SECONDS = 1.1;
const STAR_POINTS = 25;

export const MODES = {
  dodge: {
    label: "Dodge",
    description: "Just avoid the rocks",
    hasLives: true,
    passiveScorePerSec: 10,
    difficulties: {
      easy: { lives: 5, spawnIntervalMs: 1400, fallSpeed: 130, speedRampPerSec: 2.5, starChance: 0 },
      normal: { lives: 4, spawnIntervalMs: 1000, fallSpeed: 175, speedRampPerSec: 5, starChance: 0 },
      hard: { lives: 3, spawnIntervalMs: 720, fallSpeed: 225, speedRampPerSec: 9, starChance: 0 },
    },
  },
  collect: {
    label: "Collect & Avoid",
    description: "Grab stars, dodge rocks",
    hasLives: true,
    passiveScorePerSec: 2,
    difficulties: {
      easy: { lives: 5, spawnIntervalMs: 1400, fallSpeed: 130, speedRampPerSec: 2.5, starChance: 0.55 },
      normal: { lives: 4, spawnIntervalMs: 1000, fallSpeed: 175, speedRampPerSec: 5, starChance: 0.45 },
      hard: { lives: 3, spawnIntervalMs: 720, fallSpeed: 225, speedRampPerSec: 9, starChance: 0.35 },
    },
  },
  rainbow: {
    label: "Rainbow Rocket",
    description: "Follow the rainbow lane",
    hasLives: false,
    difficulties: {
      easy: { timeLimitSec: 30, switchIntervalMs: 2200, matchScorePerSec: 12, missScorePerSec: 2, scrollSpeed: 120 },
      normal: { timeLimitSec: 45, switchIntervalMs: 1600, matchScorePerSec: 15, missScorePerSec: 2, scrollSpeed: 160 },
      hard: { timeLimitSec: 60, switchIntervalMs: 1100, matchScorePerSec: 18, missScorePerSec: 1, scrollSpeed: 200 },
    },
  },
};

export class Game {
  constructor(canvas, mode, difficulty, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.mode = MODES[mode] ? mode : "dodge";
    this.modeConfig = MODES[this.mode];
    this.settings =
      this.modeConfig.difficulties[difficulty] || this.modeConfig.difficulties.normal;
    this.theme = theme;
    this.callbacks = callbacks || {};

    this.carLane = 1;
    this.entities = [];
    this.particles = [];
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);

    this.lives = this.modeConfig.hasLives ? this.settings.lives : null;
    this.score = 0;
    this.dodged = 0;
    this.starsCollected = 0;
    this.elapsed = 0;
    this.matchedTime = 0;
    this.fallSpeed = this.settings.fallSpeed || 0;
    this.timeSinceSpawn = 0;
    this.roadOffset = 0;
    this.invulnerableTimer = 0;
    this.running = false;
    this.paused = false;
    this.lastTimestamp = null;
    this._raf = null;

    this.rainbowLane = Math.floor(Math.random() * LANE_COUNT);
    this.timeSinceSwitch = 0;
    this.sparkleTimer = 0;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement;
    const containerStyle = getComputedStyle(container);
    const availableWidth =
      container.clientWidth -
      parseFloat(containerStyle.paddingLeft) -
      parseFloat(containerStyle.paddingRight);
    const availableHeight =
      container.clientHeight -
      parseFloat(containerStyle.paddingTop) -
      parseFloat(containerStyle.paddingBottom);

    const targetAspect = availableWidth > availableHeight ? LANDSCAPE_ASPECT : PORTRAIT_ASPECT;

    let width;
    let height;
    if (availableWidth / availableHeight > targetAspect) {
      height = availableHeight;
      width = height * targetAspect;
    } else {
      width = availableWidth;
      height = width / targetAspect;
    }
    if (width > MAX_WIDTH) {
      width = MAX_WIDTH;
      height = width / targetAspect;
    }

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    container.style.setProperty("--game-width", `${width}px`);
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

    this.entityPixelSize = (this.laneWidth * 0.4) / ENTITY_COLS;
    this.carBottomMargin = Math.max(48, this.displayHeight * 0.09);
    for (const entity of this.entities) {
      entity.radius = this.laneWidth * 0.18;
    }
  }

  carTopY() {
    return this.displayHeight - this.carHeight - this.carBottomMargin;
  }

  destroy() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onResize);
  }

  start() {
    this.running = true;
    this.paused = false;
    this.lastTimestamp = null;
    this._raf = requestAnimationFrame((ts) => this.loop(ts));
  }

  pause() {
    this.paused = true;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTimestamp = null;
    this._raf = requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
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
    if (!this.running || this.paused) return;
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.update(dt);
    this.draw();
    this._raf = requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    if (this.mode === "rainbow") {
      this.updateRainbow(dt);
    } else {
      this.updateDodgeCollect(dt);
    }
  }

  updateDodgeCollect(dt) {
    this.score += dt * this.modeConfig.passiveScorePerSec;
    this.elapsed += dt;
    this.fallSpeed += this.settings.speedRampPerSec * dt;
    this.roadOffset += this.fallSpeed * dt;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    this.timeSinceSpawn += dt * 1000;
    if (this.timeSinceSpawn >= this.settings.spawnIntervalMs) {
      this.timeSinceSpawn = 0;
      this.spawnEntity();
    }

    const carTop = this.carTopY();
    for (const entity of this.entities) {
      entity.y += this.fallSpeed * dt;
    }

    for (const entity of this.entities) {
      if (entity.hit) continue;
      const bottom = entity.y + entity.radius;
      const top = entity.y - entity.radius;
      if (entity.lane !== this.carLane || bottom < carTop || top > carTop + this.carHeight) {
        continue;
      }

      if (entity.type === "star") {
        entity.hit = true;
        this.score += STAR_POINTS;
        this.starsCollected += 1;
        this.spawnPickupParticles(this.laneCenterX(this.carLane), carTop + this.carHeight * 0.5);
        this.callbacks.onPickup && this.callbacks.onPickup(this.starsCollected);
        continue;
      }

      if (this.invulnerableTimer > 0) continue;
      entity.hit = true;
      this.lives -= 1;
      this.invulnerableTimer = INVULNERABLE_SECONDS;
      this.spawnHitParticles(this.laneCenterX(this.carLane), carTop + this.carHeight * 0.5);
      this.callbacks.onHit && this.callbacks.onHit(this.lives);
      if (this.lives <= 0) {
        this.stop();
        this.callbacks.onGameOver &&
          this.callbacks.onGameOver(Math.floor(this.score), {
            mode: this.mode,
            starsCollected: this.starsCollected,
            dodged: this.dodged,
            elapsed: this.elapsed,
          });
        return;
      }
      break;
    }

    this.entities = this.entities.filter((e) => {
      if (e.hit) return false;
      const onScreen = e.y - e.radius < this.displayHeight;
      if (!onScreen && e.type === "rock") this.dodged += 1;
      return onScreen;
    });
    this.updateParticles(dt);

    this.callbacks.onScoreUpdate && this.callbacks.onScoreUpdate(Math.floor(this.score));
  }

  updateRainbow(dt) {
    this.elapsed += dt;
    this.roadOffset += this.settings.scrollSpeed * dt;

    this.timeSinceSwitch += dt * 1000;
    if (this.timeSinceSwitch >= this.settings.switchIntervalMs) {
      this.timeSinceSwitch %= this.settings.switchIntervalMs;
      let newLane;
      do {
        newLane = Math.floor(Math.random() * LANE_COUNT);
      } while (newLane === this.rainbowLane);
      this.rainbowLane = newLane;
    }

    const matched = this.carLane === this.rainbowLane;
    this.score += dt * (matched ? this.settings.matchScorePerSec : this.settings.missScorePerSec);

    if (matched) {
      this.matchedTime += dt;
      this.sparkleTimer += dt;
      if (this.sparkleTimer > 0.15) {
        this.sparkleTimer = 0;
        this.spawnPickupParticles(
          this.laneCenterX(this.carLane),
          this.carTopY() + this.carHeight * 0.5
        );
      }
    }

    this.updateParticles(dt);
    this.callbacks.onScoreUpdate && this.callbacks.onScoreUpdate(Math.floor(this.score));

    if (this.elapsed >= this.settings.timeLimitSec) {
      this.stop();
      this.callbacks.onGameOver &&
        this.callbacks.onGameOver(Math.floor(this.score), {
          mode: this.mode,
          elapsed: this.elapsed,
          matchedTime: this.matchedTime,
        });
    }
  }

  spawnEntity() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const type = Math.random() < (this.settings.starChance || 0) ? "star" : "rock";
    this.entities.push({
      lane,
      type,
      y: -this.entityPixelSize * ENTITY_ROWS,
      radius: this.laneWidth * 0.18,
      hit: false,
    });
  }

  spawnHitParticles(cx, cy) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 130;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.5,
        maxLife: 0.5,
        color: Math.random() > 0.5 ? "#8a5a2c" : this.theme.sparkColor,
      });
    }
  }

  spawnPickupParticles(cx, cy) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 70,
        life: 0.4,
        maxLife: 0.4,
        color: this.theme.sparkColor,
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

    if (this.mode === "rainbow") {
      this.drawRainbowLane();
    } else {
      for (const entity of this.entities) {
        const cx = this.laneCenterX(entity.lane);
        if (entity.type === "star") this.drawStar(cx, entity.y);
        else this.drawRock(cx, entity.y);
      }
    }

    const carX = this.laneCenterX(this.carLane);
    const carTop = this.carTopY();
    const blinkOff =
      this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 12) % 2 === 0;

    this.drawCarShadow(carX, carTop);
    if (!blinkOff) this.drawCar(carX, carTop);

    this.drawParticles();

    if (this.invulnerableTimer > 0) {
      const t = this.invulnerableTimer / INVULNERABLE_SECONDS;
      ctx.fillStyle = `rgba(255, 60, 60, ${0.16 * t})`;
      ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    }
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
          const row = Math.floor((y + offset) / blockSize);
          const col = Math.floor(x / blockSize);
          ctx.fillStyle = (row + col) % 2 === 0 ? this.theme.grassA : this.theme.grassB;
          ctx.fillRect(x, Math.floor(y + offset), blockSize, blockSize);
        }
      }
    }
  }

  drawTrack() {
    const ctx = this.ctx;
    ctx.fillStyle = this.theme.track;
    ctx.fillRect(this.trackMargin, 0, this.trackWidth, this.displayHeight);

    ctx.strokeStyle = this.theme.edge;
    ctx.lineWidth = 3;
    ctx.strokeRect(this.trackMargin, 0, this.trackWidth, this.displayHeight);

    ctx.strokeStyle = this.theme.laneLine;
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

  drawRainbowLane() {
    const ctx = this.ctx;
    const x = this.trackMargin + this.laneWidth * this.rainbowLane;
    const bands = this.theme.rainbowBands;
    const bandHeight = 28;
    const cycle = bandHeight * bands.length;
    const offset = this.roadOffset % cycle;

    ctx.save();
    ctx.globalAlpha = 0.6;
    for (let y = -cycle; y < this.displayHeight + cycle; y += bandHeight) {
      const shifted = y + offset;
      const bandIndex =
        (((Math.floor(shifted / bandHeight)) % bands.length) + bands.length) % bands.length;
      ctx.fillStyle = bands[bandIndex];
      ctx.fillRect(x, Math.floor(shifted), this.laneWidth, bandHeight);
    }
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, this.laneWidth, this.displayHeight);
  }

  drawStar(cx, cy) {
    const ctx = this.ctx;
    const w = this.entityPixelSize * ENTITY_COLS;
    const h = this.entityPixelSize * ENTITY_ROWS;
    drawSprite(ctx, STAR_SPRITE, this.theme.starColors, cx - w / 2, cy - h / 2, this.entityPixelSize);
  }

  drawRock(cx, cy) {
    const ctx = this.ctx;
    const w = this.entityPixelSize * ENTITY_COLS;
    const h = this.entityPixelSize * ENTITY_ROWS;
    drawSprite(ctx, ROCK_SPRITE, this.theme.rockColors, cx - w / 2, cy - h / 2, this.entityPixelSize);
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
    drawSprite(ctx, CAR_SPRITE, this.theme.carColors, cx - w / 2, top, this.carPixelSize);
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
