import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Mail, Sparkles, UserRound } from "lucide-react";
import { AuthShell, FieldLabel, GhostRow, GlassInput, InlineFeedback, PrimaryButton } from "@/components/auth/AuthShell";
import { isCollegeEmail, isRegistered, saveDraft, loadDraft, endSession } from "@/lib/auth-store";
import { resetProfile } from "@/lib/profile-store";

export const Route = createFileRoute("/auth/")({
  component: EmailEntry,
});

function EmailEntry() {
  const nav = useNavigate();
  const [email, setEmail] = useState(() => loadDraft().email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onContinue = () => {
    setError(null);
    const check = isCollegeEmail(email);
    if (!check.ok) { setError(check.reason ?? "Invalid email."); return; }
    setBusy(true);
    // small delay for feedback
    setTimeout(() => {
      const registered = isRegistered(email);
      saveDraft({ ...loadDraft(), email: email.trim().toLowerCase() });
      if (registered) nav({ to: "/auth/login" });
      else nav({ to: "/auth/signup" });
    }, 300);
  };

  return (
    <AuthShell
      eyebrow="A quiet beginning"
      title="Find your"
      titleAccent="inner peace."
      subtitle="A sanctuary to pause, breathe, and reconnect with your true self."
      step={1}
      totalSteps={2}
      stepLabel="Email"
    >
      <div>
        <FieldLabel hint="We'll send you to the next step based on your registration status.">
          Enter your student email ID
        </FieldLabel>
        <GlassInput
          icon={<Mail className="w-4 h-4" strokeWidth={1.7} />}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@university.edu"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && onContinue()}
        />
        {error && <InlineFeedback kind="error">{error}</InlineFeedback>}
      </div>

      <div className="flex flex-col gap-2.5">
        <GhostRow icon={<UserRound className="w-4 h-4" strokeWidth={1.7} />} title="Already registered?" subtitle="You'll be redirected to the login page." />
        <GhostRow icon={<Sparkles className="w-4 h-4" strokeWidth={1.7} />} title="New here?" subtitle="You'll be guided through a quick sign up." />
      </div>

      <PrimaryButton onClick={onContinue} disabled={busy || !email}>
        <span className="inline-flex items-center justify-center gap-2">
          {busy ? "Checking…" : "Continue"} <ArrowRight className="w-4 h-4" />
        </span>
      </PrimaryButton>

      <button
        type="button"
        onClick={() => {
          endSession();
          resetProfile();
          if (typeof window !== "undefined") localStorage.setItem("pc.auth.guest", "1");
          nav({ to: "/" });
        }}
        className="text-center text-[12.5px] -mt-2 hover:underline transition"
        style={{ color: "#7d5a44" }}
      >
        Skip for now · continue as Guest
      </button>
    </AuthShell>
  );
}
