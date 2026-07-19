import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import wordmarkUrl from "@/assets/img/peacecode-wordmark.png";
import skyBgUrl from "@/assets/img/auth-sky-cranes.jpg";
const wordmark = { url: wordmarkUrl };
const skyBg = { url: skyBgUrl };

/**
 * AuthShell — single-viewport frosted glass card centered on a full-bleed
 * grainy sky-and-cranes backdrop. Warm amber ink over a navy CTA.
 */

const INK = "#2b1d14";
const INK_SOFT = "#5a4030";
const MUTED = "#7d5a44";
// Primary CTA — deep navy per brand spec.
const ACCENT = "#1e3a8a";
const ACCENT_DEEP = "#152a63";
const ACCENT_SOFT = "rgba(30,58,138,0.18)";

export const authPalette = { ink: INK, inkSoft: INK_SOFT, muted: MUTED, accent: ACCENT, accentDeep: ACCENT_DEEP };

export function AuthShell({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  children,
  step,
  totalSteps,
  stepLabel,
}: {
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  children: ReactNode;
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
}) {
  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes pc-logo-breathe {
          0%,100% { transform: translateY(0) scale(1); filter: drop-shadow(0 2px 8px rgba(30,58,138,0.15)); }
          50%     { transform: translateY(-1.5px) scale(1.012); filter: drop-shadow(0 6px 14px rgba(30,58,138,0.22)); }
        }
        @keyframes pc-logo-halo {
          0%,100% { opacity: 0.35; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.6;  transform: translate(-50%,-50%) scale(1.12); }
        }
        @keyframes pc-fb-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .pc-card-scroll::-webkit-scrollbar { display: none }
        .pc-card-scroll { scrollbar-width: none; -ms-overflow-style: none }

        .pc-field { transition: box-shadow 220ms ease, border-color 220ms ease, background 220ms ease; }
        .pc-field:focus-within {
          border-color: rgba(30,58,138,0.55) !important;
          background: rgba(255,252,247,0.9) !important;
          box-shadow:
            0 0 0 4px rgba(30,58,138,0.14),
            0 8px 22px -14px rgba(30,58,138,0.35),
            inset 0 1px 0 rgba(255,255,255,0.95) !important;
        }
        .pc-logo-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
        .pc-logo-wrap::before {
          content: ""; position: absolute; left: 50%; top: 50%;
          width: 140%; height: 220%;
          background: radial-gradient(closest-side, rgba(30,58,138,0.22), transparent 70%);
          filter: blur(14px);
          animation: pc-logo-halo 6s ease-in-out infinite;
          pointer-events: none;
        }
        .pc-logo-img { animation: pc-logo-breathe 5.5s ease-in-out infinite; }
        .pc-feedback { animation: pc-fb-in 260ms ease-out both; }
      `}</style>

      {/* Sky illustration base — softly blurred so the card feels like the hero */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -inset-8"
          style={{
            backgroundImage: `url(${skyBg.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(14px) saturate(108%)",
            transform: "scale(1.06)",
          }}
        />
      </div>
      {/* Single soft warm wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(190,205,225,0.18) 0%, rgba(240,200,170,0.22) 55%, rgba(220,170,140,0.30) 100%)",
        }}
      />
      {/* Grain / noise overlay — subtle film texture */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        aria-hidden
        style={{
          opacity: 0.55,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      <div className="hidden sm:flex absolute top-6 right-8 z-10 items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px]"
        style={{
          background: "rgba(255,248,240,0.55)",
          border: "1px solid rgba(255,255,255,0.85)",
          color: INK_SOFT,
          backdropFilter: "blur(14px)",
        }}
      >
        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.7} />
        <span className="tracking-[0.22em] uppercase">private · for students</span>
      </div>

      {/* Frosted glass card */}
      <div className="relative z-[1] w-full h-full flex items-center justify-center px-4 sm:px-6">
        <div className="relative w-full max-w-[460px]">
          <div
            className="absolute -inset-6 rounded-[36px] pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(60% 50% at 50% 30%, rgba(255,245,230,0.55), transparent 70%), radial-gradient(60% 50% at 50% 90%, rgba(30,58,138,0.18), transparent 70%)",
              filter: "blur(22px)",
            }}
          />

          <div
            className="pc-card-scroll relative rounded-[30px] overflow-hidden"
            style={{
              maxHeight: "min(92vh, 780px)",
              overflowY: "auto",
              background:
                "linear-gradient(180deg, rgba(255,252,247,0.52) 0%, rgba(250,232,216,0.30) 55%, rgba(240,220,205,0.28) 100%)",
              backdropFilter: "blur(42px) saturate(170%)",
              border: "1px solid rgba(255,255,255,0.75)",
              boxShadow:
                "0 40px 100px -40px rgba(20,30,60,0.45), 0 2px 0 rgba(255,255,255,0.6) inset, inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35)",
            }}
          >
            {/* top gloss reflection */}
            <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 55%, transparent 100%)" }} />
            {/* diagonal specular */}
            <div className="absolute inset-0 pointer-events-none opacity-60"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.12) 100%)" }} />
            {/* bottom soft shadow lip */}
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{ background: "linear-gradient(0deg, rgba(30,58,138,0.08), transparent)" }} />
            {/* etched hairline arcs */}
            <svg className="absolute -top-24 -right-24 opacity-[0.12] pointer-events-none"
              width="360" height="360" viewBox="0 0 360 360" aria-hidden>
              {[80, 130, 190, 260].map((r, i) => (
                <circle key={i} cx="260" cy="100" r={r} fill="none" stroke={ACCENT_DEEP} strokeWidth="1"
                  strokeDasharray={i % 2 ? "2 6" : "0"} />
              ))}
            </svg>

            <div className="relative px-7 sm:px-9 py-8 sm:py-10 flex flex-col gap-6">
              <div className="flex flex-col items-center gap-3 select-none">
                <span className="pc-logo-wrap">
                  <img
                    src={wordmark.url}
                    alt="Peace Code"
                    className="pc-logo-img h-9 sm:h-10 w-auto object-contain select-none relative"
                    draggable={false}
                  />
                </span>
                <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT_SOFT}, transparent)` }} />
              </div>

              <div className="flex flex-col items-center gap-2.5">
                {eyebrow && (
                  <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: MUTED }}>
                    {eyebrow}
                  </div>
                )}

                <h2
                  className="text-center leading-[1.05] tracking-[-0.01em]"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: "clamp(1.9rem, 3.6vw, 2.4rem)",
                    color: INK,
                    fontWeight: 500,
                  }}
                >
                  {title}{" "}
                  {titleAccent && (
                    <em className="italic" style={{ fontWeight: 500, color: ACCENT }}>
                      {titleAccent}
                    </em>
                  )}
                </h2>

                <p
                  className="text-center text-[13.5px] leading-relaxed max-w-[340px]"
                  style={{ color: INK_SOFT }}
                >
                  {subtitle}
                </p>
              </div>

              {step && totalSteps && (
                <div>
                  <div className="flex items-center justify-between text-[10.5px] tracking-[0.18em] uppercase mb-2"
                    style={{ color: INK }}>
                    <span className="font-semibold">Step {step} of {totalSteps}</span>
                    <span style={{ color: MUTED }}>{stepLabel}</span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(30,58,138,0.15)" }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${(step / totalSteps) * 100}%`,
                        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DEEP})`,
                      }}
                    />
                  </div>
                </div>
              )}

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-[13px] font-semibold" style={{ color: INK }}>
        {children}
      </div>
      {hint && (
        <div className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function GlassInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <label
      className="pc-field flex items-center gap-3 rounded-2xl px-4 h-[52px]"
      style={{
        background: "rgba(255,250,244,0.65)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {icon && (
        <span className="shrink-0" style={{ color: ACCENT }}>
          {icon}
        </span>
      )}
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[#b89680]"
        style={{ color: INK }}
      />
    </label>
  );
}

export function GlassSelect({
  icon,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode }) {
  return (
    <label
      className="pc-field flex items-center gap-3 rounded-2xl px-4 h-[52px]"
      style={{
        background: "rgba(255,250,244,0.65)",
        border: "1px solid rgba(255,255,255,0.9)",
      }}
    >
      {icon && (
        <span className="shrink-0" style={{ color: ACCENT }}>
          {icon}
        </span>
      )}
      <select
        {...props}
        className="flex-1 bg-transparent outline-none text-[14px] appearance-none"
        style={{ color: INK }}
      >
        {children}
      </select>
    </label>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full h-[52px] rounded-2xl text-[14.5px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
      style={{
        background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT_DEEP} 100%)`,
        color: "white",
        boxShadow:
          "0 12px 28px -14px rgba(30,58,138,0.6), inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      {children}
    </button>
  );
}

export function GhostRow({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(255,250,244,0.55)",
        border: "1px solid rgba(255,255,255,0.85)",
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.85)", color: ACCENT }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[13.5px] font-semibold" style={{ color: INK }}>
          {title}
        </div>
        <div className="text-[11.5px]" style={{ color: MUTED }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/** Inline feedback — calm, animated, never a popup. */
export function InlineFeedback({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: ReactNode;
}) {
  const palette =
    kind === "error"
      ? { bg: "rgba(162,74,48,0.10)", border: "rgba(162,74,48,0.35)", ink: "#8a3a20", Icon: AlertCircle }
      : kind === "success"
      ? { bg: "rgba(30,58,138,0.09)", border: "rgba(30,58,138,0.30)", ink: "#1e3a8a", Icon: CheckCircle2 }
      : { bg: "rgba(125,90,68,0.10)", border: "rgba(125,90,68,0.28)", ink: INK_SOFT, Icon: AlertCircle };
  const { Icon } = palette;
  return (
    <div
      className="pc-feedback mt-2 flex items-start gap-2 px-3 py-2 rounded-xl text-[12.5px]"
      role={kind === "error" ? "alert" : "status"}
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.ink,
        backdropFilter: "blur(6px)",
      }}
    >
      <Icon className="w-3.5 h-3.5 mt-[2px] shrink-0" strokeWidth={1.9} />
      <span className="leading-snug">{children}</span>
    </div>
  );
}
