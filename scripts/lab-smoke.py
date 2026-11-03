"""Exercise the composition lab, share URLs, and self-contained SVG export."""
import base64
import os
from pathlib import Path
import xml.etree.ElementTree as ET

from playwright.sync_api import sync_playwright

url = os.environ.get('GRIDS_TEST_URL', 'http://127.0.0.1:5173/')
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce', permissions=['clipboard-read', 'clipboard-write'], accept_downloads=True)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url, wait_until='networkidle')
    page.keyboard.press('l')
    page.locator('.shift-lab[open]').wait_for(state='visible')
    tile = page.get_by_role('button', name='Move Portrait', exact=True)
    tile.focus()
    before = tile.bounding_box()
    page.keyboard.press('ArrowRight')
    assert tile.bounding_box()['x'] > before['x']
    rect = tile.bounding_box()
    page.mouse.move(rect['x'] + rect['width'] / 2, rect['y'] + rect['height'] / 2)
    page.mouse.down()
    page.mouse.move(rect['x'] + rect['width'] / 2 + 100, rect['y'] + rect['height'] / 2 + 50, steps=5)
    page.mouse.up()
    assert tile.bounding_box()['x'] != rect['x'] or tile.bounding_box()['y'] != rect['y']
    assert 'placed' in page.locator('.lab-status').inner_text()
    print('PASS: keyboard movement, pointer dragging, and grid snapping')
    page.locator('#lab-columns').focus()
    page.keyboard.press('End')
    assert page.locator('#lab-columns-value').inner_text() == '8'
    assert page.locator('.lab-guides i').count() == 8
    page.locator('#lab-gap').focus()
    page.keyboard.press('Home')
    assert page.locator('#lab-gap-value').inner_text() == '0 px'
    page.get_by_role('button', name='mint accent', exact=True).click()
    assert page.locator('.lab-board').evaluate("e => getComputedStyle(e).backgroundColor") == 'rgb(188, 232, 211)'
    page.locator('#lab-guides').uncheck()
    assert page.locator('.lab-guides').is_hidden()
    print('PASS: live column, spacing, accent, and guide controls')
    positions = page.locator('.lab-tile').evaluate_all('tiles => tiles.map(tile => [tile.style.left, tile.style.top])')
    page.get_by_role('button', name='Copy link', exact=True).click()
    page.wait_for_function("document.querySelector('.lab-status').textContent.includes('Link copied')")
    shared_url = page.evaluate('navigator.clipboard.readText()')
    assert '#lab=' in shared_url
    page.get_by_role('button', name='Close composition lab').click()
    page.goto(shared_url, wait_until='networkidle')
    page.locator('.shift-lab[open]').wait_for(state='visible')
    assert page.locator('#lab-columns-value').inner_text() == '8'
    assert page.locator('#lab-gap-value').inner_text() == '0 px'
    assert page.get_by_role('button', name='mint accent').get_attribute('aria-pressed') == 'true'
    assert page.locator('.lab-guides').is_hidden()
    assert page.locator('.lab-tile').evaluate_all('tiles => tiles.map(tile => [tile.style.left, tile.style.top])') == positions
    print('PASS: shared links restore settings, accent, guides, and tile positions')
    with page.expect_download() as download:
        page.get_by_role('button', name='Export SVG', exact=True).click()
    path = Path('/tmp/shift-composition.svg')
    download.value.save_as(path)
    root = ET.fromstring(path.read_text())
    images = root.findall('.//{http://www.w3.org/2000/svg}image')
    assert len(images) == 3
    assert all(image.attrib['href'].startswith('data:image/') for image in images)
    encoded = base64.b64encode(path.read_bytes()).decode()
    assert page.evaluate("""async source => {
        const image = new Image(); image.src = source; await image.decode();
        return image.naturalWidth === 1200 && image.naturalHeight === 800;
    }""", 'data:image/svg+xml;base64,' + encoded)
    print('PASS: downloaded standalone SVG embeds all images and renders at 1200×800')
    page.get_by_role('button', name='Remix layout', exact=True).click()
    page.get_by_role('button', name='Reset', exact=True).click()
    assert page.locator('#lab-columns-value').inner_text() == '6'
    assert page.locator('#lab-gap-value').inner_text() == '12 px'
    assert page.get_by_role('button', name='coral accent').get_attribute('aria-pressed') == 'true'
    assert page.locator('#lab-guides').is_checked()
    page.screenshot(path='/tmp/shift-lab-desktop.png')
    page.keyboard.press('Escape')
    page.locator('.shift-lab').wait_for(state='hidden')
    page.goto(url + '#lab=invalid', wait_until='networkidle')
    assert not page.locator('.shift-lab').is_visible()
    print('PASS: reset, Escape, and invalid shared-state handling')
    context.close()
    mobile = browser.new_context(viewport={'width': 320, 'height': 800}, is_mobile=True, has_touch=True)
    phone = mobile.new_page()
    phone.on('pageerror', lambda error: errors.append(str(error)))
    phone.goto(url, wait_until='networkidle')
    phone.locator('[data-open-lab]').tap()
    phone.locator('.shift-lab[open]').wait_for(state='visible')
    assert phone.locator('.shift-lab').evaluate('e => e.scrollWidth <= e.clientWidth')
    assert phone.evaluate('document.documentElement.scrollWidth <= innerWidth')
    phone.get_by_role('button', name='lilac accent').tap()
    assert phone.get_by_role('button', name='lilac accent').get_attribute('aria-pressed') == 'true'
    phone.screenshot(path='/tmp/shift-lab-mobile.png')
    phone.get_by_role('button', name='Close composition lab').tap()
    print('PASS: mobile playground entry, controls, and 320px layout')
    mobile.close()
    browser.close()
assert not errors, errors
print('PASS: no browser errors')
