import { useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMotionIntensity } from "@/lib/use-motion";

interface Props extends HTMLAttributes<HTMLDivElement> {
  lift?: number;
}

/** HoverLift — nudges up + softens shadow on hover. */
export function HoverLift({ className, children, style, lift = 2, ...rest }: Props) {
  const [h, setH] = useState(false);
  const intensity = useMotionIntensity();
  const reduced = intensity === "reduced";
  const l = intensity === "expressive" ? lift * 1.5 : lift;

  return (
    <div
      className={cn(className)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        transform: !reduced && h ? `translateY(-${l}px)` : "translateY(0)",
        boxShadow:
          !reduced && h
            ? "0 8px 22px -12px color-mix(in oklab, var(--pc-primary) 26%, transparent)"
            : "0 1px 2px color-mix(in oklab, var(--pc-ink) 6%, transparent)",
        transition: reduced ? "none" : "transform 180ms ease-out, box-shadow 180ms ease-out",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
