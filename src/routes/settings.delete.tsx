import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export const Route = createFileRoute("/settings/delete")({
  head: () => ({ meta: [{ title: "Delete account — PeaceCode" }] }),
  component: DeletePage,
});

const { surface, surface2, border, ink, muted } = palette;
const DANGER = "#B54848";
const CONFIRM_PHRASE = "delete my account";

function DeletePage() {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const nav = useNavigate();

  const exportFirst = () => {
    const dump: Record<string, unknown> = {};
    for (const k of Object.keys(localStorage)) if (k.startsWith("peacecode.")) { try { dump[k] = JSON.parse(localStorage.getItem(k) || "null"); } catch { dump[k] = localStorage.getItem(k); } }
    const b = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "peacecode-full-export.json"; a.click();
  };

  const finalDelete = () => {
    for (const k of Object.keys(localStorage)) if (k.startsWith("peacecode.")) localStorage.removeItem(k);
    alert("Account deleted. We'll miss you.");
    nav({ to: "/" });
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden animate-rise" style={{ background: surface, border: `1px solid ${border}` }}>
        <Link to="/settings/privacy" className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2 }}><X className="w-3.5 h-3.5" /></Link>
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FCE8EC", color: DANGER }}>
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-[24px] leading-tight" style={{ color: ink }}>Delete your account</h1>
          <p className="text-[13px] mt-2" style={{ color: muted }}>Step {step} of 3 · this can't be undone.</p>
        </div>

        <div className="px-8 pb-8">
          {step === 1 && (
            <div>
              <p className="text-[13.5px] mb-4" style={{ color: ink }}>Everything will be erased: journals, screenings, memories, buddy chats. Consider exporting first.</p>
              <div className="space-y-2">
                <button onClick={exportFirst} className="w-full py-3 rounded-2xl text-[13px]" style={{ background: surface2, color: ink }}>Export everything first</button>
                <button onClick={() => setStep(2)} className="w-full py-3 rounded-2xl text-[13px] text-white" style={{ background: DANGER }}>Continue anyway</button>
                <Link to="/settings/privacy" className="block w-full py-3 rounded-2xl text-[13px] text-center" style={{ color: muted }}>Cancel</Link>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="text-[12px]" style={{ color: muted }}>Confirm your password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-[13px] outline-none" style={{ background: surface2, color: ink }} />
              <button onClick={() => password ? setStep(3) : alert("Password required.")} className="w-full mt-4 py-3 rounded-2xl text-[13px] text-white" style={{ background: DANGER }}>Continue</button>
              <button onClick={() => setStep(1)} className="w-full mt-2 py-2 rounded-2xl text-[12px]" style={{ color: muted }}>Back</button>
            </div>
          )}
          {step === 3 && (
            <div>
              <label className="text-[12px]" style={{ color: muted }}>Type <span style={{ color: DANGER }}>“{CONFIRM_PHRASE}”</span> to confirm</label>
              <input value={phrase} onChange={(e) => setPhrase(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-[13px] outline-none" style={{ background: surface2, color: ink }} />
              <button onClick={() => phrase.trim().toLowerCase() === CONFIRM_PHRASE ? finalDelete() : alert("Phrase didn't match.")}
                className="w-full mt-4 py-3 rounded-2xl text-[13px] text-white" style={{ background: DANGER }}>Delete forever</button>
              <button onClick={() => setStep(2)} className="w-full mt-2 py-2 rounded-2xl text-[12px]" style={{ color: muted }}>Back</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
