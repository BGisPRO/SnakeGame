/**
 * CYBER VIPER 2088 — High-Performance Canvas 2D Particle Engine
 * Handles glowing energy bursts, shockwaves, cyber trails, and death shatter.
 */

class ParticleEngine {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.shards = [];
    this.ambientMotes = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.maxParticles = 350; // Cap to ensure 60fps on all devices
  }

  initAmbient(width, height, count = 25) {
    this.ambientMotes = [];
    for (let i = 0; i < count; i++) {
      this.ambientMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? '#00f0ff' : '#ff007f',
        alpha: Math.random() * 0.4 + 0.1,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  // Camera screen shake
  addScreenShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 22);
  }

  getShakeOffset() {
    if (this.shakeIntensity < 0.1) {
      this.shakeIntensity = 0;
      return { x: 0, y: 0 };
    }
    const angle = Math.random() * Math.PI * 2;
    const dist = (Math.random() * 0.6 + 0.4) * this.shakeIntensity;
    this.shakeIntensity *= this.shakeDecay;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist
    };
  }

  // Food pickup spark explosion
  spawnFoodSparks(x, y, color = '#00f0ff', count = 18) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 4.5 + 1.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        friction: 0.94,
        glow: true
      });
    }

    // Spawn subtle shockwave ring
    this.spawnShockwave(x, y, color, 45);
  }

  // Expanding shockwave ripple
  spawnShockwave(x, y, color = '#00f0ff', maxRadius = 50) {
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius,
      speed: 3.5,
      color,
      alpha: 0.85
    });
  }

  // Snake movement energy trail
  spawnSnakeTrail(x, y, color = 'rgba(0, 240, 255, 0.5)') {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      color,
      alpha: 0.5,
      decay: 0.05,
      friction: 0.98,
      glow: false
    });
  }

  // Shatter shards on crash/death
  spawnDeathShatter(segments, color = '#ff007f') {
    segments.forEach(seg => {
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.shards.push({
          x: seg.x,
          y: seg.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 6 + 3,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
          color: Math.random() > 0.4 ? color : '#00f0ff',
          alpha: 1.0,
          decay: Math.random() * 0.018 + 0.012
        });
      }
    });
    this.addScreenShake(18);
  }

  update(width, height) {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update death shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const sh = this.shards[i];
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.vx *= 0.96;
      sh.vy *= 0.96;
      sh.rotation += sh.vRot;
      sh.alpha -= sh.decay;

      if (sh.alpha <= 0) {
        this.shards.splice(i, 1);
      }
    }

    // 4. Update ambient motes
    this.ambientMotes.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;
      m.pulsePhase += m.pulseSpeed;

      // Wrap around screen
      if (m.x < 0) m.x = width;
      if (m.x > width) m.x = 0;
      if (m.y < 0) m.y = height;
      if (m.y > height) m.y = 0;
    });
  }

  drawAmbient(ctx) {
    ctx.save();
    this.ambientMotes.forEach(m => {
      const currentAlpha = m.alpha * (0.6 + 0.4 * Math.sin(m.pulsePhase));
      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw Shockwaves
    this.shockwaves.forEach(sw => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha * 0.7;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = sw.color;
      ctx.stroke();
      ctx.restore();
    });

    // 2. Draw Sparks / Dust
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Draw Death Shards
    this.shards.forEach(sh => {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.rotation);
      ctx.globalAlpha = Math.max(0, sh.alpha);
      ctx.fillStyle = sh.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = sh.color;
      ctx.fillRect(-sh.size / 2, -sh.size / 2, sh.size, sh.size);
      ctx.restore();
    });

    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.shockwaves = [];
    this.shards = [];
    this.shakeIntensity = 0;
  }
}

window.particleEngine = new ParticleEngine();
