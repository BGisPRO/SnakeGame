/**
 * CYBER VIPER 2088 — Procedural Web Audio Engine
 * Pure synthesized cyber sound FX & adaptive synthwave soundtrack.
 * Zero external audio assets required.
 */

class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false; // Off by default until user interacts/toggles
    this.sfxVolume = 0.5;
    this.musicVolume = 0.35;
    
    // Master Gain Nodes
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    // Music Sequencer State
    this.isPlayingMusic = false;
    this.musicInterval = null;
    this.stepIndex = 0;
    this.tempo = 124; // Cyber synthwave BPM

    // Bassline and Arp pattern frequencies (in Hz)
    // Synthwave in D Minor (D, F, G, A, C)
    this.bassNotes = [73.42, 73.42, 87.31, 87.31, 98.00, 98.00, 110.00, 98.00]; // D2, F2, G2, A2
    this.arpNotes = [
      293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23, // D4, F4, A4, C5, D5...
      261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63  // C4, E4, G4, C5...
    ];
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  playMove() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);

      gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playEat(combo = 1) {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 440 + Math.min(combo * 65, 520); // Scales up with combo!
      
      // Dual oscillator arpeggiated harmonic chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.16);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now + 0.04);
      osc1.stop(now + 0.2);
      osc2.stop(now + 0.2);
    } catch (e) {}
  }

  playPowerUp() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      // Low pass filter sweep
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(3200, now + 0.35);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playPortal() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.28);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playDeath() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Heavy bass drop
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.55);

      oscGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.6);

      // White noise explosion crunch
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.linearRampToValueAtTime(120, now + 0.4);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.45);
    } catch (e) {}
  }

  playButtonClick() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

      gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // --- Synthwave Soundtrack Engine ---

  startMusic() {
    if (this.isPlayingMusic) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isPlayingMusic = true;
    const intervalMs = (60 / this.tempo / 4) * 1000; // 16th notes
    this.stepIndex = 0;

    this.musicInterval = setInterval(() => {
      this.playSynthBeatStep();
      this.stepIndex++;
    }, intervalMs);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic() {
    if (this.musicEnabled) {
      this.musicEnabled = false;
      this.stopMusic();
      return false;
    } else {
      this.musicEnabled = true;
      this.startMusic();
      return true;
    }
  }

  playSynthBeatStep() {
    if (!this.musicEnabled || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const step = this.stepIndex % 16;

      // 1. Synth Bass Note on 8th notes (steps 0, 2, 4, 6...)
      if (step % 2 === 0) {
        const bassFreq = this.bassNotes[(Math.floor(this.stepIndex / 4)) % this.bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        // Lowpass filter for warm synth bass
        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(350, now);
        bassFilter.frequency.exponentialRampToValueAtTime(140, now + 0.15);

        bassGain.gain.setValueAtTime(0.18 * this.musicVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.16);
      }

      // 2. High Arpeggiator Lead on 16th notes
      if (step % 2 === 1 || (step % 4 === 0)) {
        const arpFreq = this.arpNotes[this.stepIndex % this.arpNotes.length];
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpFreq, now);

        arpGain.gain.setValueAtTime(0.06 * this.musicVolume, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        arpOsc.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(now);
        arpOsc.stop(now + 0.1);
      }

      // 3. Cyber Hi-hat Click on off-beats (steps 2, 6, 10, 14)
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        const hhOsc = this.ctx.createOscillator();
        const hhGain = this.ctx.createGain();
        hhOsc.type = 'square';
        hhOsc.frequency.setValueAtTime(3500, now);

        hhGain.gain.setValueAtTime(0.03 * this.musicVolume, now);
        hhGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        hhOsc.connect(hhGain);
        hhGain.connect(this.musicGain);
        hhOsc.start(now);
        hhOsc.stop(now + 0.03);
      }
    } catch (e) {}
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}

// Global singleton instance
window.cyberAudio = new CyberAudioEngine();
