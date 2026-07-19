// Right-column signal alerts feed. Each row is an aggregate anomaly with
// a deep link that applies filters on the parent page. No student
// identifiers ever appear here.
import { getAlerts } from "@/lib/signals-selectors";
import { AlertRow } from "@/components/primitives/AlertRow";
import type { SignalAlert } from "@/lib/dashboard-mock.signals";

export function SignalAlertsFeed({
  onOpen,
}: {
  onOpen: (a: SignalAlert) => void;
}) {
  const alerts = getAlerts();
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <AlertRow
          key={a.id}
          severity={a.severity}
          headline={a.headline}
          sub={a.sub}
          sparkline={a.sparkline}
          onOpen={() => onOpen(a)}
        />
      ))}
    </div>
  );
}
