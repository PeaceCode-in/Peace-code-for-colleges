import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/e2e/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:8080"

RESULTS: list[dict] = []

def rec(name: str, ok: bool, detail: str = ""):
    RESULTS.append({"name": name, "ok": ok, "detail": detail})
    print(f"[{'PASS' if ok else 'FAIL'}] {name} {detail}")

async def dismiss_auth(page):
    # If we land on /auth, click Skip / continue as guest.
    if "/auth" in page.url:
        for sel in ["text=Skip", "text=Continue as guest", "text=guest", "text=Continue"]:
            try:
                loc = page.locator(sel).first
                if await loc.count() and await loc.is_visible():
                    await loc.click()
                    await page.wait_for_load_state("domcontentloaded")
                    break
            except Exception:
                pass

async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()

        console_errors: list[str] = []
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        # 1. Home / auth loads
        try:
            await page.goto(BASE + "/", wait_until="domcontentloaded", timeout=15000)
            await dismiss_auth(page)
            await page.wait_for_load_state("networkidle", timeout=8000)
            await page.screenshot(path=str(SCREENSHOTS / "1_dashboard.png"))
            rec("dashboard loads", "/" == "/" and page.url.startswith(BASE), page.url)
        except Exception as e:
            rec("dashboard loads", False, str(e))

        # 2. Logo navigation — clicking sidebar/header logo should stay on / or go home
        try:
            logo = page.get_by_role("link", name="PeaceCode").first
            if not await logo.count():
                logo = page.locator('a[href="/"]').first
            await logo.click()
            await page.wait_for_load_state("domcontentloaded")
            rec("logo → home", page.url.rstrip("/") == BASE, page.url)
        except Exception as e:
            rec("logo → home", False, str(e))

        # 3. Section switching — navigate to key routes via direct nav (independent of viewport-specific nav UI)
        sections = ["/breathe", "/journal", "/community", "/counselling", "/focus", "/profile", "/settings"]
        for route in sections:
            try:
                await page.goto(BASE + route, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_load_state("networkidle", timeout=6000)
                # Basic assertion: a <main> or heading is present.
                has_main = await page.locator("main, h1, h2").first.count() > 0
                rec(f"nav {route}", has_main and page.url.endswith(route), page.url)
                await page.screenshot(path=str(SCREENSHOTS / f"route_{route.strip('/').replace('/', '_')}.png"))
            except Exception as e:
                rec(f"nav {route}", False, str(e))

        # 4. Sidebar link click (dashboard section switching via UI)
        try:
            await page.goto(BASE + "/", wait_until="domcontentloaded")
            await dismiss_auth(page)
            link = page.locator('a[aria-label="Breathe"], a[href="/breathe"]').first
            await link.click(timeout=5000)
            await page.wait_for_load_state("domcontentloaded")
            rec("sidebar click → /breathe", "/breathe" in page.url, page.url)
        except Exception as e:
            rec("sidebar click → /breathe", False, str(e))

        # 5. No runtime page errors
        rec("no runtime pageerrors", not any("pageerror" in c for c in console_errors),
            "; ".join(c for c in console_errors if "pageerror" in c)[:200])

        await browser.close()

    failed = [r for r in RESULTS if not r["ok"]]
    print(f"\nSummary: {len(RESULTS) - len(failed)}/{len(RESULTS)} passed")
    return 1 if failed else 0

sys.exit(asyncio.run(main()))
