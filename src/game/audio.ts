export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.bus = this.ctx.createGain();
      this.bus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.master.gain.value = this.muted ? 0 : 0.7;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.02);
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private env(dur: number, peak: number, type: OscillatorType, freq: number, slide = 0) {
    if (!this.ctx || !this.bus || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private noise(dur: number, peak: number, hp = 800) {
    if (!this.ctx || !this.bus || this.muted) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(n * dur)), n);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.bus);
    src.start(t);
    src.stop(t + dur);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  shoot() {
    const jitter = 0.92 + Math.random() * 0.16;
    this.env(0.07, 0.09, "square", 880 * jitter, -420);
    this.noise(0.04, 0.05, 1800);
  }

  enemyShoot() {
    this.env(0.08, 0.05, "sawtooth", 320 + Math.random() * 40, -120);
  }

  hit() {
    this.noise(0.07, 0.1, 400);
    this.env(0.09, 0.07, "square", 240, -160);
  }

  explode() {
    this.noise(0.28, 0.16, 200);
    this.env(0.32, 0.12, "sawtooth", 140, -100);
  }

  pickup() {
    this.env(0.08, 0.08, "sine", 660);
    this.env(0.12, 0.07, "sine", 990);
  }

  wave() {
    this.env(0.18, 0.07, "triangle", 392);
    this.env(0.22, 0.06, "triangle", 523);
  }

  death() {
    this.noise(0.4, 0.14, 180);
    this.env(0.45, 0.1, "sawtooth", 180, -140);
  }

  ui() {
    this.env(0.06, 0.05, "sine", 520);
  }
}
