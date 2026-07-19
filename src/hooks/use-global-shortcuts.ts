import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { NAV_SEQUENCES } from "@/lib/keyboard-map";

function isEditable(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((node as HTMLElement).isContentEditable) return true;
  return false;
}

export function useGlobalShortcuts({ onHelp }: { onHelp?: () => void } = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    let buffer = "";
    let bufferTimer: number | undefined;

    const clearBuffer = () => {
      buffer = "";
      if (bufferTimer) window.clearTimeout(bufferTimer);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        onHelp?.();
        return;
      }
      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>(
          '[data-role="sidebar-search"] input, [data-role="page-filter"] input'
        );
        if (search) {
          e.preventDefault();
          search.focus();
        }
        return;
      }

      if (/^[a-z]$/i.test(e.key)) {
        buffer += e.key.toLowerCase();
        if (bufferTimer) window.clearTimeout(bufferTimer);
        bufferTimer = window.setTimeout(clearBuffer, 900);

        if (buffer === "gp") {
          e.preventDefault();
          clearBuffer();
          window.dispatchEvent(new CustomEvent("pcc:open-profile"));
          return;
        }
        const target = NAV_SEQUENCES[buffer];
        if (target) {
          e.preventDefault();
          clearBuffer();
          navigate({ to: target });
        } else if (buffer.length >= 3) {
          clearBuffer();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (bufferTimer) window.clearTimeout(bufferTimer);
    };
  }, [navigate, onHelp]);
}
