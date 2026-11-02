"""Browser smoke test. Requires Python Playwright and system Chromium."""

import os
import json
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


url = os.environ.get("GRIDS_TEST_URL", "http://127.0.0.1:5173/")
origin = urlparse(url).netloc
errors, failed_responses, remote_requests = [], [], []


def monitor(page):
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: failed_responses.append(response.url)
            if response.status >= 400 else None)
    page.on("request", lambda request: remote_requests.append(request.url)
            if urlparse(request.url).scheme in ("http", "https")
            and urlparse(request.url).netloc != origin else None)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
        headless=True,
        args=["--no-sandbox", "--enable-webgl", "--use-gl=angle",
              "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    monitor(page)
    assert page.goto(url, wait_until="networkidle").status == 200
    page.wait_for_function(
        "document.documentElement.classList.contains('has-gl') && "
        "document.querySelectorAll('.grid-entry__picture').length === 18"
    )
    # WebGL owns the textures; its DOM image placeholders intentionally have no src.
    manifest = json.loads((Path(__file__).resolve().parents[1] / "reference-assets.json").read_text())
    photographs = [asset["path"] for asset in manifest["assets"]
                   if asset["path"].endswith(".webp")]
    decoded = page.evaluate("""async paths => Promise.all(paths.map(async path => {
        const image = new Image();
        image.src = new URL(path.slice(1), new URL('.', location.href)).href;
        await image.decode();
        return image.naturalWidth > 0;
    }))""", photographs)
    assert len(decoded) == 18 and all(decoded)
    page.wait_for_function(
        "document.documentElement.classList.contains('lenis') && "
        "!document.documentElement.classList.contains('lenis-stopped')",
        timeout=45000,
    )
    assert page.locator(".intro__title").is_visible()
    assert page.locator(".intro__entry").count() == 18
    print("PASS: desktop intro, WebGL renderer, contents, and 18 local photographs")

    # Exercise the real trailer button and video controls.
    trailer = page.locator("[data-trailer]")
    trailer.scroll_into_view_if_needed()
    trailer.click()
    page.wait_for_function("document.querySelector('.trailer__film').currentTime > 0")
    page.locator(".trailer__film").click()
    page.wait_for_function("document.querySelector('.trailer__film').paused")
    page.locator(".trailer__film").click()
    page.wait_for_function("!document.querySelector('.trailer__film').paused")
    page.keyboard.press("Escape")
    page.wait_for_function("document.querySelector('.trailer').hidden")
    print("PASS: local trailer playback, pause, resume, and Escape to close")

    # Wheel input must progress through the pinned grid demonstration.
    page.evaluate("window.scrollTo(0, document.querySelector('.story').offsetTop + 100)")
    page.wait_for_timeout(300)
    before = page.evaluate("scrollY")
    page.mouse.wheel(0, 1000)
    page.wait_for_function("before => scrollY > before + 400", arg=before)
    page.wait_for_function("!document.documentElement.classList.contains('lenis-scrolling')")
    assert page.locator(".story__stage").evaluate("e => e.classList.contains('is-held')")
    print("PASS: wheel scrolling advances the pinned grid demonstration")

    page.evaluate("window.scrollTo(0, document.querySelector('.interlude').offsetTop + 1600)")
    page.wait_for_function("document.querySelector('.interlude__stage').classList.contains('is-held')")
    assert page.locator(".interlude__letter").count() > 10
    page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
    page.wait_for_timeout(500)
    assert page.locator(".finale").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    print("PASS: kinetic typography, finale, and no desktop horizontal overflow")

    # Preserve the reference's responsive desktop notice at narrow viewports.
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_function("document.documentElement.classList.contains('is-stub')")
    assert page.locator(".stub__note").is_visible()
    assert "designed for desktop" in page.locator(".stub__note").inner_text()
    assert page.locator(".stub__note a").count() == 2
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.set_viewport_size({"width": 1440, "height": 900})
    page.wait_for_function("!document.documentElement.classList.contains('is-stub')")
    print("PASS: desktop → mobile notice → desktop resizing")
    page.close()

    touch = browser.new_context(viewport={"width": 390, "height": 844},
                                is_mobile=True, has_touch=True)
    mobile = touch.new_page()
    monitor(mobile)
    mobile.goto(url, wait_until="networkidle")
    mobile.wait_for_function("document.documentElement.classList.contains('is-stub')")
    assert mobile.locator(".stub__note").is_visible()
    assert mobile.locator(".stub__word i").count() > 0
    print("PASS: fresh touch-device load and modular wordmark")
    touch.close()
    browser.close()

assert not errors, errors
assert not failed_responses, failed_responses
assert not remote_requests, remote_requests
print("PASS: no browser errors, failed HTTP responses, or external runtime requests")
