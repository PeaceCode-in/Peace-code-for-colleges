import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Building2, Check, Eye, EyeOff, GraduationCap, IdCard, Lock, Mail, Sparkles, UserRound } from "lucide-react";
import { AuthShell, FieldLabel, GlassInput, GlassSelect, PrimaryButton } from "@/components/auth/AuthShell";
import { clearDraft, createUser, isCollegeEmail, isRegistered, loadDraft, saveDraft, startSession } from "@/lib/auth-store";

export const Route = createFileRoute("/auth/signup")({
  component: SignupFlow,
});

type Step = 1 | 2 | 3 | 4;

const CONCERNS = [
  { id: "stress",   label: "Exam stress & burnout" },
  { id: "sleep",    label: "Sleep & rest" },
  { id: "anxiety",  label: "Anxious thoughts" },
  { id: "focus",    label: "Focus & motivation" },
  { id: "lonely",   label: "Feeling isolated" },
  { id: "growth",   label: "Just growing gently" },
];

const YEARS = ["Foundation", "1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgrad", "PhD"];

function SignupFlow() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Form state — hydrated from draft
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState(YEARS[1]);
  const [concern, setConcern] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = loadDraft();
    if (!d.email) { nav({ to: "/auth" }); return; }
    if (isRegistered(d.email)) { nav({ to: "/auth/login" }); return; }
    setEmail(d.email);
    setFullName(d.fullName ?? "");
    setStudentId(d.studentId ?? "");
    setCollege(d.college ?? "");
    setCourse(d.course ?? "");
    setYear(d.year ?? YEARS[1]);
    setConcern(d.concern ?? "");
  }, [nav]);

  const persist = (patch: Record<string, unknown>) => saveDraft({ ...loadDraft(), ...patch });

  const totalSteps = 4;
  const stepLabel = ["About you", "Your college", "What brings you", "Set a password"][step - 1];

  const canNext = useMemo(() => {
    if (step === 1) return fullName.trim().length >= 2 && studentId.trim().length >= 3 && isCollegeEmail(email).ok;
    if (step === 2) return college.trim().length >= 2 && course.trim().length >= 2 && !!year;
    if (step === 3) return !!concern;
    if (step === 4) return password.length >= 8 && password === confirm;
    return false;
  }, [step, fullName, studentId, email, college, course, year, concern, password, confirm]);

  const next = () => {
    setError(null);
    if (!canNext) {
      if (step === 4 && password.length < 8) setError("Password should be at least 8 characters.");
      else if (step === 4 && password !== confirm) setError("Passwords don't match yet.");
      else setError("Please complete this step to continue.");
      return;
    }
    if (step < 4) {
      // persist step data
      if (step === 1) persist({ fullName, studentId, email });
      if (step === 2) persist({ college, course, year });
      if (step === 3) persist({ concern });
      setStep((s) => (s + 1) as Step);
    } else {
      setBusy(true);
      setTimeout(() => {
        createUser({ email, fullName, studentId, college, course, year, concern, password });
        startSession(email);
        clearDraft();
        nav({ to: "/" });
      }, 500);
    }
  };

  const back = () => {
    setError(null);
    if (step === 1) nav({ to: "/auth" });
    else setStep((s) => (s - 1) as Step);
  };

  return (
    <AuthShell
      eyebrow="A gentle beginning"
      title={step === 1 ? "Let's meet" : step === 2 ? "Where you" : step === 3 ? "What brings you" : "One last"}
      titleAccent={step === 1 ? "properly." : step === 2 ? "study." : step === 3 ? "here?" : "step."}
      subtitle={
        step === 1 ? "A few soft details so Peace Code can hold space for you." :
        step === 2 ? "So we can tailor rooms, events, and counsellors near your campus." :
        step === 3 ? "There's no wrong answer. You can change this any time." :
        "A private key to your sanctuary. Keep it somewhere kind."
      }
      step={step}
      totalSteps={totalSteps}
      stepLabel={stepLabel}
    >
      {step === 1 && (
        <>
          <div>
            <FieldLabel>Full name</FieldLabel>
            <GlassInput icon={<UserRound className="w-4 h-4" strokeWidth={1.7} />} placeholder="Jai Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Student ID / roll number</FieldLabel>
            <GlassInput icon={<IdCard className="w-4 h-4" strokeWidth={1.7} />} placeholder="e.g. 2023BCS021" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>
          <div>
            <FieldLabel hint="Only college emails — no personal accounts.">College email</FieldLabel>
            <GlassInput icon={<Mail className="w-4 h-4" strokeWidth={1.7} />} type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <FieldLabel>College / University name</FieldLabel>
            <GlassInput icon={<Building2 className="w-4 h-4" strokeWidth={1.7} />} placeholder="e.g. Delhi University" value={college} onChange={(e) => setCollege(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Course / stream</FieldLabel>
            <GlassInput icon={<BookOpen className="w-4 h-4" strokeWidth={1.7} />} placeholder="e.g. B.Tech CSE" value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Year of study</FieldLabel>
            <GlassSelect icon={<GraduationCap className="w-4 h-4" strokeWidth={1.7} />} value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </GlassSelect>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="grid grid-cols-2 gap-2.5">
          {CONCERNS.map((c) => {
            const active = concern === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setConcern(c.id)}
                className="text-left rounded-2xl px-4 py-3.5 transition"
                style={{
                  background: active ? "rgba(176,106,60,0.12)" : "rgba(255,255,255,0.55)",
                  border: `1px solid ${active ? "#8a4a26" : "rgba(255,255,255,0.85)"}`,
                  color: "#2b1d14",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-semibold leading-snug">{c.label}</span>
                  {active && <Check className="w-4 h-4 shrink-0" style={{ color: "#8a4a26" }} />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step === 4 && (
        <>
          <div>
            <FieldLabel hint="At least 8 characters. Mix words that mean something to you.">Create a password</FieldLabel>
            <div className="relative">
              <GlassInput icon={<Lock className="w-4 h-4" strokeWidth={1.7} />} type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/60 transition" style={{ color: "#8a4a26" }} aria-label="Toggle password visibility">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <FieldLabel>Confirm password</FieldLabel>
            <GlassInput icon={<Sparkles className="w-4 h-4" strokeWidth={1.7} />} type={showPw ? "text" : "password"} placeholder="••••••••" value={confirm} onChange={(e) => { setConfirm(e.target.value); if (error) setError(null); }} />
          </div>
        </>
      )}

      {error && <div className="text-[12px]" style={{ color: "#a24a30" }}>{error}</div>}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={back}
          className="h-[52px] px-5 rounded-2xl flex items-center gap-2 text-[13.5px] transition hover:bg-white/60"
          style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.75)", color: "#2b1d14" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <PrimaryButton onClick={next} disabled={busy || !canNext}>
            <span className="inline-flex items-center justify-center gap-2">
              {step === 4 ? (busy ? "Creating your space…" : "Enter Peace Code") : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </span>
          </PrimaryButton>
        </div>
      </div>

      <Link to="/auth" className="text-center text-[12.5px] -mt-2" style={{ color: "#7d5a44" }}>
        Use a different email
      </Link>
    </AuthShell>
  );
}
