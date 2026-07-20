import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import {
  AuthShell,
  FieldLabel,
  GlassInput,
  InlineFeedback,
  PrimaryButton,
} from "@/components/auth/AuthShell";
import { isInstitutionEmail, startSession } from "@/lib/auth-store";
import { setCollegeFromEmail } from "@/lib/college-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PeaceCode for Colleges" },
      {
        name: "description",
        content:
          "Sign in with your institution email to view your college's anonymized wellbeing dashboard.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setError(null);
    const check = isInstitutionEmail(email);
    if (!check.ok) { setError(check.reason ?? "Invalid email."); return; }
    const college = setCollegeFromEmail(email);
    if (!college) {
      setError("This email isn't linked to a partner institution. Contact partnerships@peacecode.in.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      startSession(email);
      nav({ to: "/dashboard" });
    }, 250);
  };

  return (
    <AuthShell
      eyebrow="For tied-up institutions"
      title="Sign in to your"
      titleAccent="campus dashboard."
      subtitle="Aggregate insights for your counselling cell. Individual student data is never shown."
    >
      <a
        href="https://peacecode.in"
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] backdrop-blur transition hover:-translate-x-0.5"
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(125,90,68,0.22)",
          color: "#5a4230",
          boxShadow: "0 4px 14px -6px rgba(125,90,68,0.25)",
        }}
        aria-label="Go back to peacecode.in"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        Go back
      </a>
      <div>
        <FieldLabel hint="Access is granted per institution. If your college isn't onboarded yet, email hello@peacecode.in.">
          Institutional email
        </FieldLabel>
        <GlassInput
          icon={<Mail className="w-4 h-4" strokeWidth={1.7} />}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="admin@iitb.ac.in"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <p className="text-[11px] mt-1.5" style={{ color: "#8a7360" }}>
          Use the email your college was provisioned with. Personal Gmail/Yahoo accounts cannot access institutional dashboards.
        </p>
        {error && <InlineFeedback kind="error">{error}</InlineFeedback>}
      </div>

      <PrimaryButton onClick={submit} disabled={busy}>
        <span className="inline-flex items-center justify-center gap-2">
          {busy ? "Signing in…" : "Sign in"} <ArrowRight className="w-4 h-4" />
        </span>
      </PrimaryButton>

      <button
        type="button"
        onClick={() => {
          const guestEmail = "guest@iitb.ac.in";
          setCollegeFromEmail(guestEmail);
          startSession(guestEmail);
          nav({ to: "/dashboard" });
        }}
        className="mx-auto mt-1 block text-[11.5px] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 rounded"
        style={{ color: "#7d5a44" }}
      >
        Continue as guest (demo, IIT Bombay)
      </button>

      <p
        className="text-center text-[11.5px] leading-relaxed mt-1"
        style={{ color: "#7d5a44" }}
      >
        Aggregate insights only. No individual student is ever identifiable. DPDP-compliant by design.
      </p>
    </AuthShell>
  );
}
