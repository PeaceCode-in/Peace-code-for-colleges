import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthShell, FieldLabel, GlassInput, InlineFeedback, PrimaryButton } from "@/components/auth/AuthShell";
import { findUser, loadDraft, startSession, verifyPassword } from "@/lib/auth-store";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("there");

  useEffect(() => {
    const e = (loadDraft().email ?? "").trim().toLowerCase();
    if (!e) { nav({ to: "/auth" }); return; }
    setEmail(e);
    const u = findUser(e);
    if (u?.fullName) setName(u.fullName.split(" ")[0]);
  }, [nav]);

  const submit = () => {
    setError(null);
    setSuccess(null);
    if (!password) { setError("Please enter your password."); return; }
    setBusy(true);
    setTimeout(() => {
      if (verifyPassword(email, password)) {
        startSession(email);
        setSuccess("Welcome back. Taking you home…");
        setTimeout(() => nav({ to: "/" }), 700);
      } else {
        setError("That password doesn't match. Try again, gently.");
        setBusy(false);
      }
    }, 350);
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Return to"
      titleAccent="stillness."
      subtitle={`Good to see you again, ${name}. Take a slow breath — then continue where you left off.`}
      step={2}
      totalSteps={2}
      stepLabel="Password"
    >
      <div>
        <FieldLabel>Your email</FieldLabel>
        <GlassInput icon={<Mail className="w-4 h-4" strokeWidth={1.7} />} value={email} readOnly />
      </div>

      <div>
        <FieldLabel hint="Type it in — we'll keep it private.">Enter your password</FieldLabel>
        <div className="relative">
          <GlassInput
            icon={<Lock className="w-4 h-4" strokeWidth={1.7} />}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/60 transition"
            style={{ color: "#1e3a8a" }}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <InlineFeedback kind="error">{error}</InlineFeedback>}
        {success && <InlineFeedback kind="success">{success}</InlineFeedback>}
      </div>

      <div className="flex items-center justify-between text-[12.5px]">
        <Link to="/auth" className="hover:underline" style={{ color: "#5a4030" }}>Not you? Use a different email</Link>
        <button type="button" className="hover:underline" style={{ color: "#1e3a8a" }} onClick={() => setError("Reach out at care@peacecode.in — we'll gently help you back in.")}>
          Forgot password?
        </button>
      </div>

      <PrimaryButton onClick={submit} disabled={busy}>
        <span className="inline-flex items-center justify-center gap-2">
          {busy ? (success ? "Signed in ✓" : "Signing in…") : "Sign in"} <ArrowRight className="w-4 h-4" />
        </span>
      </PrimaryButton>
    </AuthShell>
  );
}
