import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/settings-store";

type Variant = "tile" | "chart" | "table" | "row";

const DIM: Record<Variant, string> = {
  tile: "h-28 rounded-2xl",
  chart: "h-56 rounded-2xl",
  table: "h-40 rounded-xl",
  row: "h-8 rounded-md",
};

function useMotionEnabled() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const s = loadSettings();
    const reduce =
      s.accessibility?.reduceMotion ||
      (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    setEnabled(!reduce);
  }, []);
  return enabled;
}

export function LoadingBlock({
  variant = "tile",
  className = "",
  label = "Loading",
}: {
  variant?: Variant;
  className?: string;
  label?: string;
}) {
  const motion = useMotionEnabled();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={`${DIM[variant]} ${motion ? "pc-shimmer" : ""} ${className}`}
      style={{
        background: motion
          ? "linear-gradient(90deg, var(--pc-surface2) 0%, var(--pc-surface) 50%, var(--pc-surface2) 100%)"
          : "var(--pc-surface2)",
        backgroundSize: motion ? "200% 100%" : undefined,
        border: "1px solid var(--pc-border)",
      }}
    />
  );
}
