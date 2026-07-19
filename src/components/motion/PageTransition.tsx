import { useEffect, useState, type ReactNode } from "react";
import { useMotionIntensity } from "@/lib/use-motion";

/**
 * PageTransition — fades + lifts the current route's contents when `pathname`
 * changes. 300ms, ease-out. Respects motion intensity.
 */
export function PageTransition({ pathname, children }: { pathname: string; children: ReactNode }) {
  const [on, setOn] = useState(true);
  const intensity = useMotionIntensity();

  useEffect(() => {
    if (intensity === "reduced") {
      setOn(true);
      return;
    }
    setOn(false);
    const t = window.setTimeout(() => setOn(true), 20);
    return () => clearTimeout(t);
  }, [pathname, intensity]);

  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "translateY(0)" : "translateY(8px)",
        transition:
          intensity === "reduced"
            ? "none"
            : "opacity 300ms ease-out, transform 300ms cubic-bezier(0.2,0.7,0.2,1)",
      }}
    >
      {children}
    </div>
  );
}
