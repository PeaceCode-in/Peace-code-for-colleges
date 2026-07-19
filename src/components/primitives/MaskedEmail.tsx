// Masks a full email address for display. A "Reveal" button on hover
// exposes the full string and calls onReveal (which typically writes an
// audit row). Re-clicking re-masks without another audit write.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 1) return `${local}****@${domain}`;
  return `${local[0]}****@${domain}`;
}

export function MaskedEmail({
  email,
  allowReveal = false,
  onReveal,
  className = "",
}: {
  email: string;
  allowReveal?: boolean;
  onReveal?: () => void;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const handleClick = () => {
    if (!allowReveal) return;
    if (!revealed) onReveal?.();
    setRevealed((r) => !r);
  };
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="tabular-nums text-[12.5px]"
        style={{ color: "var(--pc-ink)" }}
        aria-label={revealed ? "email revealed" : "email masked"}
      >
        {revealed ? email : maskEmail(email)}
      </span>
      {allowReveal && (
        <button
          type="button"
          onClick={handleClick}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          style={{ color: "var(--pc-muted)" }}
          title={revealed ? "Hide email" : "Reveal email (audited)"}
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );
}
