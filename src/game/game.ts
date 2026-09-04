export type Mode = "title" | "playing" | "paused" | "over" | "scores";

export type Hud = {
  score: number;
  lives: number;
  wave: number;
  shield: number;
  multi: number;
  speedT: number;
  banner: string;
};

export type OverlayState = {
  mode: Mode;
  score: number;
  wave: number;
  qualifies: boolean;
  scores: import("./save").ScoreRow[];
  muted: boolean;
};

/** Full engine: src/game/game.ts in the Starwake app (wave combat, pickups, rendering). */
export { Game } from "./engine";
