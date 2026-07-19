import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMotionIntensity, motionScale } from "@/lib/use-motion";

interface Props extends HTMLAttributes<HTMLDivElement> {
  parallax?: number; // px translate range at ends of viewport
  glass?: boolean;
}

/**
 * FlowCard — glass surface with a slow parallax drift as it scrolls through
 * the viewport. Uses IntersectionObserver + rAF; no scroll listeners on window.
 */
export const FlowCard = forwardRef<HTMLDivElement, Props>(function FlowCard(
  { className, style, children, parallax = 8, glass = true, ...rest },
  ref,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const setRef = (el: HTMLDivElement | null) => {
    localRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };
  const [ty, setTy] = useState(0);
  const intensity = useMotionIntensity();

  useEffect(() => {
    const el = localRef.current;
    if (!el || intensity === "reduced") return;
    const scale = motionScale(intensity);
    let raf = 0;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (below fold) .. 1 (above fold)
      const p = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
      setTy(Math.max(-1, Math.min(1, p)) * -parallax * scale);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [parallax, intensity]);

  return (
    <div
      ref={setRef}
      className={cn(
        "rounded-[var(--radius)] border transition-shadow duration-200",
        glass && "backdrop-blur-[6px]",
        className,
      )}
      style={{
        background: glass ? "color-mix(in oklab, var(--pc-surface) 82%, transparent)" : "var(--pc-surface)",
        borderColor: "var(--pc-border)",
        transform: `translate3d(0, ${ty.toFixed(2)}px, 0)`,
        transition: intensity === "reduced" ? "none" : "transform 260ms cubic-bezier(0.2,0.7,0.2,1), box-shadow 200ms ease-out",
        willChange: intensity === "reduced" ? undefined : "transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});
