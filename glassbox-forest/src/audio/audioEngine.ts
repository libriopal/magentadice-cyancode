// L5 ADORNMENT — audio/music engine. Built on Tone.js (MIT, github.com/Tonejs/Tone.js), DYNAMICALLY
// imported only when the player enables sound, so it costs zero bytes on initial mobile load and degrades
// silently if unavailable. Audio OBSERVES state — it plays SFX on gameplay events and an ambient pad whose
// brightness is subtly driven by the survey-nutrient "mood" — but it NEVER mutates scoring, the ledger, or
// nutrient (anti-circularity: adornment is one-directional). Each experiment gets its own motif.
type ToneModule = typeof import('tone');

export type SfxEvent = 'reveal' | 'roll' | 'score' | 'bust' | 'bank' | 'hold' | 'survey';

// Pentatonic scales by brightness; mood (avg engagement 1–5) selects root octave + major/minor colour.
const BRIGHT = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'];
const DARK = ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'];

// Per-experiment ambient chord (the motif each experiment is "themed" with).
const MOTIF: Record<string, string[]> = {
  'hold-crown': ['C3', 'G3', 'C4'],
  'one-roll': ['D3', 'A3', 'D4'],
  keeper: ['F3', 'C4', 'F4'],
  target: ['G3', 'D4', 'G4'],
  default: ['C3', 'G3', 'E4'],
};

class AudioEngine {
  private Tone: ToneModule | null = null;
  private pad: import('tone').PolySynth | null = null;
  private lead: import('tone').Synth | null = null;
  private enabled = false;
  private mood = 3;
  private experiment = 'default';

  isEnabled(): boolean { return this.enabled; }

  async enable(): Promise<boolean> {
    if (this.enabled) return true;
    try {
      this.Tone = await import('tone');
      await this.Tone.start(); // requires a user gesture — the settings toggle is one
      this.lead = new this.Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, release: 0.25 } }).toDestination();
      this.lead.volume.value = -14;
      this.pad = new this.Tone.PolySynth(this.Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 1.2, release: 2.5 } }).toDestination();
      this.pad.volume.value = -26;
      this.enabled = true;
      this.playPad();
      return true;
    } catch {
      this.enabled = false;
      return false; // degrade silently
    }
  }

  disable(): void {
    try { this.pad?.releaseAll(); this.pad?.dispose(); this.lead?.dispose(); } catch { /* noop */ }
    this.pad = null; this.lead = null; this.enabled = false;
  }

  setExperiment(id: string): void {
    this.experiment = id in MOTIF ? id : 'default';
    if (this.enabled) this.playPad();
  }

  /** Update the ambient brightness from the survey mood (read-only nutrient). */
  setMood(avgEngagement: number): void {
    this.mood = Math.max(1, Math.min(5, avgEngagement));
    if (this.enabled) this.playPad();
  }

  private playPad(): void {
    if (!this.pad) return;
    try {
      this.pad.releaseAll();
      const base = MOTIF[this.experiment] ?? MOTIF.default!;
      // brighter mood → raise the top note; this is the subtle survey-nutrient modulation.
      const chord = this.mood >= 3.5 ? [...base, 'E4'] : this.mood <= 2.2 ? base.map((n) => n.replace('E', 'Eb')) : base;
      this.pad.triggerAttack(chord);
    } catch { /* noop */ }
  }

  private scale(): string[] { return this.mood >= 3 ? BRIGHT : DARK; }

  /** Play a short SFX for a gameplay event. No-op unless enabled. */
  trigger(ev: SfxEvent): void {
    if (!this.enabled || !this.lead || !this.Tone) return;
    const s = this.scale();
    try {
      switch (ev) {
        case 'reveal': this.lead.triggerAttackRelease(s[0]!, '16n'); break;
        case 'roll': this.arp([s[0]!, s[2]!, s[4]!]); break;
        case 'score': this.arp([s[2]!, s[4]!, s[5]!]); break;
        case 'bank': this.lead.triggerAttackRelease(s[5]!, '8n'); break;
        case 'hold': this.lead.triggerAttackRelease(s[3]!, '16n'); break;
        case 'survey': this.arp([s[0]!, s[3]!, s[5]!]); break;
        case 'bust': this.arp([s[4]!, s[2]!, 'A3'], true); break;
      }
    } catch { /* noop */ }
  }

  private arp(notes: string[], down = false): void {
    if (!this.lead || !this.Tone) return;
    const now = this.Tone.now();
    const seq = down ? notes : notes;
    seq.forEach((n, i) => this.lead!.triggerAttackRelease(n, '16n', now + i * 0.07));
  }
}

export const audio = new AudioEngine();
