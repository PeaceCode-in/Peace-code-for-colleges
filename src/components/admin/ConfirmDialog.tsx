// Confirm dialog with optional "type EXACT_TEXT to confirm" gate.
// Used by every mutating admin action.
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/college/primitives";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  typeToConfirm,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  typeToConfirm?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (!open) setTyped(""); }, [open]);
  if (!open) return null;
  const gateOk = !typeToConfirm || typed === typeToConfirm;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "color-mix(in oklab, var(--pc-ink) 45%, transparent)" }}
      onClick={onClose}
    >
      <GlassCard tone="raised" className="w-full max-w-md p-6" >
        <div onClick={(e) => e.stopPropagation()}>
          <h3 className="font-serif text-[19px]" style={{ color: "var(--pc-ink)" }}>{title}</h3>
          <div className="mt-2 text-[13px]" style={{ color: "var(--pc-muted)" }}>{description}</div>
          {typeToConfirm && (
            <div className="mt-4">
              <label className="text-[11px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>
                Type <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{typeToConfirm}</span> to confirm
              </label>
              <input
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full text-[12.5px]"
              style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}
            >{cancelLabel}</button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              disabled={!gateOk}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: danger ? "var(--pc-warn)" : "var(--pc-primary)",
                color: "white",
                border: "1px solid transparent",
              }}
            >{confirmLabel}</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
