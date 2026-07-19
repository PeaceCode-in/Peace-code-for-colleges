import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { isSeedActive, isSeedForced, subscribeSeedState } from "@/lib/data/seed-state";

export function SeedModePill() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const update = () => setActive(isSeedActive());
    update();
    return subscribeSeedState(update);
  }, []);
  if (!active) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] uppercase px-1.5 py-0.5 rounded"
      style={{
        background: "color-mix(in oklab, var(--pc-primary) 12%, transparent)",
        color: "var(--pc-primary)",
        border: "1px solid color-mix(in oklab, var(--pc-primary) 30%, transparent)",
        letterSpacing: "0.12em",
      }}
      title={isSeedForced()
        ? "VITE_FORCE_SEED=true — every dataClient call returns the deterministic seed dataset."
        : "Aggregate views were empty — dataClient fell back to the deterministic seed dataset."}
    >
      <Sprout className="h-3 w-3" />
      Seed mode
    </span>
  );
}
