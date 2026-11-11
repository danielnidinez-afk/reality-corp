/**
 * Procedural zero-asset Web Audio synthesizer (ADR DEC-11).
 * Avoids external MP3/WAV asset bloat and unlocks cleanly on first user gesture.
 */
export class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  public unlock(): void {
    if (typeof window === 'undefined' || !this.enabled) return;
    const AudioCtor = window.AudioContext;
    if (!AudioCtor) return;
    if (!this.ctx) {
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private playTone(freqHz: number, durationSec: number, type: OscillatorType, peakGain: number): void {
    if (!this.enabled || typeof window === 'undefined') return;
    if (!this.ctx) {
      this.unlock();
    }
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqHz, now);
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec);
  }

  public playTap(): void {
    this.playTone(540, 0.055, 'triangle', 0.06);
  }

  public playUpgrade(): void {
    this.playTone(660, 0.09, 'sine', 0.08);
    setTimeout(() => this.playTone(880, 0.11, 'sine', 0.07), 45);
  }

  public playBreakthrough(): void {
    this.playTone(523.25, 0.12, 'triangle', 0.09);
    setTimeout(() => this.playTone(659.25, 0.14, 'triangle', 0.08), 70);
    setTimeout(() => this.playTone(783.99, 0.18, 'sine', 0.08), 140);
  }
}

