import { useEffect, useState } from "react";
import { subscribeSettings, getSettings } from "@/lib/settings-store";

export type MotionIntensity = "reduced" | "standard" | "expressive";

function readIntensity(): MotionIntensity {
  const s = getSettings();
  if (s.appearance.reduceMotion || s.accessibility.reduceAnim) return "reduced";
  return (s.appearance.motionIntensity ?? "standard") as MotionIntensity;
}

/** Reactive motion-intensity hook. Everything animation-related reads this. */
export function useMotionIntensity(): MotionIntensity {
  const [m, setM] = useState<MotionIntensity>(() =>
    typeof window === "undefined" ? "standard" : readIntensity(),
  );
  useEffect(() => {
    setM(readIntensity());
    return subscribeSettings(() => setM(readIntensity()));
  }, []);
  return m;
}

export function useReducedMotion(): boolean {
  return useMotionIntensity() === "reduced";
}

/** Scale factor: reduced=0, standard=1, expressive=1.4. */
export function motionScale(m: MotionIntensity): number {
  return m === "reduced" ? 0 : m === "expressive" ? 1.4 : 1;
}
