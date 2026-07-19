import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { User, LogOut, Palette, Bell, LifeBuoy, UserCog, Building2 } from "lucide-react";
import { useCollegeContext } from "@/lib/college-context";
import { loadSession } from "@/lib/auth-store";

function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const [name, domain] = email.split("@");
  if (!domain || !name) return email;
  const head = name.length <= 2 ? name : name.slice(0, 2) + "•".repeat(Math.max(1, name.length - 2));
  return `${head}@${domain}`;
}

type Item =
  | { kind: "link"; icon: React.ComponentType<{ className?: string }>; label: string; to: string }
  | { kind: "divider" }
  | { kind: "action"; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; tone?: "danger" };

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const college = useCollegeContext();
  const email = college?.email ?? loadSession()?.email ?? null;
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  // Global "g p" opens the menu
  useEffect(() => {
    const onOpen = () => { setOpen(true); btnRef.current?.focus(); };
    window.addEventListener("pcc:open-profile", onOpen as EventListener);
    return () => window.removeEventListener("pcc:open-profile", onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    const m = await import("@/lib/auth-store");
    m.endSession();
    setOpen(false);
    navigate({ to: "/auth" });
  }

  const items: Item[] = [
    { kind: "link", icon: UserCog,    label: "Account",        to: "/settings/account" },
    { kind: "link", icon: Palette,    label: "Appearance",     to: "/settings/appearance" },
    { kind: "link", icon: Bell,       label: "Notifications",  to: "/settings/notifications" },
    { kind: "link", icon: Building2,  label: "Institution",    to: "/admin/institution" },
    { kind: "link", icon: LifeBuoy,   label: "Help & policy",  to: "/help" },
    { kind: "divider" },
    { kind: "action", icon: LogOut, label: "Sign out", onClick: signOut, tone: "danger" },
  ];

  // Arrow-key navigation on interactive items only
  const interactiveIdx = items.map((it, i) => (it.kind === "divider" ? -1 : i)).filter((i) => i >= 0);
  useEffect(() => {
    if (!open) return;
    setFocusIdx(0);
    const onArrow = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      setFocusIdx((prev) => {
        const cur = interactiveIdx.indexOf(prev >= 0 ? prev : interactiveIdx[0]!);
        const next = e.key === "ArrowDown"
          ? (cur + 1) % interactiveIdx.length
          : (cur - 1 + interactiveIdx.length) % interactiveIdx.length;
        return interactiveIdx[next]!;
      });
    };
    window.addEventListener("keydown", onArrow);
    return () => window.removeEventListener("keydown", onArrow);
  }, [open, interactiveIdx]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-medium text-white transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ background: college?.colorAccent ?? "var(--pc-primary)" }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
      >
        {college?.initials ?? <User className="h-4 w-4" />}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Profile"
          className="absolute right-0 mt-2 w-64 rounded-xl p-1 z-40 overflow-hidden"
          style={{
            background: "var(--pc-surface)",
            border: "1px solid var(--pc-border)",
            boxShadow: "0 20px 48px -18px color-mix(in oklab, var(--pc-ink) 40%, transparent)",
          }}
        >
          <div className="px-2.5 py-2">
            <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
              Signed in as
            </div>
            <div className="text-[12.5px] mt-0.5 truncate" style={{ color: "var(--pc-ink)" }}>{maskEmail(email)}</div>
            {college?.shortName && (
              <div className="text-[10.5px] mt-0.5" style={{ color: "var(--pc-muted)" }}>{college.shortName}</div>
            )}
          </div>
          <div className="h-px my-1" style={{ background: "var(--pc-border)" }} />
          <ul>
            {items.map((it, i) => {
              if (it.kind === "divider") {
                return <li key={`d-${i}`} className="h-px my-1" style={{ background: "var(--pc-border)" }} aria-hidden />;
              }
              const focused = focusIdx === i;
              const commonStyle: React.CSSProperties = {
                color: it.kind === "action" && it.tone === "danger" ? "var(--pc-danger, var(--pc-accent-2))" : "var(--pc-ink-2)",
                background: focused ? "var(--pc-surface2)" : "transparent",
              };
              const cls = "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12.5px] hover:bg-[color:var(--pc-surface2)] focus-visible:outline-none";
              if (it.kind === "link") {
                const Icon = it.icon;
                return (
                  <li key={it.label} role="none">
                    <Link
                      role="menuitem"
                      to={it.to}
                      onClick={() => setOpen(false)}
                      onFocus={() => setFocusIdx(i)}
                      className={cls}
                      style={commonStyle}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              }
              const Icon = it.icon;
              return (
                <li key={it.label} role="none">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={it.onClick}
                    onFocus={() => setFocusIdx(i)}
                    className={cls + " w-full text-left"}
                    style={commonStyle}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{it.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
