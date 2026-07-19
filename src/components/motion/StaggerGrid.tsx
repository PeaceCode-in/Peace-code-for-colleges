import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type HTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { useMotionIntensity } from "@/lib/use-motion";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** ms between each child entering. */
  stagger?: number;
}

/**
 * StaggerGrid — wraps a grid; when it enters the viewport it fades / lifts
 * children in with a per-child delay. Renders whatever grid classes you pass.
 */
export function StaggerGrid({ className, children, stagger = 30, style, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const intensity = useMotionIntensity();

  useEffect(() => {
    if (intensity === "reduced") {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [intensity]);

  const step = intensity === "expressive" ? stagger * 1.4 : stagger;

  return (
    <div ref={ref} className={cn(className)} style={style} {...rest}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        const el = child as ReactElement<any>;
        const prev = (el.props?.style as React.CSSProperties | undefined) ?? {};
        const delay = i * step;
        const nextStyle: React.CSSProperties = {
          ...prev,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
          transition:
            intensity === "reduced"
              ? "none"
              : `opacity 320ms ease-out ${delay}ms, transform 320ms cubic-bezier(0.2,0.7,0.2,1) ${delay}ms`,
        };
        return cloneElement(el, { style: nextStyle });
      })}
    </div>
  );
}
