/**
 * CYBER VIPER 2088 — Core Game Engine
 * Grid physics, sub-tick interpolation, power-ups, portals, and renderer.
 */

class CyberSnakeGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Logical dimensions
    this.width = 800;
    this.height = 600;
    this.tileSize = 25;
    this.cols = this.width / this.tileSize; // 32
    this.rows = this.height / this.tileSize; // 24

    // Game state
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.mode = 'classic'; // 'classic' | 'hazard' | 'timetrial' | 'zen'

    // Snake logic
    this.snake = [];
    this.prevSnake = []; // For 60fps render interpolation
    this.direction = { x: 1, y: 0 };
    this.inputQueue = [];

    // Food & Pickups
    this.food = null;
    this.quantumCore = null; // Golden bonus item
    this.activePowerUp = null; // Active buff on snake
    this.powerUpItem = null; // Power-up crystal on grid

    // Portals (Hazard Mode)
    this.portalA = null; // Cyan Portal
    this.portalB = null; // Magenta Portal
    this.portalCooldown = 0;

    // Obstacles (Hazard Mode)
    this.obstacles = [];

    // Scoring & Multipliers
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('cyberviper_highscore') || '0', 10);
    this.combo = 1;
    this.comboTimer = 0;
    this.maxComboTime = 3000; // 3 seconds to keep combo alive
    this.totalFoodEaten = 0;
    this.timeRemaining = 60; // For timetrial mode

    // Tick & Game Timing
    this.baseSpeedMs = 110;
    this.currentSpeedMs = 110;
    this.lastTickTime = 0;
    this.tickProgress = 0; // 0 to 1 for render interpolation
    this.lastFrameTime = 0;
    this.animFrameId = null;

    // Settings
    this.settings = {
      wallWrap: false,
      gridLines: true,
      crtScanlines: true,
      bloomEffects: true,
      difficulty: 'normal' // 'normal', 'fast', 'insane'
    };

    this.loadSettings();
    this.initCanvasDPI();
    window.particleEngine.initAmbient(this.width, this.height);

    // Bind loop
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('cyberviper_settings');
      if (saved) {
        this.settings = Object.assign(this.settings, JSON.parse(saved));
      }
    } catch (e) {}
  }

  saveSettings() {
    try {
      localStorage.setItem('cyberviper_settings', JSON.stringify(this.settings));
    } catch (e) {}
  }

  initCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setMode(mode) {
    this.mode = mode;
    if (this.mode === 'zen') {
      this.settings.wallWrap = true;
    }
  }

  startNewGame() {
    this.snake = [
      { x: 10, y: 12 },
      { x: 9, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 12 }
    ];
    this.prevSnake = JSON.parse(JSON.stringify(this.snake));
    this.direction = { x: 1, y: 0 };
    this.inputQueue = [];

    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.totalFoodEaten = 0;
    this.timeRemaining = 60;
    this.activePowerUp = null;
    this.powerUpItem = null;
    this.quantumCore = null;
    this.portalCooldown = 0;

    // Speed based on difficulty
    if (this.settings.difficulty === 'insane') this.baseSpeedMs = 70;
    else if (this.settings.difficulty === 'fast') this.baseSpeedMs = 90;
    else this.baseSpeedMs = 115;
    this.currentSpeedMs = this.baseSpeedMs;

    // Hazard elements
    this.obstacles = [];
    this.portalA = null;
    this.portalB = null;

    if (this.mode === 'hazard') {
      this.initPortalsAndHazards();
    }

    this.spawnFood();
    window.particleEngine.clear();

    this.state = 'PLAYING';
    this.lastTickTime = performance.now();
    this.lastFrameTime = performance.now();

    if (window.cyberUI) {
      window.cyberUI.onGameStart();
    }
  }

  initPortalsAndHazards() {
    // Generate two coupled portals in safe positions
    this.portalA = { x: 4, y: 4, color: '#00f0ff' };
    this.portalB = { x: this.cols - 5, y: this.rows - 5, color: '#ff007f' };

    // Procedural laser barriers
    this.obstacles = [
      { x: 16, y: 6, w: 1, h: 4 },
      { x: 16, y: 14, w: 1, h: 4 },
      { x: 8, y: 10, w: 4, h: 1 },
      { x: 20, y: 10, w: 4, h: 1 }
    ];
  }

  spawnFood() {
    let valid = false;
    let attempts = 0;
    let pos = { x: 0, y: 0 };

    while (!valid && attempts < 200) {
      attempts++;
      pos = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows)
      };

      // Check collision with snake
      const onSnake = this.snake.some(s => s.x === pos.x && s.y === pos.y);
      if (onSnake) continue;

      // Check collision with obstacles
      const onObstacle = this.obstacles.some(o => 
        pos.x >= o.x && pos.x < o.x + o.w && pos.y >= o.y && pos.y < o.y + o.h
      );
      if (onObstacle) continue;

      // Check collision with portals
      if (this.portalA && (this.portalA.x === pos.x && this.portalA.y === pos.y)) continue;
      if (this.portalB && (this.portalB.x === pos.x && this.portalB.y === pos.y)) continue;

      valid = true;
    }

    this.food = {
      x: pos.x,
      y: pos.y,
      pulse: 0,
      color: '#00f0ff'
    };
  }

  spawnQuantumCore() {
    if (this.quantumCore) return;
    let pos = {
      x: Math.floor(Math.random() * (this.cols - 2)) + 1,
      y: Math.floor(Math.random() * (this.rows - 2)) + 1
    };
    this.quantumCore = {
      x: pos.x,
      y: pos.y,
      lifeMs: 9000,
      totalLife: 9000,
      color: '#ffe600'
    };
  }

  spawnPowerUp() {
    if (this.powerUpItem) return;
    const types = ['GHOST', 'TURBO', 'FREEZE', 'MAGNET'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    let pos = {
      x: Math.floor(Math.random() * (this.cols - 2)) + 1,
      y: Math.floor(Math.random() * (this.rows - 2)) + 1
    };

    let color = '#a855f7';
    if (selectedType === 'TURBO') color = '#ffe600';
    if (selectedType === 'FREEZE') color = '#00f0ff';
    if (selectedType === 'MAGNET') color = '#00ff66';

    this.powerUpItem = {
      x: pos.x,
      y: pos.y,
      type: selectedType,
      color,
      lifeMs: 8000,
      totalLife: 8000
    };
  }

  queueDirection(dx, dy) {
    if (this.state !== 'PLAYING') return;

    // Determine target vector from the last queued move or current direction
    const lastDir = this.inputQueue.length > 0 
      ? this.inputQueue[this.inputQueue.length - 1] 
      : this.direction;

    // Disallow 180-degree instant reversal
    if (lastDir.x + dx === 0 && lastDir.y + dy === 0) return;
    if (lastDir.x === dx && lastDir.y === dy) return;

    // Keep buffer tight (max 2 queued turns)
    if (this.inputQueue.length < 2) {
      this.inputQueue.push({ x: dx, y: dy });
      window.cyberAudio.playMove();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (window.cyberUI) window.cyberUI.showPauseOverlay(true);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTickTime = performance.now();
      if (window.cyberUI) window.cyberUI.showPauseOverlay(false);
    }
  }

  // Master game tick (runs at variable ms based on snake speed & buffs)
  tick() {
    if (this.state !== 'PLAYING') return;

    // Consume queued direction
    if (this.inputQueue.length > 0) {
      this.direction = this.inputQueue.shift();
    }

    // Cache previous state for render interpolation
    this.prevSnake = JSON.parse(JSON.stringify(this.snake));

    const head = { ...this.snake[0] };
    let nextX = head.x + this.direction.x;
    let nextY = head.y + this.direction.y;

    // Check Wall Wrapping / Lethal Wall
    if (this.settings.wallWrap || this.mode === 'zen' || (this.activePowerUp && this.activePowerUp.type === 'GHOST')) {
      if (nextX < 0) nextX = this.cols - 1;
      if (nextX >= this.cols) nextX = 0;
      if (nextY < 0) nextY = this.rows - 1;
      if (nextY >= this.rows) nextY = 0;
    } else {
      if (nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
        this.gameOver('WALL_CRASH');
        return;
      }
    }

    // Check Warp Portals
    if (this.mode === 'hazard' && this.portalA && this.portalB) {
      if (this.portalCooldown <= 0) {
        if (nextX === this.portalA.x && nextY === this.portalA.y) {
          nextX = this.portalB.x + this.direction.x;
          nextY = this.portalB.y + this.direction.y;
          this.portalCooldown = 4;
          window.cyberAudio.playPortal();
          window.particleEngine.spawnFoodSparks(
            (this.portalB.x + 0.5) * this.tileSize,
            (this.portalB.y + 0.5) * this.tileSize,
            '#ff007f', 24
          );
        } else if (nextX === this.portalB.x && nextY === this.portalB.y) {
          nextX = this.portalA.x + this.direction.x;
          nextY = this.portalA.y + this.direction.y;
          this.portalCooldown = 4;
          window.cyberAudio.playPortal();
          window.particleEngine.spawnFoodSparks(
            (this.portalA.x + 0.5) * this.tileSize,
            (this.portalA.y + 0.5) * this.tileSize,
            '#00f0ff', 24
          );
        }
      } else {
        this.portalCooldown--;
      }
    }

    // Check Laser Obstacle collision (Hazard Mode)
    if (this.mode === 'hazard' && !(this.activePowerUp && this.activePowerUp.type === 'GHOST')) {
      const hitObstacle = this.obstacles.some(o =>
        nextX >= o.x && nextX < o.x + o.w && nextY >= o.y && nextY < o.y + o.h
      );
      if (hitObstacle) {
        this.gameOver('LASER_CRASH');
        return;
      }
    }

    // Check Self-collision (Ghost buff bypasses self-collision)
    if (this.mode !== 'zen' && !(this.activePowerUp && this.activePowerUp.type === 'GHOST')) {
      for (let i = 0; i < this.snake.length - 1; i++) {
        if (this.snake[i].x === nextX && this.snake[i].y === nextY) {
          this.gameOver('SELF_COLLISION');
          return;
        }
      }
    }

    // Move Snake Head
    const newHead = { x: nextX, y: nextY };
    this.snake.unshift(newHead);

    // Magnet buff check
    if (this.activePowerUp && this.activePowerUp.type === 'MAGNET' && this.food) {
      const dist = Math.hypot(this.food.x - nextX, this.food.y - nextY);
      if (dist < 4 && dist > 1) {
        const stepX = Math.sign(nextX - this.food.x);
        const stepY = Math.sign(nextY - this.food.y);
        this.food.x += stepX;
        this.food.y += stepY;
      }
    }

    // Check Food Collision
    let ateFood = false;
    if (this.food && nextX === this.food.x && nextY === this.food.y) {
      ateFood = true;
      this.totalFoodEaten++;
      const pts = 10 * this.combo * (this.activePowerUp && this.activePowerUp.type === 'TURBO' ? 2 : 1);
      this.score += pts;

      // Combo boost
      this.combo = Math.min(this.combo + 1, 5);
      this.comboTimer = this.maxComboTime;

      // Audio & Particle FX
      window.cyberAudio.playEat(this.combo);
      window.particleEngine.spawnFoodSparks(
        (nextX + 0.5) * this.tileSize,
        (nextY + 0.5) * this.tileSize,
        '#00f0ff', 20
      );
      window.particleEngine.addScreenShake(3);

      // Increase speed slightly with food count
      if (this.currentSpeedMs > 55) {
        this.currentSpeedMs = Math.max(55, this.baseSpeedMs - Math.floor(this.totalFoodEaten / 3) * 3);
      }

      // Spawning chances for golden Quantum Core or Power-Up crystal
      if (this.totalFoodEaten % 5 === 0) {
        this.spawnQuantumCore();
      }
      if (this.totalFoodEaten % 7 === 0) {
        this.spawnPowerUp();
      }

      this.spawnFood();
    }

    // Check Quantum Core collision
    if (this.quantumCore && nextX === this.quantumCore.x && nextY === this.quantumCore.y) {
      this.score += 50 * this.combo;
      window.cyberAudio.playPowerUp();
      window.particleEngine.spawnFoodSparks(
        (nextX + 0.5) * this.tileSize,
        (nextY + 0.5) * this.tileSize,
        '#ffe600', 32
      );
      this.quantumCore = null;
    }

    // Check Power-Up crystal collision
    if (this.powerUpItem && nextX === this.powerUpItem.x && nextY === this.powerUpItem.y) {
      this.activatePowerUp(this.powerUpItem.type);
      window.cyberAudio.playPowerUp();
      window.particleEngine.spawnFoodSparks(
        (nextX + 0.5) * this.tileSize,
        (nextY + 0.5) * this.tileSize,
        this.powerUpItem.color, 30
      );
      this.powerUpItem = null;
    }

    // If no food eaten, pop tail segment
    if (!ateFood) {
      this.snake.pop();
    }

    // Spawn subtle movement trail particle
    window.particleEngine.spawnSnakeTrail(
      (newHead.x + 0.5) * this.tileSize,
      (newHead.y + 0.5) * this.tileSize,
      this.activePowerUp ? this.activePowerUp.color : 'rgba(0, 240, 255, 0.4)'
    );

    // Update UI HUD
    if (window.cyberUI) {
      window.cyberUI.updateHUD(this.score, this.highScore, this.combo, this.comboTimer / this.maxComboTime);
    }
  }

  activatePowerUp(type) {
    let durationMs = 6000;
    let color = '#a855f7';
    let name = 'PHASE SHIFT';

    if (type === 'TURBO') {
      color = '#ffe600';
      name = 'TURBO SURGE';
      durationMs = 5000;
    } else if (type === 'FREEZE') {
      color = '#00f0ff';
      name = 'CRYO SLOW';
      durationMs = 6500;
    } else if (type === 'MAGNET') {
      color = '#00ff66';
      name = 'EMP MAGNET';
      durationMs = 7000;
    }

    this.activePowerUp = {
      type,
      color,
      name,
      remainingMs: durationMs,
      totalMs: durationMs
    };

    if (window.cyberUI) {
      window.cyberUI.showBuff(this.activePowerUp);
    }
  }

  gameOver(reason) {
    this.state = 'GAMEOVER';
    window.cyberAudio.playDeath();

    // Spawn death shards from snake segments
    const pixelSegments = this.snake.map(s => ({
      x: (s.x + 0.5) * this.tileSize,
      y: (s.y + 0.5) * this.tileSize
    }));
    window.particleEngine.spawnDeathShatter(pixelSegments, '#ff007f');

    // Update High Score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('cyberviper_highscore', this.highScore.toString());
    }

    // Save to High Scores History
    this.saveScoreHistory();

    if (window.cyberUI) {
      window.cyberUI.onGameOver(this.score, this.highScore, this.totalFoodEaten, reason);
    }
  }

  saveScoreHistory() {
    try {
      let scores = JSON.parse(localStorage.getItem('cyberviper_scores') || '[]');
      scores.push({
        score: this.score,
        mode: this.mode,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 5); // Keep top 5
      localStorage.setItem('cyberviper_scores', JSON.stringify(scores));
    } catch (e) {}
  }

  // --- Main Animation Loop (60-120fps) ---
  loop(timestamp) {
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Time Trial countdown
    if (this.state === 'PLAYING' && this.mode === 'timetrial') {
      this.timeRemaining -= delta / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.gameOver('TIME_EXPIRED');
        return;
      }
    }

    // Active Buff Timer
    if (this.activePowerUp) {
      this.activePowerUp.remainingMs -= delta;
      if (this.activePowerUp.remainingMs <= 0) {
        this.activePowerUp = null;
        if (window.cyberUI) window.cyberUI.hideBuff();
      }
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.combo = 1;
      }
    }

    // Quantum Core Lifetime decay
    if (this.quantumCore) {
      this.quantumCore.lifeMs -= delta;
      if (this.quantumCore.lifeMs <= 0) {
        this.quantumCore = null;
      }
    }

    // Power Up Item Lifetime decay
    if (this.powerUpItem) {
      this.powerUpItem.lifeMs -= delta;
      if (this.powerUpItem.lifeMs <= 0) {
        this.powerUpItem = null;
      }
    }

    // Calculate actual tick speed considering buffs
    let effectiveSpeed = this.currentSpeedMs;
    if (this.activePowerUp) {
      if (this.activePowerUp.type === 'TURBO') effectiveSpeed *= 0.65; // Faster!
      if (this.activePowerUp.type === 'FREEZE') effectiveSpeed *= 1.6; // Slower!
    }

    // Trigger game ticks
    if (this.state === 'PLAYING') {
      const elapsed = timestamp - this.lastTickTime;
      this.tickProgress = Math.min(1, elapsed / effectiveSpeed);

      if (elapsed >= effectiveSpeed) {
        this.tick();
        this.lastTickTime = timestamp;
        this.tickProgress = 0;
      }
    } else {
      this.tickProgress = 1;
    }

    // Update Particle Engine
    window.particleEngine.update(this.width, this.height);

    // Render Canvas Frame
    this.render();
  }

  // --- Rendering Pipeline ---
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const ts = this.tileSize;

    // Apply Camera Shake offset
    const shake = window.particleEngine.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Clear Frame
    ctx.fillStyle = '#04060e';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Ambient Space Dust
    window.particleEngine.drawAmbient(ctx);

    // 3. Draw Cyberpunk Grid
    if (this.settings.gridLines) {
      this.drawCyberGrid(ctx, w, h, ts);
    }

    // 4. Draw Obstacles (Hazard Mode)
    if (this.mode === 'hazard' && this.obstacles.length > 0) {
      this.drawObstacles(ctx, ts);
    }

    // 5. Draw Portals (Hazard Mode)
    if (this.mode === 'hazard' && this.portalA && this.portalB) {
      this.drawPortal(ctx, this.portalA, '#00f0ff');
      this.drawPortal(ctx, this.portalB, '#ff007f');
    }

    // 6. Draw Collectibles
    this.drawCollectibles(ctx, ts);

    // 7. Draw Snake (Interpolated for 60fps silky motion)
    this.drawSnake(ctx, ts);

    // 8. Draw Particle FX & Shockwaves
    window.particleEngine.draw(ctx);

    ctx.restore();
  }

  drawCyberGrid(ctx, w, h, ts) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += ts) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += ts) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawObstacles(ctx, ts) {
    ctx.save();
    const time = performance.now() * 0.003;
    const glowAlpha = 0.6 + 0.3 * Math.sin(time);

    this.obstacles.forEach(o => {
      const rx = o.x * ts;
      const ry = o.y * ts;
      const rw = o.w * ts;
      const rh = o.h * ts;

      // Laser bar core
      ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
      ctx.fillRect(rx, ry, rw, rh);

      // Glowing border
      ctx.strokeStyle = `rgba(255, 0, 100, ${glowAlpha})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff0055';
      ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);

      // Warning hazard stripes inside
      ctx.fillStyle = '#ff0055';
      const centerDotX = rx + rw / 2;
      const centerDotY = ry + rh / 2;
      ctx.beginPath();
      ctx.arc(centerDotX, centerDotY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawPortal(ctx, portal, color) {
    ctx.save();
    const px = (portal.x + 0.5) * this.tileSize;
    const py = (portal.y + 0.5) * this.tileSize;
    const time = performance.now() * 0.004;

    // Swirling vortex rings
    ctx.translate(px, py);
    ctx.rotate(time);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;

    // Ellipse portal ring
    ctx.beginPath();
    ctx.ellipse(0, 0, this.tileSize * 0.55, this.tileSize * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Core glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCollectibles(ctx, ts) {
    const time = performance.now() * 0.005;

    // Standard Food (Neon Cyan Data Crystal)
    if (this.food) {
      const fx = (this.food.x + 0.5) * ts;
      const fy = (this.food.y + 0.5) * ts;
      const pulse = 1 + 0.15 * Math.sin(time * 2);
      const size = (ts * 0.35) * pulse;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(time);

      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';

      // Diamond Crystal Shape
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();

      // Inner white core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Quantum Core (Golden Bonus Orb with Countdown Ring)
    if (this.quantumCore) {
      const qx = (this.quantumCore.x + 0.5) * ts;
      const qy = (this.quantumCore.y + 0.5) * ts;
      const progress = this.quantumCore.lifeMs / this.quantumCore.totalLife;

      ctx.save();
      ctx.translate(qx, qy);

      // Countdown Ring
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffe600';
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();

      // Spinning Star Core
      ctx.rotate(-time * 1.5);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-ts * 0.25, -ts * 0.25, ts * 0.5, ts * 0.5);

      ctx.fillStyle = '#fff';
      ctx.fillRect(-ts * 0.12, -ts * 0.12, ts * 0.24, ts * 0.24);

      ctx.restore();
    }

    // Power-Up Crystal
    if (this.powerUpItem) {
      const pux = (this.powerUpItem.x + 0.5) * ts;
      const puy = (this.powerUpItem.y + 0.5) * ts;
      const progress = this.powerUpItem.lifeMs / this.powerUpItem.totalLife;

      ctx.save();
      ctx.translate(pux, puy);

      // Countdown Ring
      ctx.strokeStyle = this.powerUpItem.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.powerUpItem.color;
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();

      // Hexagon / Orb
      ctx.fillStyle = this.powerUpItem.color;
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawSnake(ctx, ts) {
    if (this.snake.length === 0) return;

    ctx.save();
    const isGhost = this.activePowerUp && this.activePowerUp.type === 'GHOST';
    const isTurbo = this.activePowerUp && this.activePowerUp.type === 'TURBO';

    if (isGhost) {
      ctx.globalAlpha = 0.55;
    }

    // Precalculate interpolated positions for smooth 60fps movement
    const interpSnake = [];
    const t = Math.min(1, Math.max(0, this.tickProgress));

    for (let i = 0; i < this.snake.length; i++) {
      const cur = this.snake[i];
      const prev = this.prevSnake[i] || cur;

      // Handle wrapping distance jump to prevent interpolation sliding across the entire screen
      let dx = cur.x - prev.x;
      let dy = cur.y - prev.y;
      if (Math.abs(dx) > 1) dx = 0; // Wrapped around edge
      if (Math.abs(dy) > 1) dy = 0;

      const px = (prev.x + dx * t + 0.5) * ts;
      const py = (prev.y + dy * t + 0.5) * ts;
      interpSnake.push({ x: px, y: py });
    }

    // 1. Draw glowing neon spine line connecting segments
    ctx.beginPath();
    ctx.moveTo(interpSnake[0].x, interpSnake[0].y);
    for (let i = 1; i < interpSnake.length; i++) {
      ctx.lineTo(interpSnake[i].x, interpSnake[i].y);
    }
    ctx.strokeStyle = isGhost ? '#a855f7' : (isTurbo ? '#ffe600' : 'rgba(0, 240, 255, 0.45)');
    ctx.lineWidth = ts * 0.55;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = isTurbo ? 22 : 12;
    ctx.shadowColor = isGhost ? '#a855f7' : (isTurbo ? '#ffe600' : '#00f0ff');
    ctx.stroke();

    // 2. Draw segmented body plates
    for (let i = interpSnake.length - 1; i >= 1; i--) {
      const pt = interpSnake[i];
      // Size tapers gracefully toward the tail
      const taper = Math.max(0.45, 1 - (i / interpSnake.length) * 0.45);
      const radius = (ts * 0.4) * taper;

      // Segment color gradient from cyan to magenta
      const ratio = i / interpSnake.length;
      let segColor = '#00f0ff';
      if (isGhost) segColor = '#c084fc';
      else if (isTurbo) segColor = '#fde047';
      else {
        // Linear mix cyan (#00f0ff) and magenta (#ff007f)
        segColor = ratio > 0.5 ? '#ff007f' : '#00f0ff';
      }

      ctx.fillStyle = segColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner glowing core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Cyber Viper Head
    const head = interpSnake[0];
    const headAngle = Math.atan2(this.direction.y, this.direction.x);

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(headAngle);

    // Head Armor Plate (Apex Arrow Shape)
    ctx.fillStyle = isGhost ? '#9333ea' : (isTurbo ? '#eab308' : '#00f0ff');
    ctx.shadowBlur = 18;
    ctx.shadowColor = isGhost ? '#a855f7' : (isTurbo ? '#ffe600' : '#00f0ff');

    const hr = ts * 0.5;
    ctx.beginPath();
    ctx.moveTo(hr * 1.15, 0); // Nose tip
    ctx.lineTo(-hr * 0.7, -hr * 0.85); // Left ear
    ctx.lineTo(-hr * 0.4, 0); // Inset
    ctx.lineTo(-hr * 0.7, hr * 0.85); // Right ear
    ctx.closePath();
    ctx.fill();

    // Glowing Neon Eyes / Visor
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(hr * 0.25, -hr * 0.4, 3, 0, Math.PI * 2);
    ctx.arc(hr * 0.25, hr * 0.4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}

window.CyberSnakeGame = CyberSnakeGame;
