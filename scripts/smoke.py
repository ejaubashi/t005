"""Verify the SHIFT exhibition, sculpture, study dialogs, film, and mobile layout."""
import os
from playwright.sync_api import sync_playwright

url = os.environ.get('GRIDS_TEST_URL', 'http://127.0.0.1:5173/')
errors, failures = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failures.append([response.status, response.url]) if response.status >= 400 else None)
    assert page.goto(url, wait_until='networkidle').status == 200
    page.wait_for_function("document.querySelector('canvas').dataset.rendered === 'true'")
    assert page.title() == 'SHIFT — A Change in Perspective'
    assert page.get_by_role('heading', level=1).inner_text() == 'SHIFT'
    assert page.locator('.shift-navigation, .shift-lab, .preloader').count() == 0
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.locator('canvas').evaluate('canvas => {const {width, height} = canvas; let pixels; if(canvas.dataset.renderer === "webgl"){const gl=canvas.getContext("webgl");pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);}else pixels=canvas.getContext("2d").getImageData(0,0,width,height).data; let nonempty=0; for(let i=3;i<pixels.length;i+=4) if(pixels[i]>0) nonempty++; return nonempty>width*height*.15;}')
    motion = page.locator('.motion-button')
    motion.click()
    assert motion.get_attribute('aria-pressed') == 'true'
    frozen = page.locator('canvas').evaluate('e => e.toDataURL()')
    page.wait_for_timeout(250)
    assert page.locator('canvas').evaluate('e => e.toDataURL()') == frozen
    motion.click()
    page.wait_for_timeout(350)
    assert page.locator('canvas').evaluate('e => e.toDataURL()') != frozen
    motion.click()
    page.screenshot(path='/tmp/shift-exhibition-desktop.png')
    print('PASS: SHIFT identity, sculpture pixels, pause/resume, and desktop layout')
    page.get_by_role('button', name='Open Between the lines', exact=True).click()
    page.locator('.art-detail[open]').wait_for(state='visible')
    assert page.locator('#detail-title').inner_text() == 'Between the lines'
    page.wait_for_function("document.querySelector('.art-detail img').naturalWidth > 0")
    page.locator('.detail-next').click()
    assert page.locator('#detail-title').inner_text() == 'The shape of quiet'
    page.locator('.detail-next').click()
    assert page.locator('#detail-title').inner_text() == 'Held in the air'
    page.locator('.detail-next').click()
    assert page.locator('#detail-title').inner_text() == 'Between the lines'
    page.keyboard.press('Escape')
    page.wait_for_function("!document.querySelector('.art-detail').open")
    assert page.get_by_role('button', name='Open Between the lines', exact=True).evaluate('e => e === document.activeElement')
    assert not page.locator('html').evaluate("e => e.classList.contains('modal-open')")
    print('PASS: image dialog, three study views, next-study cycling, Escape, and restored focus')
    page.locator('.film-button').click()
    page.wait_for_function("document.querySelector('.art-film video').currentTime > 0")
    page.get_by_role('button', name='Close film', exact=True).click()
    page.wait_for_function("document.querySelector('.art-film video').paused")
    print('PASS: original film playback and pause on close')
    dark = page.evaluate('''() => {
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT), found=[];
      while(walker.nextNode()) {const node=walker.currentNode,el=node.parentElement;
        if(!node.textContent.trim()||el.closest('script,style,noscript'))continue;
        const rgb=getComputedStyle(el).color.match(/[\\d.]+/g).slice(0,3).map(Number);
        if(Math.max(...rgb)<80)found.push(node.textContent.trim());
      } return found;
    }''')
    assert not dark, dark
    print('PASS: no black or near-black interface text')
    page.close()
    for width in [390, 320]:
        phone = browser.new_page(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
        phone.on('pageerror', lambda error: errors.append(str(error)))
        phone.goto(url,wait_until='networkidle')
        phone.wait_for_function("document.querySelector('canvas').dataset.rendered === 'true'")
        assert phone.locator('.motion-button').get_attribute('aria-pressed') == 'true'
        assert phone.locator('.motion-button').get_attribute('aria-label') == 'Resume sculpture motion'
        assert phone.evaluate('document.documentElement.scrollWidth <= innerWidth')
        if width == 390: phone.screenshot(path='/tmp/shift-exhibition-mobile.png')
        phone.get_by_role('button', name='Open Held in the air', exact=True).tap()
        assert phone.locator('.art-detail[open]').is_visible()
        assert phone.locator('.art-detail').evaluate('e => e.scrollWidth <= e.clientWidth')
        phone.get_by_role('button', name='Close study', exact=True).tap()
        assert phone.locator('.art-detail').is_hidden()
        print(f'PASS: {width}px touch layout, reduced motion, and study dialog')
        phone.close()
    browser.close()
assert not errors, errors
assert not failures, failures
print('PASS: no JavaScript errors or failed HTTP requests')
