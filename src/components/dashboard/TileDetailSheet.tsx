// Right-side detail sheet used by every expandable dashboard tile.
// Uses shadcn's Sheet primitive but re-skins the content with the
// dashboard's design tokens so it inherits the active theme, accent,
// glass, radius and typography without hardcoded colors.
import { type ReactNode } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TileDetailSheet({
  open,
  onOpenChange,
  title,
  eyebrow,
  headline,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  eyebrow?: string;
  headline?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          style={{ background: "color-mix(in oklab, var(--pc-ink) 55%, transparent)" }}
        />
        <SheetPrimitive.Content
          className={cn(
            "fixed z-50 inset-y-0 right-0 h-dvh flex flex-col outline-none",
            "w-full sm:max-w-[560px] lg:max-w-[720px]",
            "border-l shadow-2xl transition ease-in-out",
            "data-[state=closed]:duration-200 data-[state=open]:duration-300",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          )}
          style={{
            background: "var(--pc-surface)",
            color: "var(--pc-ink)",
            borderColor: "var(--pc-border)",
          }}
        >
          <header
            className="flex items-start justify-between gap-3 px-5 py-4 border-b"
            style={{ borderColor: "var(--pc-border)" }}
          >
            <div className="min-w-0">
              {eyebrow && (
                <div
                  className="text-[10px] uppercase mb-1 truncate"
                  style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
                >
                  {eyebrow}
                </div>
              )}
              <SheetPrimitive.Title
                className="font-serif text-[18px] leading-tight truncate"
                style={{ color: "var(--pc-ink)" }}
              >
                {title}
              </SheetPrimitive.Title>
              {headline && (
                <div className="mt-1 text-[12.5px]" style={{ color: "var(--pc-ink-2)" }}>
                  {headline}
                </div>
              )}
            </div>
            <SheetPrimitive.Close
              aria-label="Close detail"
              className="inline-flex items-center justify-center rounded-md w-8 h-8 shrink-0 focus:outline-none focus-visible:ring-2"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
                color: "var(--pc-ink-2)",
                ["--tw-ring-color" as any]: "var(--pc-accent)",
              }}
            >
              <X className="w-4 h-4" />
            </SheetPrimitive.Close>
          </header>
          <SheetPrimitive.Description className="sr-only">
            Detailed drill-down for {title}
          </SheetPrimitive.Description>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-6">{children}</div>
          {footer && (
            <footer
              className="px-5 py-3 border-t text-[11px]"
              style={{ borderColor: "var(--pc-border)", color: "var(--pc-muted)", background: "var(--pc-surface2)" }}
            >
              {footer}
            </footer>
          )}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

// A small reusable "stat block" used inside the detail sheets.
export function DetailStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-3 min-w-0"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
    >
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--pc-muted)" }}>
        {label}
      </div>
      <div className="mt-1 font-serif text-[18px] tabular-nums" style={{ color: "var(--pc-ink)" }}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[11px]" style={{ color: "var(--pc-muted)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// Section wrapper with a serif heading for the detail body.
export function DetailSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="font-serif text-[14px]" style={{ color: "var(--pc-ink)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--pc-muted)" }}>
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
