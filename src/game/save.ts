const KEY = "starwake-save";
const SAVE_VERSION = 1;
const MAX_SCORES = 10;

export type ScoreRow = {
  name: string;
  score: number;
  wave: number;
  at: number;
};

type SaveData = {
  version: number;
  scores: ScoreRow[];
  muted: boolean;
};

const defaults: SaveData = { version: SAVE_VERSION, scores: [], muted: false };

function migrate(raw: Partial<SaveData> | null): SaveData {
  const s: SaveData = {
    ...defaults,
    ...raw,
    scores: Array.isArray(raw?.scores) ? raw.scores : [],
    muted: Boolean(raw?.muted),
    version: SAVE_VERSION,
  };
  s.scores = s.scores
    .filter((r) => r && typeof r.score === "number")
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
  return s;
}

function read(): SaveData {
  try {
    if (typeof localStorage === "undefined") return { ...defaults, scores: [] };
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults, scores: [] };
    return migrate(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return { ...defaults, scores: [] };
  }
}

function write(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}

export function loadScores(): ScoreRow[] {
  return read().scores;
}

export function isMuted(): boolean {
  return read().muted;
}

export function setMuted(muted: boolean) {
  const data = read();
  data.muted = muted;
  write(data);
}

export function qualifies(score: number): boolean {
  const scores = loadScores();
  if (score <= 0) return false;
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1]!.score;
}

export function submitScore(name: string, score: number, wave: number): ScoreRow[] {
  const data = read();
  const row: ScoreRow = {
    name: (name.trim() || "PILOT").slice(0, 12),
    score,
    wave,
    at: Date.now(),
  };
  data.scores.push(row);
  data.scores.sort((a, b) => b.score - a.score || a.at - b.at);
  data.scores = data.scores.slice(0, MAX_SCORES);
  write(data);
  return data.scores;
}
