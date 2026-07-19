/**
 * verify-sidebar-routes.ts
 *
 * Reads the sidebar item table and asserts every `to` URL resolves to a
 * route registered in src/routeTree.gen.ts. Fails loud if any link is dead.
 *
 * Usage: bun run verify:sidebar
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname ?? ".", "..");
const SIDEBAR = resolve(ROOT, "src/components/college/AppSidebar.tsx");
const ROUTE_TREE = resolve(ROOT, "src/routeTree.gen.ts");

const sidebar = readFileSync(SIDEBAR, "utf8");
const tree = readFileSync(ROUTE_TREE, "utf8");

// Extract every url: "..." from the sidebar's SIDEBAR_GROUPS constant.
const urlRe = /url:\s*"([^"]+)"/g;
const urls = new Set<string>();
for (const m of sidebar.matchAll(urlRe)) urls.add(m[1]!);

if (urls.size === 0) {
  console.error("❌ No sidebar items found — did the AppSidebar layout change?");
  process.exit(1);
}

// The generated route tree registers each path as a string literal in the
// route-manifest, e.g. '"/dashboard": ...' or 'path: "/care/routing"'.
const missing: string[] = [];
for (const url of urls) {
  if (!tree.includes(`"${url}"`) && !tree.includes(`'${url}'`)) missing.push(url);
}

if (missing.length) {
  console.error("❌ Sidebar links without a matching route file:\n");
  for (const u of missing) console.error("   • " + u);
  console.error(
    "\nCreate a route file under src/routes/ for each URL above, then rerun.",
  );
  process.exit(1);
}

console.log(`✓ All ${urls.size} sidebar links resolve to registered routes.`);
