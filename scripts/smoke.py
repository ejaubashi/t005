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
    assert page.title() == "SHIFT — Form, Space & Motion"
    assert page.locator(".intro__word").first.text_content() == "SHIFT"
    assert page.locator(".intro__word").nth(1).text_content() == "001"
    assert set(page.locator(".preloader__module").evaluate_all(
        "nodes => nodes.map(node => node.dataset.letter)")) == set("SHIFT")
    assert page.evaluate("document.fonts.check('16px \"Sora\"')")
    assert page.evaluate("document.fonts.check('16px \"Manrope\"')")
    assert page.locator("body").evaluate("node => getComputedStyle(node).fontFamily").split(',')[0].strip(' \"') == 'Manrope'
    assert page.locator(".intro__title").evaluate("node => getComputedStyle(node).fontFamily").startswith('Sora')
    assert page.locator(".intro__series").evaluate("node => getComputedStyle(node).fontFamily").split(',')[0].strip(' \"') == 'Manrope'
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim()") == '#1d4ed8'
    assert page.locator(".intro__entry").count() == 18
    page.locator('.shift-navigation').wait_for(state='visible')
    dark_text = page.evaluate("""() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const failures = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const element = node.parentElement;
            if (!node.textContent.trim() || element.closest('script, style, noscript')) continue;
            const color = getComputedStyle(element).color;
            const channels = color.match(/[\\d.]+/g).slice(0, 3).map(Number);
            if (Math.max(...channels) < 80) failures.push({text: node.textContent.trim(), color});
        }
        return failures;
    }""")
    assert not dark_text, dark_text
    print("PASS: no black or near-black interface text")
    print("PASS: SHIFT name and modular wordmark, local fonts, palette, WebGL, contents, and 18 photographs")
    page.locator('.shift-navigation').wait_for(state='visible')
    page.keyboard.press('k')
    page.locator('.shift-index[open]').wait_for(state='visible')
    page.locator('#shift-search').fill('tension')
    assert page.locator('.shift-chapter-link').count() == 1
    page.locator('#shift-search').fill('no-such-study')
    assert page.locator('.shift-chapter-link').count() == 0
    assert 'No studies found' in page.locator('.shift-result-count').inner_text()
    page.locator('#shift-search').fill('tension')
    page.locator('.shift-chapter-link').click()
    page.wait_for_function("location.hash === '#chapter-07'")
    assert abs(page.locator('#chapter-07').bounding_box()['y'] - 140) < 5
    assert page.locator('#chapter-07').evaluate('e => e === document.activeElement')
    assert page.locator('.shift-progress').evaluate('e => e.value > 0')
    page.keyboard.press('g')
    assert page.locator('.shift-grid-toggle').get_attribute('aria-pressed') == 'true'
    assert page.locator('.shift-grid-overlay').is_visible()
    page.keyboard.press('g')
    assert page.locator('.shift-grid-overlay').is_hidden()
    page.locator('.shift-top').click()
    page.wait_for_function('scrollY === 0')
    page.keyboard.press('k')
    page.locator('#shift-search').fill('composition')
    page.keyboard.press('Escape')
    page.wait_for_function("!document.querySelector('.shift-index').open")
    print('PASS: searchable index, empty search, chapter jump, focus, progress, grid shortcut, and back to top')

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
    trailer.focus()
    page.keyboard.press('Enter')
    page.wait_for_function("!document.querySelector('.trailer').hidden")
    assert page.locator('.shift-video-close').evaluate('e => e === document.activeElement')
    page.locator('.shift-video-close').click()
    page.wait_for_function("document.querySelector('.trailer').hidden")
    assert trailer.evaluate('e => e === document.activeElement')
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

    # Narrow viewports now receive a fully usable gallery instead of a notice.
    page.set_viewport_size({"width": 390, "height": 844})
    page.locator('.gallery-chapters').wait_for(state='visible')
    assert page.locator('.gallery-card').count() == 18
    assert page.locator('.stub').count() == 0
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.screenshot(path='/tmp/shift-upgraded-mobile.png', full_page=False)
    page.set_viewport_size({"width": 1440, "height": 900})
    page.locator('.intro__title').wait_for(state='visible', timeout=45000)
    page.locator('.shift-navigation').wait_for(state='visible', timeout=45000)
    assert page.locator('.intro__title').is_visible()
    print("PASS: desktop → mobile gallery → desktop resizing")
    page.close()

    touch = browser.new_context(viewport={"width": 390, "height": 844},
                                is_mobile=True, has_touch=True)
    mobile = touch.new_page()
    monitor(mobile)
    mobile.goto(url, wait_until="networkidle")
    mobile.locator('.gallery-chapters').wait_for(state='visible')
    assert mobile.locator('.gallery-card').count() == 18
    assert mobile.locator('canvas').count() == 0
    mobile.set_viewport_size({'width': 320, 'height': 720})
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    mobile.set_viewport_size({'width': 390, 'height': 844})
    mobile.locator('.shift-index-toggle').click()
    mobile.locator('#shift-search').fill('homework')
    mobile.locator('.shift-chapter-link').click()
    assert mobile.locator('#chapter-17').evaluate('e => e === document.activeElement')
    mobile.locator('.shift-top').click()
    mobile.locator('.gallery-play').click()
    mobile.wait_for_function("document.querySelector('.shift-player video').currentTime > 0")
    mobile.get_by_role('button', name='Close trailer', exact=True).click()
    mobile.wait_for_function("document.querySelector('.shift-player video').paused")
    assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
    print("PASS: touch gallery, search navigation, local trailer playback, and close")
    touch.close()
    reduced = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    reader = reduced.new_page()
    monitor(reader)
    runtime_requests = []
    reader.on('request', lambda request: runtime_requests.append(request.url) if '/runtime-' in request.url else None)
    reader.goto(url, wait_until='networkidle')
    reader.locator('.gallery-chapters').wait_for(state='visible')
    assert reader.locator('.gallery-card').count() == 18
    assert not runtime_requests
    assert reader.locator('canvas').count() == 0
    print('PASS: reduced-motion edition loads the gallery without the animation runtime')
    reduced.close()
    browser.close()

assert not errors, errors
assert not failed_responses, failed_responses
assert not remote_requests, remote_requests
print("PASS: no browser errors, failed HTTP responses, or external runtime requests")
