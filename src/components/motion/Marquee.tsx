import { useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionIntensity } from "@/lib/use-motion";

interface Props extends HTMLAttributes<HTMLDivElement> {
  speed?: number; // seconds per full loop
  children: ReactNode;
}

/**
 * Marquee — horizontally scrolling row. Pauses on hover. Duplicates children
 * once so the loop is seamless. Reduced motion → static list.
 */
export function Marquee({ className, speed = 40, children, style, ...rest }: Props) {
  const [paused, setPaused] = useState(false);
  const intensity = useMotionIntensity();
  const reduced = intensity === "reduced";
  const dur = intensity === "expressive" ? speed * 0.75 : speed;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)",
        ...style,
      }}
      {...rest}
    >
      <div
        className="flex gap-8 whitespace-nowrap will-change-transform"
        style={{
          animation: reduced ? undefined : `pc-marquee ${dur}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <div className="flex gap-8 shrink-0">{children}</div>
        {!reduced && (
          <div className="flex gap-8 shrink-0" aria-hidden>
            {children}
          </div>
        )}
      </div>
      <style>{`@keyframes pc-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
