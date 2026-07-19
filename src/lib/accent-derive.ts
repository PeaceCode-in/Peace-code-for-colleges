// Derive a small chart scale from the active accent. The applier sets
// --pc-primary / --pc-accent / --pc-accent-2. This helper builds a
// pure-function view for chart series that need a third stop and a soft
// tint without cross-tinting the token layer.
export type AccentScale = {
  a1: string; // primary series
  a2: string; // secondary
  a3: string; // tertiary / muted
  soft: string; // area fill / soft background
};

// Convert #RRGGBB to HSL and back, so we can shift lightness deterministically.
function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{2}/g)?.map((h) => parseInt(h, 16) / 255) ?? [0, 0, 0];
  const [r, g, b] = m;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslCss(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, ${a})`;
}

export function deriveAccentScale(accentHex: string): AccentScale {
  const [h, s, l] = hexToHsl(accentHex);
  return {
    a1: hslCss(h, s, l),
    a2: hslCss((h + 28) % 360, Math.min(90, s + 6), Math.min(72, l + 12)),
    a3: hslCss((h + 210) % 360, Math.max(18, s - 20), Math.min(70, l + 8)),
    soft: hslCss(h, Math.max(20, s - 10), Math.min(94, l + 32), 0.22),
  };
}
