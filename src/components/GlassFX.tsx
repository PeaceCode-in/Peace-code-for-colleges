import { useEffect } from "react";

/**
 * Global backdrop hook.
 *
 * The actual look — gradients, grain, ink tokens — lives in `src/styles.css`
 * under `html[data-pc-bg="<theme>"]`. This component only ensures a
 * background theme attribute exists before settings-store applies.
 */
export function GlassFX() {
  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute("data-pc-glass");
    if (!root.getAttribute("data-pc-bg")) {
      try {
        const raw = localStorage.getItem("peacecode.settings.v1");
        const parsed = raw ? JSON.parse(raw) : null;
        root.setAttribute("data-pc-bg", parsed?.appearance?.bgTheme || "sakura");
      } catch {
        root.setAttribute("data-pc-bg", "sakura");
      }
    }
  }, []);
  return null;
}
