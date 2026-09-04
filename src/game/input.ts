const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "Space",
  "KeyZ",
  "KeyP",
  "Escape",
]);

function radialDeadzone(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = ((m - dz) / (1 - dz)) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  private qaKeys: string[] | null = null;
  qaSteer = 0;
  pointerX = 0;
  pointerY = 0;
  pointerDown = false;
  pointerActive = false;
  hasPointerAim = false;
  coarse = false;
  private canvas: HTMLCanvasElement;
  private onPause: () => void;
  private unsubs: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, onPause: () => void) {
    this.canvas = canvas;
    this.onPause = onPause;
    this.coarse = window.matchMedia("(pointer: coarse)").matches;
  }

  attach() {
    const down = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (GAME_CODES.has(e.code)) e.preventDefault();
      if (e.code === "Escape" || e.code === "KeyP") {
        if (!e.repeat) this.onPause();
      }
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const clear = () => this.keys.clear();

    const toLocal = (e: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      this.pointerX = ((e.clientX - r.left) / r.width) * this.canvas.clientWidth;
      this.pointerY = ((e.clientY - r.top) / r.height) * this.canvas.clientHeight;
    };

    const pdown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      toLocal(e);
      this.pointerDown = true;
      this.pointerActive = true;
      this.hasPointerAim = e.pointerType === "mouse";
      this.canvas.setPointerCapture(e.pointerId);
    };
    const pmove = (e: PointerEvent) => {
      toLocal(e);
      if (e.pointerType === "mouse") this.hasPointerAim = true;
      if (this.pointerDown) this.pointerActive = true;
    };
    const pend = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      this.pointerDown = false;
      this.pointerActive = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.keys.clear();
    });
    this.canvas.addEventListener("pointerdown", pdown);
    this.canvas.addEventListener("pointermove", pmove);
    this.canvas.addEventListener("pointerup", pend);
    this.canvas.addEventListener("pointercancel", pend);
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this.unsubs.push(
      () => window.removeEventListener("keydown", down),
      () => window.removeEventListener("keyup", up),
      () => window.removeEventListener("blur", clear),
      () => this.canvas.removeEventListener("pointerdown", pdown),
      () => this.canvas.removeEventListener("pointermove", pmove),
      () => this.canvas.removeEventListener("pointerup", pend),
      () => this.canvas.removeEventListener("pointercancel", pend),
    );
  }

  detach() {
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }

  setKeys(codes: string[]) {
    this.qaKeys = codes.length ? codes : null;
    this.keys = new Set(codes);
  }

  private held(code: string) {
    if (this.qaKeys) return this.qaKeys.includes(code);
    return this.keys.has(code);
  }

  sample(): {
    moveX: number;
    moveY: number;
    fire: boolean;
    pointerFollow: boolean;
  } {
    let moveX = 0;
    let moveY = 0;
    if (this.held("KeyA") || this.held("ArrowLeft")) moveX -= 1;
    if (this.held("KeyD") || this.held("ArrowRight")) moveX += 1;
    if (this.held("KeyW") || this.held("ArrowUp")) moveY -= 1;
    if (this.held("KeyS") || this.held("ArrowDown")) moveY += 1;
    moveX -= this.qaSteer;

    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      const stick = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      moveX += stick.x;
      moveY += stick.y;
      if (pad.buttons[12]?.pressed) moveY -= 1;
      if (pad.buttons[13]?.pressed) moveY += 1;
      if (pad.buttons[14]?.pressed) moveX -= 1;
      if (pad.buttons[15]?.pressed) moveX += 1;
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    let fire = this.held("Space") || this.held("KeyZ") || this.pointerDown;
    if (this.coarse && this.pointerDown) fire = true;
    for (const pad of pads) {
      if (!pad) continue;
      if (pad.buttons[0]?.pressed || pad.buttons[7]?.pressed || pad.buttons[5]?.pressed) fire = true;
    }

    const pointerFollow = this.pointerDown && (this.coarse || this.qaKeys === null);

    return { moveX, moveY, fire, pointerFollow };
  }
}
