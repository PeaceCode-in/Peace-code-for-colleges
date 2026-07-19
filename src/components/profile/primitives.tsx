import { palette } from "@/components/AppShell";
import { type ReactNode, useEffect, useState } from "react";
import { THEMES, type ThemeKey } from "@/lib/profile-store";

export const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

export function useThemeColors(themeKey: ThemeKey) {
  return THEMES[themeKey];
}

export function Chip({ children, tone = "neutral", onClick, active }: { children: ReactNode; tone?: "neutral" | "primary" | "soft"; onClick?: () => void; active?: boolean }) {
  const bg = active ? primary : tone === "primary" ? primary : tone === "soft" ? soft : surface2;
  const color = active || tone === "primary" ? "#fff" : ink;
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1 rounded-full text-[11.5px] tracking-wide transition hover:opacity-80"
      style={{ background: bg, color, border: `1px solid ${border}` }}>{children}</button>
  );
}

export function Panel({ children, className = "", tone = "surface" }: { children: ReactNode; className?: string; tone?: "surface" | "soft" }) {
  return (
    <div className={`rounded-3xl p-5 ${className}`}
      style={{ background: tone === "soft" ? "var(--pc-shell)" : surface, border: `1px solid ${border}` }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[10px] tracking-[0.32em] uppercase mb-3" style={{ color: muted }}>{children}</div>;
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: muted }}>{label}</div>
      <div className="font-serif text-[22px] leading-tight mt-1.5" style={{ color: ink }}>{value}</div>
      {hint && <div className="text-[11px] mt-0.5" style={{ color: muted }}>{hint}</div>}
    </div>
  );
}

/** Slide-over panel — Notion / Linear style */
export function Sheet({ open, onClose, title, children, side = "right" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: "right" | "bottom" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const isBottom = side === "bottom";
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-[fadeBg_.2s_ease-out]" style={{ background: "rgba(20,24,40,0.35)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div
        className={`absolute ${isBottom ? "left-0 right-0 bottom-0 rounded-t-[28px] max-h-[92vh]" : "top-0 bottom-0 right-0 w-full sm:w-[520px] rounded-l-[28px]"} shadow-2xl overflow-hidden animate-[slideIn_.28s_cubic-bezier(.2,.8,.2,1)]`}
        style={{ background: "var(--pc-bg)", border: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="font-serif text-[16px]" style={{ color: ink }}>{title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full text-[13px]" style={{ background: surface2, color: ink }} aria-label="close">×</button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: isBottom ? "80vh" : "calc(100% - 60px)" }}>
          <div className="px-6 py-6">{children}</div>
        </div>
      </div>
      <style>{`
        @keyframes fadeBg { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translate${isBottom ? "Y" : "X"}(20px); opacity: 0 } to { transform: translate${isBottom ? "Y" : "X"}(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

export function useCountUp(target: number, duration = 800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl p-10 text-center" style={{ background: surface, border: `1px dashed ${border}` }}>
      <div className="text-2xl mb-2 opacity-70">{icon}</div>
      <div className="font-serif text-[18px]" style={{ color: ink }}>{title}</div>
      {hint && <p className="text-[12.5px] mt-1" style={{ color: muted }}>{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Simple toast — call `pushToast('saved')` from anywhere */
let toastListeners: ((msg: string) => void)[] = [];
export function pushToast(msg: string) { toastListeners.forEach((l) => l(msg)); }
export function Toasts() {
  const [msgs, setMsgs] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    const l = (msg: string) => {
      const id = Date.now() + Math.random();
      setMsgs((m) => [...m, { id, msg }]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 2200);
    };
    toastListeners.push(l);
    return () => { toastListeners = toastListeners.filter((x) => x !== l); };
  }, []);
  return (
    <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[80] flex flex-col gap-2 pointer-events-none">
      {msgs.map((m) => (
        <div key={m.id} className="px-4 py-2 rounded-full text-[12px] shadow-lg animate-[toastIn_.24s_ease-out]"
          style={{ background: ink, color: "var(--pc-bg)" }}>{m.msg}</div>
      ))}
      <style>{`@keyframes toastIn { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}
