import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/settings-store";

export type MotionIntensity = "reduced" | "standard" | "expressive";

function readIntensity(): MotionIntensity {
  if (typeof window === "undefined") return "standard";
  const s = loadSettings();
  if (s.appearance.reduceMotion || s.accessibility.reduceAnim) return "reduced";
  return ((s.appearance as unknown as { motionIntensity?: MotionIntensity }).motionIntensity ?? "standard");
}

/** Reactive motion-intensity hook. */
export function useMotionIntensity(): MotionIntensity {
  const [m, setM] = useState<MotionIntensity>(() => readIntensity());
  useEffect(() => {
    setM(readIntensity());
    const onChange = () => setM(readIntensity());
    window.addEventListener("peacecode-settings", onChange as EventListener);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("peacecode-settings", onChange as EventListener);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return m;
}

export function useReducedMotion(): boolean {
  return useMotionIntensity() === "reduced";
}

export function motionScale(m: MotionIntensity): number {
  return m === "reduced" ? 0 : m === "expressive" ? 1.4 : 1;
}
