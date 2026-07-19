import { useEffect, useRef, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
}

/**
 * CountUp — animates 0 → value once when the element scrolls into view.
 * Respects motion intensity (reduced = instant).
 */
export function CountUp({ value, duration = 800, decimals = 0, prefix = "", suffix = "", format, className }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);
  const started = useRef(false);
  const intensity = useMotionIntensity();

  useEffect(() => {
    if (intensity === "reduced") {
      setN(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const from = 0;
            const dur = intensity === "expressive" ? duration * 1.25 : duration;
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / dur);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - p, 3);
              setN(from + (value - from) * eased);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, intensity]);

  const display = format
    ? format(n)
    : n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
