import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { LogOut, X } from "lucide-react";
import { endSession } from "@/lib/auth-store";

export const Route = createFileRoute("/settings/logout")({
  head: () => ({ meta: [{ title: "Sign out — PeaceCode" }] }),
  component: LogoutSheet,
});

const { surface, surface2, border, ink, muted, primary } = palette;

function LogoutSheet() {
  const nav = useNavigate();
  const doLogout = () => {
    try { sessionStorage.clear(); } catch {}
    endSession();
    nav({ to: "/auth", replace: true });
  };
  const doAll = () => {
    try { sessionStorage.clear(); } catch {}
    endSession();
    nav({ to: "/auth", replace: true });
  };


  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden animate-rise" style={{ background: surface, border: `1px solid ${border}`, boxShadow: "0 30px 80px -30px rgba(0,0,0,0.3)" }}>
        <Link to="/settings" className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="close"><X className="w-3.5 h-3.5" /></Link>
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--pc-surface2)", color: primary }}>
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-[24px] leading-tight" style={{ color: ink }}>Sign out for now?</h1>
          <p className="text-[13px] mt-2" style={{ color: muted }}>Your data stays right here — you can pick up where you left off anytime.</p>
        </div>
        <div className="px-6 pb-6 space-y-2">
          <button onClick={doLogout} className="w-full py-3 rounded-2xl text-[13px] text-white transition hover:-translate-y-[1px]" style={{ background: primary }}>Log out of this device</button>
          <button onClick={doAll} className="w-full py-3 rounded-2xl text-[13px]" style={{ background: surface2, color: ink }}>Log out of all devices</button>
          <Link to="/settings" className="block w-full py-3 rounded-2xl text-[13px] text-center" style={{ color: muted }}>Cancel</Link>
        </div>
      </div>
    </main>
  );
}
