import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Volume2, VolumeX, Shield, Zap, Crosshair } from "lucide-react";
import { Game, type Hud, type OverlayState } from "@/game/game";

const emptyHud: Hud = {
  score: 0,
  lives: 3,
  wave: 0,
  shield: 0,
  multi: 1,
  speedT: 0,
  banner: "",
};

export function StarwakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const livesRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<OverlayState>({
    mode: "title",
    score: 0,
    wave: 0,
    qualifies: false,
    scores: [],
    muted: false,
  });
  const [hud, setHud] = useState<Hud>(emptyHud);
  const [name, setName] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(
      canvas,
      (s) => setOverlay(s),
      (h) => {
        if (scoreRef.current) scoreRef.current.textContent = h.score.toLocaleString();
        if (waveRef.current) waveRef.current.textContent = String(h.wave);
        if (livesRef.current) {
          livesRef.current.dataset.n = String(h.lives);
        }
        if (bannerRef.current) {
          bannerRef.current.textContent = h.banner;
          bannerRef.current.dataset.show = h.banner ? "1" : "0";
        }
        setHud((prev) => {
          if (
            prev.lives === h.lives &&
            prev.shield === h.shield &&
            prev.multi === h.multi &&
            (prev.speedT > 0) === (h.speedT > 0)
          ) {
            return prev;
          }
          return { ...h };
        });
      },
    );
    gameRef.current = game;
    void game.start();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const g = () => gameRef.current;
  const playing = overlay.mode === "playing";
  const showHud = overlay.mode === "playing" || overlay.mode === "paused";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Starwake"
      />

      {showHud && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          <div className="rounded-xl border border-border bg-surface/80 px-3 py-2 backdrop-blur-sm">
            <p className="text-[11px] font-medium tracking-wide text-muted">점수</p>
            <span ref={scoreRef} className="font-mono text-lg tabular leading-tight text-fg">
              0
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <div ref={livesRef} className="flex gap-1" aria-label="목숨">
                {Array.from({ length: Math.max(hud.lives, 0) }).map((_, i) => (
                  <span key={i} className="block h-1.5 w-3 rounded-full bg-ice" />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface/80 px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-[11px] font-medium tracking-wide text-muted">웨이브</p>
            <span ref={waveRef} className="font-mono text-lg tabular leading-tight text-fg">
              0
            </span>
          </div>

          <div className="pointer-events-auto flex items-start gap-2">
            <PowerChips hud={hud} />
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface/80 text-fg backdrop-blur-sm transition-transform duration-150 ease-[var(--ease-out-soft)] hover:bg-surface-2 active:scale-[0.98]"
              onClick={() => g()?.togglePause()}
              aria-label="일시정지"
            >
              <Pause className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      <div
        ref={bannerRef}
        data-show="0"
        className="pointer-events-none absolute inset-x-0 top-[38%] z-10 text-center font-display text-4xl font-semibold tracking-tight text-fg/90 opacity-0 transition-opacity duration-200 data-[show='1']:opacity-100 sm:text-5xl"
      />

      {overlay.mode === "title" && (
        <Panel>
          <p className="mb-2 text-[11px] font-medium tracking-[0.28em] text-muted">DEEP SPACE SORTIE</p>
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">STARWAKE</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            적 웨이브를 격파하고 멀티샷·실드·부스트를 창기세요. 키보드 또는 포인터로 기체를 부드럽게 조종합니다.
          </p>
          <div className="mt-8 flex w-full flex-col gap-2">
            <Primary onClick={() => g()?.play()}>출격</Primary>
            <Ghost onClick={() => g()?.showScores()}>최고 점수</Ghost>
          </div>
          <Help />
        </Panel>
      )}

      {overlay.mode === "paused" && (
        <Panel>
          <h2 className="font-display text-3xl font-semibold tracking-tight">일시정지</h2>
          <p className="mt-2 text-sm text-muted">웨이브 {overlay.wave} · {overlay.score.toLocaleString()}점</p>
          <div className="mt-8 flex w-full flex-col gap-2">
            <Primary onClick={() => g()?.resume()}>재개</Primary>
            <Ghost onClick={() => g()?.restart()}>다시 시작</Ghost>
            <Ghost onClick={() => g()?.showScores()}>점수판</Ghost>
            <Ghost onClick={() => g()?.toggleMute()}>
              {overlay.muted ? (
                <span className="inline-flex items-center gap-2">
                  <VolumeX className="size-4" /> 소리 켜기
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Volume2 className="size-4" /> 음소거
                </span>
              )}
            </Ghost>
            <Ghost onClick={() => g()?.backToTitle()}>타이틀</Ghost>
          </div>
        </Panel>
      )}

      {overlay.mode === "over" && (
        <Panel>
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted">SIGNAL LOST</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">격추됨</h2>
          <p className="mt-3 font-mono text-2xl tabular text-fg">{overlay.score.toLocaleString()}</p>
          <p className="text-sm text-muted">웨이브 {overlay.wave}</p>
          {overlay.qualifies && (
            <form
              className="mt-6 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                g()?.submitName(name);
                setName("");
              }}
            >
              <label className="text-[11px] font-medium text-muted" htmlFor="pilot-name">
                콜사인
              </label>
              <input
                id="pilot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                placeholder="이름"
                className="mt-1.5 h-11 w-full rounded-md border border-border-strong bg-bg px-3 text-sm text-fg outline-none ring-ice/40 placeholder:text-subtle focus:ring-2"
                autoComplete="off"
              />
              <Primary className="mt-3" type="submit">
                점수 등록
              </Primary>
            </form>
          )}
          <div className="mt-6 flex w-full flex-col gap-2">
            <Primary onClick={() => g()?.restart()}>다시 도전</Primary>
            <Ghost onClick={() => g()?.showScores()}>점수판</Ghost>
            <Ghost onClick={() => g()?.backToTitle()}>타이틀</Ghost>
          </div>
        </Panel>
      )}

      {overlay.mode === "scores" && (
        <Panel>
          <h2 className="font-display text-3xl font-semibold tracking-tight">최고 점수</h2>
          <ol className="mt-6 w-full space-y-1">
            {overlay.scores.length === 0 && (
              <li className="py-6 text-center text-sm text-muted">아직 기록이 없습니다.</li>
            )}
            {overlay.scores.map((row, i) => (
              <li
                key={`${row.at}-${i}`}
                className="flex items-baseline justify-between gap-3 rounded-md px-2 py-2 text-sm"
              >
                <span className="w-6 font-mono text-muted tabular">{i + 1}</span>
                <span className="flex-1 truncate text-fg">{row.name}</span>
                <span className="text-muted">W{row.wave}</span>
                <span className="w-20 text-right font-mono tabular text-fg">{row.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex w-full flex-col gap-2">
            <Primary onClick={() => g()?.play()}>출격</Primary>
            <Ghost onClick={() => g()?.backToTitle()}>닫기</Ghost>
          </div>
        </Panel>
      )}

      {playing && (
        <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 hidden -translate-x-1/2 text-[11px] tracking-wide text-muted sm:block">
          WASD 이동 · 마우스 조준 · 클릭 / 스페이스 사격 · Esc 일시정지
        </p>
      )}
    </div>
  );
}

function PowerChips({ hud }: { hud: Hud }) {
  return (
    <div className="pointer-events-none hidden flex-col items-end gap-1 sm:flex">
      {hud.multi > 1 && (
        <Chip icon={<Crosshair className="size-3.5" />} label={`멀티샷 ×${hud.multi}`} />
      )}
      {hud.shield > 0 && (
        <Chip icon={<Shield className="size-3.5" />} label={`실드 ${hud.shield}`} />
      )}
      {hud.speedT > 0 && <Chip icon={<Zap className="size-3.5" />} label="부스트" />}
    </div>
  );
}

function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/80 px-2 py-1 text-[11px] font-medium text-ice backdrop-blur-sm">
      {icon}
      {label}
    </span>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/55 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        {children}
      </div>
    </div>
  );
}

function Primary({
  children,
  onClick,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-fg transition-transform duration-150 ease-[var(--ease-out-soft)] hover:opacity-90 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function Ghost({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-transparent text-sm font-medium text-fg transition-colors duration-150 hover:bg-surface-2 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function Help() {
  return (
    <dl className="mt-8 grid grid-cols-1 gap-2 text-[12px] text-muted sm:grid-cols-2">
      <div>
        <dt className="font-medium text-fg/80">키보드</dt>
        <dd className="mt-0.5 leading-relaxed">WASD 이동, 마우스 조준, 스페이스 사격</dd>
      </div>
      <div>
        <dt className="font-medium text-fg/80">포인터</dt>
        <dd className="mt-0.5 leading-relaxed">화면을 밀어 이동, 터치 중 자동 사격</dd>
      </div>
    </dl>
  );
}
