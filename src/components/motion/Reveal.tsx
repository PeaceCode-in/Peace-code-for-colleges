import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMotionIntensity } from "@/lib/use-motion";

interface Props extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  y?: number;
}

/**
 * Reveal — fade + short translate-up when the element enters the viewport.
 * One-shot. Reduced motion → renders immediately with no animation.
 */
export function Reveal({ className, children, delay = 0, y = 8, style, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  const intensity = useMotionIntensity();

  useEffect(() => {
    if (intensity === "reduced") {
      setOn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setOn(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "translateY(0)" : `translateY(${y}px)`,
        transition:
          intensity === "reduced"
            ? "none"
            : `opacity 420ms ease-out ${delay}ms, transform 420ms cubic-bezier(0.2,0.7,0.2,1) ${delay}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
