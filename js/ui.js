/**
 * CYBER VIPER 2088 — UI Controller & Interaction Layer
 * Handles HUD updates, overlays, modal windows, audio toggles, and multi-input controls.
 */

class CyberUIController {
  constructor() {
    this.game = null;

    // Elements cache
    this.scoreVal = document.getElementById('score-val');
    this.highScoreVal = document.getElementById('highscore-val');
    this.comboContainer = document.getElementById('combo-container');
    this.comboVal = document.getElementById('combo-val');
    this.comboBar = document.getElementById('combo-gauge-bar');
    this.modeBadge = document.getElementById('mode-indicator-text');
    this.buffsBar = document.getElementById('active-buffs-bar');

    // Overlays
    this.startScreen = document.getElementById('start-overlay');
    this.pauseScreen = document.getElementById('pause-overlay');
    this.gameOverScreen = document.getElementById('gameover-overlay');
    this.settingsModal = document.getElementById('settings-modal');
    this.scoresModal = document.getElementById('scores-modal');

    // CRT Overlay
    this.crtOverlay = document.getElementById('crt-overlay');

    // Audio indicators
    this.audioMeter = document.getElementById('audio-meter');
    this.sfxBtn = document.getElementById('toggle-sfx-btn');
    this.musicBtn = document.getElementById('toggle-music-btn');

    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  init(game) {
    this.game = game;
    this.bindKeyboard();
    this.bindTouchAndDPad();
    this.bindButtons();
    this.bindSettings();
    this.updateHUD(0, this.game.highScore, 1, 0);
    this.applySettingsToDOM();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling with arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (this.game.state === 'PLAYING' || this.game.state === 'PAUSED') {
          this.game.togglePause();
        } else if (this.game.state === 'MENU' || this.game.state === 'GAMEOVER') {
          this.startScreen.classList.add('hidden');
          this.gameOverScreen.classList.add('hidden');
          this.game.startNewGame();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (this.settingsModal.classList.contains('active')) {
          this.toggleSettingsModal(false);
        } else if (this.scoresModal.classList.contains('active')) {
          this.toggleScoresModal(false);
        } else if (this.game.state === 'PLAYING') {
          this.game.togglePause();
        }
        return;
      }

      // Movement keys (WASD + Arrows)
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          this.game.queueDirection(0, -1);
          break;
        case 'arrowdown':
        case 's':
          this.game.queueDirection(0, 1);
          break;
        case 'arrowleft':
        case 'a':
          this.game.queueDirection(-1, 0);
          break;
        case 'arrowright':
        case 'd':
          this.game.queueDirection(1, 0);
          break;
      }
    });
  }

  bindTouchAndDPad() {
    // Virtual D-Pad buttons
    const bindDpad = (id, dx, dy) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const trigger = (e) => {
        e.preventDefault();
        this.game.queueDirection(dx, dy);
      };
      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('mousedown', trigger);
    };

    bindDpad('dpad-up', 0, -1);
    bindDpad('dpad-down', 0, 1);
    bindDpad('dpad-left', -1, 0);
    bindDpad('dpad-right', 1, 0);

    // Touch swipe gestures on canvas wrapper
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (!canvasWrapper) return;

    canvasWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvasWrapper.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      const deltaX = e.changedTouches[0].clientX - this.touchStartX;
      const deltaY = e.changedTouches[0].clientY - this.touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > 25) { // Minimum swipe threshold
        if (absX > absY) {
          // Horizontal
          if (deltaX > 0) this.game.queueDirection(1, 0);
          else this.game.queueDirection(-1, 0);
        } else {
          // Vertical
          if (deltaY > 0) this.game.queueDirection(0, 1);
          else this.game.queueDirection(0, -1);
        }
      }
    }, { passive: true });
  }

  bindButtons() {
    // Start game button
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.startScreen.classList.add('hidden');
        this.game.startNewGame();
      });
    }

    // Play again button (Game Over)
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.gameOverScreen.classList.add('hidden');
        this.game.startNewGame();
      });
    }

    // Pause resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.game.togglePause();
      });
    }

    // Restart from pause button
    const restartFromPauseBtn = document.getElementById('restart-from-pause-btn');
    if (restartFromPauseBtn) {
      restartFromPauseBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.pauseScreen.classList.add('hidden');
        this.game.startNewGame();
      });
    }

    // Header pause button
    const headerPauseBtn = document.getElementById('header-pause-btn');
    if (headerPauseBtn) {
      headerPauseBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.game.togglePause();
      });
    }

    // Mode Selector buttons
    const modeBtns = document.querySelectorAll('.mode-card-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        modeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const mode = btn.getAttribute('data-mode');
        this.game.setMode(mode);
        this.modeBadge.textContent = mode.toUpperCase();
      });
    });

    // SFX Toggle
    if (this.sfxBtn) {
      this.sfxBtn.addEventListener('click', () => {
        const enabled = window.cyberAudio.toggleSfx();
        this.sfxBtn.classList.toggle('active', enabled);
        window.cyberAudio.playButtonClick();
      });
    }

    // Music Toggle
    if (this.musicBtn) {
      this.musicBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        const playing = window.cyberAudio.toggleMusic();
        this.musicBtn.classList.toggle('active', playing);
        this.audioMeter.classList.toggle('muted', !playing);
      });
    }

    // Fullscreen Toggle
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Settings Modal Trigger
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.toggleSettingsModal(true);
      });
    }
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.toggleSettingsModal(false);
      });
    }

    // Scores Modal Trigger
    const scoresBtn = document.getElementById('leaderboard-btn');
    const closeScoresBtn = document.getElementById('close-scores-btn');
    if (scoresBtn) {
      scoresBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.renderScoresTable();
        this.toggleScoresModal(true);
      });
    }
    if (closeScoresBtn) {
      closeScoresBtn.addEventListener('click', () => {
        window.cyberAudio.playButtonClick();
        this.toggleScoresModal(false);
      });
    }
  }

  bindSettings() {
    // Wall Wrap Switch
    const wallWrapSwitch = document.getElementById('setting-wall-wrap');
    if (wallWrapSwitch) {
      wallWrapSwitch.addEventListener('change', (e) => {
        this.game.settings.wallWrap = e.target.checked;
        this.game.saveSettings();
      });
    }

    // Grid Switch
    const gridSwitch = document.getElementById('setting-grid');
    if (gridSwitch) {
      gridSwitch.addEventListener('change', (e) => {
        this.game.settings.gridLines = e.target.checked;
        this.game.saveSettings();
      });
    }

    // CRT Scanlines Switch
    const crtSwitch = document.getElementById('setting-crt');
    if (crtSwitch) {
      crtSwitch.addEventListener('change', (e) => {
        this.game.settings.crtScanlines = e.target.checked;
        this.crtOverlay.classList.toggle('disabled', !e.target.checked);
        this.game.saveSettings();
      });
    }

    // Difficulty Selector
    const diffSelect = document.getElementById('setting-difficulty');
    if (diffSelect) {
      diffSelect.addEventListener('change', (e) => {
        this.game.settings.difficulty = e.target.value;
        this.game.saveSettings();
      });
    }

    // Audio sliders
    const sfxSlider = document.getElementById('setting-sfx-vol');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        window.cyberAudio.setSfxVolume(parseFloat(e.target.value));
      });
    }

    const musicSlider = document.getElementById('setting-music-vol');
    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        window.cyberAudio.setMusicVolume(parseFloat(e.target.value));
      });
    }
  }

  applySettingsToDOM() {
    const ww = document.getElementById('setting-wall-wrap');
    if (ww) ww.checked = this.game.settings.wallWrap;

    const gs = document.getElementById('setting-grid');
    if (gs) gs.checked = this.game.settings.gridLines;

    const cs = document.getElementById('setting-crt');
    if (cs) {
      cs.checked = this.game.settings.crtScanlines;
      this.crtOverlay.classList.toggle('disabled', !this.game.settings.crtScanlines);
    }

    const ds = document.getElementById('setting-difficulty');
    if (ds) ds.value = this.game.settings.difficulty;
  }

  toggleSettingsModal(show) {
    if (show) {
      this.settingsModal.classList.add('active');
    } else {
      this.settingsModal.classList.remove('active');
    }
  }

  toggleScoresModal(show) {
    if (show) {
      this.scoresModal.classList.add('active');
    } else {
      this.scoresModal.classList.remove('active');
    }
  }

  renderScoresTable() {
    const list = document.getElementById('highscores-list');
    if (!list) return;

    try {
      const scores = JSON.parse(localStorage.getItem('cyberviper_scores') || '[]');
      if (scores.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 1.5rem; color: #64748b;">No high scores logged yet. Start a session to claim the grid!</div>`;
        return;
      }

      let html = '';
      scores.forEach((s, idx) => {
        html += `
          <div class="score-row">
            <span class="score-rank">#${idx + 1}</span>
            <span style="font-weight:700; color:#fff;">${s.mode ? s.mode.toUpperCase() : 'CLASSIC'}</span>
            <span class="score-date">${s.date || 'Recent'}</span>
            <span class="score-pts">${s.score} PTS</span>
          </div>
        `;
      });
      list.innerHTML = html;
    } catch (e) {}
  }

  updateHUD(score, highScore, combo, comboPercent) {
    if (this.scoreVal) this.scoreVal.textContent = score;
    if (this.highScoreVal) this.highScoreVal.textContent = Math.max(score, highScore);

    if (this.comboVal) this.comboVal.textContent = `${combo}x`;
    if (this.comboBar) this.comboBar.style.width = `${Math.max(0, Math.min(100, comboPercent * 100))}%`;
    if (this.comboContainer) {
      this.comboContainer.classList.toggle('active', combo > 1);
    }
  }

  showBuff(buff) {
    if (!this.buffsBar) return;
    this.buffsBar.innerHTML = `
      <div class="buff-chip ${buff.type.toLowerCase()}">
        <span>⚡</span>
        <span>${buff.name}</span>
      </div>
    `;
  }

  hideBuff() {
    if (!this.buffsBar) return;
    this.buffsBar.innerHTML = '';
  }

  showPauseOverlay(show) {
    if (show) {
      this.pauseScreen.classList.remove('hidden');
    } else {
      this.pauseScreen.classList.add('hidden');
    }
  }

  onGameStart() {
    this.startScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hideBuff();
  }

  onGameOver(finalScore, highScore, foodCount, reason) {
    // Populate stats
    document.getElementById('final-score-val').textContent = finalScore;
    document.getElementById('final-highscore-val').textContent = highScore;
    document.getElementById('final-food-val').textContent = foodCount;

    let reasonText = 'SYSTEM OVERLOAD: IMPACT DETECTED';
    if (reason === 'WALL_CRASH') reasonText = 'PERIMETER VIOLATION: GRID COLLISION';
    if (reason === 'SELF_COLLISION') reasonText = 'DATA OVERWRITE: SELF MATRIX CORRUPTED';
    if (reason === 'LASER_CRASH') reasonText = 'HAZARD INTERCEPT: LASER CORE DESTROYED';
    if (reason === 'TIME_EXPIRED') reasonText = 'SYSTEM CLOCK EXPIRED: TIME OUT';

    document.getElementById('gameover-reason').textContent = reasonText;
    this.gameOverScreen.classList.remove('hidden');
  }
}

window.cyberUI = new CyberUIController();
