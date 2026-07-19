import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import {
  AuthShell,
  FieldLabel,
  GlassInput,
  InlineFeedback,
  PrimaryButton,
} from "@/components/auth/AuthShell";
import { isInstitutionEmail, startSession } from "@/lib/auth-store";

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
      { property: "og:title", content: "Sign in — PeaceCode for Colleges" },
      {
        property: "og:description",
        content:
          "The institutional admin dashboard for colleges partnered with PeaceCode.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setError(null);
    setInfo(null);
    const check = isInstitutionEmail(email);
    if (!check.ok) {
      setError(check.reason ?? "Invalid email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setBusy(true);
    // Placeholder — real auth wires in via Lovable Cloud later.
    setTimeout(() => {
      startSession(email);
      nav({ to: "/" });
    }, 350);
  };

  return (
    <AuthShell
      eyebrow="PeaceCode for Colleges"
      title="Welcome"
      titleAccent="back."
      subtitle="Sign in with your institution email to view your college's anonymized wellbeing dashboard."
    >
      <div>
        <FieldLabel hint="Access is granted per institution. If your college isn't onboarded yet, email hello@peacecode.in.">
          Institution email
        </FieldLabel>
        <GlassInput
          icon={<Mail className="w-4 h-4" strokeWidth={1.7} />}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="admin@yourcollege.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      <div>
        <FieldLabel>Password</FieldLabel>
        <GlassInput
          icon={<Lock className="w-4 h-4" strokeWidth={1.7} />}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <InlineFeedback kind="error">{error}</InlineFeedback>}
        {info && <InlineFeedback kind="success">{info}</InlineFeedback>}
      </div>

      <div className="flex items-center justify-end text-[12.5px]">
        <button
          type="button"
          className="hover:underline"
          style={{ color: "#1e3a8a" }}
          onClick={() =>
            setInfo(
              "Reach out to hello@peacecode.in — we'll help your institution admin regain access.",
            )
          }
        >
          Forgot password?
        </button>
      </div>

      <PrimaryButton onClick={submit} disabled={busy}>
        <span className="inline-flex items-center justify-center gap-2">
          {busy ? "Signing in…" : "Sign in"} <ArrowRight className="w-4 h-4" />
        </span>
      </PrimaryButton>

      <p
        className="text-center text-[11.5px] leading-relaxed mt-1"
        style={{ color: "#7d5a44" }}
      >
        Aggregate insights only. No individual student is ever identifiable. DPDP-compliant by design.
      </p>
    </AuthShell>
  );
}
