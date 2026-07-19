import { AlertTriangle } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export function ErrorState({
  error,
  reset,
  title = "This view didn't load",
  className = "",
}: {
  error?: unknown;
  reset?: () => void;
  title?: string;
  className?: string;
}) {
  const router = useRouter();
  const message =
    (error instanceof Error && error.message) ||
    "Something went wrong on our end. Try again in a moment.";

  const handleRetry = () => {
    router.invalidate();
    reset?.();
  };

  return (
    <div
      role="alert"
      className={`flex flex-col items-center text-center gap-3 py-10 px-6 rounded-2xl ${className}`}
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}
    >
      <div
        className="w-12 h-12 rounded-full grid place-items-center"
        style={{ background: "var(--pc-surface2)", color: "var(--pc-warn, var(--pc-primary))" }}
      >
        <AlertTriangle aria-hidden className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[13.5px] font-medium" style={{ color: "var(--pc-ink)" }}>
          {title}
        </div>
        <div className="mt-1 text-[12px] max-w-md" style={{ color: "var(--pc-muted)" }}>
          {message}
        </div>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        className="mt-1 px-3 py-1.5 rounded-full text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
        style={{
          background: "var(--pc-primary)",
          color: "var(--pc-primary-ink, #fff)",
          boxShadow: "0 0 0 1px var(--pc-border)",
        }}
      >
        Try again
      </button>
    </div>
  );
}
