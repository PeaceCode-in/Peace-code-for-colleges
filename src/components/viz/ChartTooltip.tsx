import { ReactNode, RefObject, useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  useTouchAsHover — mirror finger drags onto the same mouse handlers our    */
/*  charts already declare (onMouseEnter/Leave/Move). We release pointer      */
/*  capture on touchstart so subsequent pointermove events hit-test to the    */
/*  element under the finger, then synthesize bubbling mouse events so React  */
/*  fires onMouseOver / onMouseOut / onMouseMove naturally on those targets.  */
/*  The wrapper is locked to `touch-action: none` while mounted so a drag on  */
/*  a data point never accidentally scrolls the page.                          */
/* -------------------------------------------------------------------------- */
export function useTouchAsHover(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prevTouch = el.style.touchAction;
    const prevSelect = el.style.userSelect;
    el.style.touchAction = "none";
    el.style.userSelect = "none";

    let lastTarget: Element | null = null;
    let active = false;

    const fire = (
      type: string,
      target: Element | null,
      x: number,
      y: number,
      related: Element | null = null,
    ) => {
      if (!target) return;
      target.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          relatedTarget: related as EventTarget | null,
        }),
      );
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      e.preventDefault();
      const t = document.elementFromPoint(e.clientX, e.clientY);
      if (t !== lastTarget) {
        fire("mouseout", lastTarget, e.clientX, e.clientY, t);
        fire("mouseover", t, e.clientX, e.clientY, lastTarget);
        lastTarget = t;
      }
      fire("mousemove", t, e.clientX, e.clientY);
    };

    const onEnd = (e: PointerEvent) => {
      if (!active) return;
      fire("mouseout", lastTarget, e.clientX, e.clientY, null);
      // Fire a wrapper-level mouseleave so per-chart onMouseLeave clears state.
      el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false, clientX: e.clientX, clientY: e.clientY }));
      active = false;
      lastTarget = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        /* no-op */
      }
      active = true;
      lastTarget = document.elementFromPoint(e.clientX, e.clientY);
      fire("mouseover", lastTarget, e.clientX, e.clientY);
      fire("mousemove", lastTarget, e.clientX, e.clientY);
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
    };

    el.addEventListener("pointerdown", onDown);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      el.style.touchAction = prevTouch;
      el.style.userSelect = prevSelect;
    };
  }, [ref]);
}

/* -------------------------------------------------------------------------- */
/*  Chart tooltip — the single, canonical hover overlay used by every custom  */
/*  SVG chart in this app. It exposes:                                         */
/*    - useChartTooltip()          → mouse tracking + content state            */
/*    - <ChartTooltip .../>        → the floating label anchored to a parent   */
/*    - <TooltipLine .../> helper  → consistent key/value rows                 */
/* -------------------------------------------------------------------------- */

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

export interface ChartTooltipApi {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onMove: (e: React.MouseEvent) => void;
  show: (content: ReactNode, e?: React.MouseEvent) => void;
  hide: () => void;
  state: TooltipState | null;
}

export function useChartTooltip(): ChartTooltipApi {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<TooltipState | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const positionFrom = useCallback((e?: React.MouseEvent) => {
    if (!e) return lastPos.current;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x: e.clientX, y: e.clientY };
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    lastPos.current = pos;
    return pos;
  }, []);

  const onMove = useCallback((e: React.MouseEvent) => {
    const pos = positionFrom(e);
    setState((prev) => (prev ? { ...prev, x: pos.x, y: pos.y } : prev));
  }, [positionFrom]);

  const show = useCallback((content: ReactNode, e?: React.MouseEvent) => {
    const pos = positionFrom(e);
    setState({ x: pos.x, y: pos.y, content });
  }, [positionFrom]);

  const hide = useCallback(() => setState(null), []);

  // Touch/pen drags synthesize hover events on the elements under the finger,
  // so every chart wired through this hook gets the same tooltip on mobile.
  useTouchAsHover(wrapperRef);

  return { wrapperRef, onMove, show, hide, state };
}

/** Floating tooltip rendered inside the chart's relative wrapper. */
export function ChartTooltip({ state }: { state: TooltipState | null }) {
  if (!state) return null;
  const parent = typeof document !== "undefined" ? document.body : null;
  const parentWidth = parent?.clientWidth ?? 1200;
  // Prefer top-right of cursor. Flip when near right edge.
  const flip = state.x > parentWidth - 260;
  const dx = flip ? -14 : 14;
  const transform = flip ? "translate(-100%, -100%)" : "translate(0, -100%)";
  return (
    <div
      role="tooltip"
      aria-live="polite"
      className="pointer-events-none absolute z-40 min-w-[140px] max-w-[240px] rounded-md px-3 py-2 text-[11.5px] leading-tight shadow-lg animate-fade-in"
      style={{
        left: state.x + dx,
        top: state.y - 10,
        transform,
        background: "var(--pc-surface)",
        border: "1px solid var(--pc-border)",
        color: "var(--pc-ink)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        boxShadow: "0 8px 24px -12px color-mix(in oklab, var(--pc-ink) 30%, transparent)",
      }}
    >
      {state.content}
    </div>
  );
}

/** Small helper: one line of tooltip content shaped label · value. */
export function TooltipRow({ label, value, dot }: { label: ReactNode; value: ReactNode; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5" style={{ color: "var(--pc-muted)" }}>
        {dot && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
        {label}
      </span>
      <span className="font-mono tabular-nums" style={{ color: "var(--pc-ink)" }}>{value}</span>
    </div>
  );
}

/** Section title inside a tooltip. */
export function TooltipTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-1.5">
      <div className="text-[10.5px] uppercase tracking-wider" style={{ color: "var(--pc-muted)", letterSpacing: "0.12em" }}>
        {children}
      </div>
      {sub && <div className="text-[13px] font-serif leading-tight mt-0.5" style={{ color: "var(--pc-ink)" }}>{sub}</div>}
    </div>
  );
}

/** Interpretive footnote — one-line "what this means" copy. */
export function TooltipHint({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1.5 pt-1.5 text-[10.5px]" style={{ borderTop: "1px dashed var(--pc-border)", color: "var(--pc-muted)" }}>
      {children}
    </div>
  );
}
