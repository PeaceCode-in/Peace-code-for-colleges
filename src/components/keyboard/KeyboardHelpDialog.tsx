import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SHORTCUTS } from "@/lib/keyboard-map";

export function KeyboardHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <kbd>?</kbd> anywhere to reopen this dialog.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g}>
              <h3 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--pc-muted)" }}>
                {g}
              </h3>
              <ul className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <li key={s.keys} className="flex items-center justify-between text-[13px]">
                    <span style={{ color: "var(--pc-ink-2)" }}>{s.label}</span>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                      style={{
                        background: "var(--pc-surface2)",
                        color: "var(--pc-ink)",
                        border: "1px solid var(--pc-border)",
                      }}
                    >
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
