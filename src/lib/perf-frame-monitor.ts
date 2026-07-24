// Lightweight frame-drop monitor. Samples requestAnimationFrame deltas over a
// bounded window and reports FPS, dropped frames (>16.7ms budget at 60Hz), and
// worst frame time. Zero cost when not actively measuring.

export type FrameReport = {
  label: string;
  durationMs: number;
  frames: number;
  fps: number;
  droppedFrames: number;
  droppedPct: number;
  worstFrameMs: number;
  avgFrameMs: number;
};

const BUDGET_MS = 1000 / 60; // 16.67ms
const JANK_THRESHOLD_MS = BUDGET_MS * 1.5; // ~25ms = dropped frame

let active: { label: string; start: number; last: number; frames: number; dropped: number; worst: number } | null = null;
let rafId = 0;

function tick(now: number) {
  if (!active) return;
  const delta = now - active.last;
  active.last = now;
  active.frames += 1;
  if (delta > JANK_THRESHOLD_MS) active.dropped += 1;
  if (delta > active.worst) active.worst = delta;
  rafId = requestAnimationFrame(tick);
}

export function measureFrames(label: string, durationMs = 500): Promise<FrameReport> {
  if (typeof window === "undefined") {
    return Promise.resolve({ label, durationMs: 0, frames: 0, fps: 0, droppedFrames: 0, droppedPct: 0, worstFrameMs: 0, avgFrameMs: 0 });
  }
  // If a measurement is already running, cancel it — the newer intent wins.
  if (active) cancelAnimationFrame(rafId);

  const start = performance.now();
  active = { label, start, last: start, frames: 0, dropped: 0, worst: 0 };
  rafId = requestAnimationFrame(tick);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (!active || active.label !== label) return;
      cancelAnimationFrame(rafId);
      const duration = performance.now() - active.start;
      const frames = active.frames;
      const dropped = active.dropped;
      const report: FrameReport = {
        label,
        durationMs: Math.round(duration),
        frames,
        fps: frames > 0 ? Math.round((frames / duration) * 1000) : 0,
        droppedFrames: dropped,
        droppedPct: frames > 0 ? Math.round((dropped / frames) * 100) : 0,
        worstFrameMs: Math.round(active.worst * 10) / 10,
        avgFrameMs: frames > 0 ? Math.round((duration / frames) * 10) / 10 : 0,
      };
      active = null;

      // Only log in dev — production users don't need console noise.
      if (import.meta.env.DEV) {
        const bad = report.droppedPct > 10 || report.fps < 50;
        const style = bad
          ? "color:#c04a3a;font-weight:600"
          : "color:#4a7a52;font-weight:600";
        console.log(
          `%c[perf:${report.label}]%c ${report.fps} fps · ${report.droppedFrames}/${report.frames} dropped (${report.droppedPct}%) · worst ${report.worstFrameMs}ms · avg ${report.avgFrameMs}ms`,
          style,
          "color:inherit",
        );
      }
      resolve(report);
    }, durationMs);
  });
}
