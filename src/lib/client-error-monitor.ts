// Client-side runtime error monitor.
// Pipes unhandled errors and promise rejections to the Lovable monitoring hook
// (window.__lovableEvents?.captureException) and keeps a small rolling buffer
// in sessionStorage so hydration + runtime issues in production can be inspected.

declare global {
  interface Window {
    __pcMonitorInstalled?: boolean;
  }
}

const BUFFER_KEY = "peacecode.errors.v1";
const MAX_ENTRIES = 25;

function pushBuffer(entry: Record<string, unknown>) {
  try {
    const raw = sessionStorage.getItem(BUFFER_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push(entry);
    while (list.length > MAX_ENTRIES) list.shift();
    sessionStorage.setItem(BUFFER_KEY, JSON.stringify(list));
  } catch {
    /* storage may be unavailable */
  }
}

function serialize(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  try {
    return { message: String(err) };
  } catch {
    return { message: "unknown error" };
  }
}

type Mechanism = "onerror" | "unhandledrejection" | "manual";
function report(error: unknown, mechanism: Mechanism) {
  const payload = {
    ...serialize(error),
    mechanism,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    at: Date.now(),
  };
  pushBuffer(payload);
  try {
    window.__lovableEvents?.captureException?.(
      error,
      { source: "client_monitor", route: payload.route },
      { mechanism, handled: false, severity: "error" },
    );
  } catch {
    /* monitor never throws */
  }
}

export function installClientErrorMonitor() {
  if (typeof window === "undefined") return;
  if (window.__pcMonitorInstalled) return;
  window.__pcMonitorInstalled = true;

  window.addEventListener("error", (event) => {
    report(event.error ?? event.message ?? event, "onerror");
  });
  window.addEventListener("unhandledrejection", (event) => {
    report((event as PromiseRejectionEvent).reason, "unhandledrejection");
  });

  // Watch React hydration / render errors that only reach console.error.
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    try {
      const first = args[0];
      const message = typeof first === "string" ? first : "";
      if (message.includes("Hydration") || message.includes("hydrat")) {
        report(new Error(message || "hydration warning"), "manual");
      }
    } catch {
      /* never throw from monitor */
    }
    originalConsoleError.apply(console, args as []);
  };
}

export function readErrorBuffer(): unknown[] {
  try {
    const raw = sessionStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}
