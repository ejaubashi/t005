const palettes = { coral: '#ffb49b', mint: '#bce8d3', lilac: '#d5c9ff' };
const defaults = () => ({ columns: 6, gap: 12, palette: 'coral', guides: true, positions: [[0, .27], [.51, 0], [.65, .58]] });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const encode = state => btoa(JSON.stringify(state)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
function decode(value) {
  try {
    const state = JSON.parse(atob(value.replaceAll('-', '+').replaceAll('_', '/')));
    if (!Number.isInteger(state.columns) || state.columns < 4 || state.columns > 8
      || !Number.isInteger(state.gap) || state.gap < 0 || state.gap > 24
      || !Object.hasOwn(palettes, state.palette) || typeof state.guides !== 'boolean' || state.positions?.length !== 3
      || !state.positions.every(point => Array.isArray(point) && point.length === 2 && point.every(n => Number.isFinite(n) && n >= 0 && n <= 1))) return null;
    return state;
  } catch { return null; }
}

export function mountLab(navigation) {
  let state = defaults();
  let selected = 0;
  let drag = null;
  const media = ['63', '118', '668'].map(id => `${import.meta.env.BASE_URL}pictures/image-${id}.webp`);
  const names = ['Portrait', 'Structure', 'Contrast'];
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'shift-button shift-lab-toggle';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.title = 'Open composition lab (L)';
  trigger.innerHTML = '<span class="lab-spark" aria-hidden="true"></span>Lab';
  navigation.querySelector('.shift-grid-toggle').before(trigger);
  const dialog = document.createElement('dialog');
  dialog.className = 'shift-lab';
  dialog.setAttribute('aria-labelledby', 'lab-title');
  dialog.setAttribute('data-lenis-prevent', '');
  dialog.innerHTML = `<header class="lab-header"><div><p class="lab-eyebrow">SHIFT / EXPERIMENT 001</p><h2 id="lab-title">Make space<br>for play.</h2></div>
    <button class="shift-button lab-close" aria-label="Close composition lab">×</button></header>
    <div class="lab-workspace"><div><div class="lab-board-meta"><span>YOUR COMPOSITION</span><span>LIVE CANVAS / 3:2</span></div>
    <div class="lab-board" role="group" aria-label="Interactive composition canvas"><div class="lab-guides" aria-hidden="true"></div>
      <span class="lab-board-title" aria-hidden="true">MAKE<br>SPACE.</span>
      ${names.map((name, i) => `<button class="lab-tile" data-tile="${i}" aria-label="Move ${name}" aria-describedby="lab-instructions" aria-pressed="${i === 0}"><img src="${media[i]}" alt="" draggable="false" loading="lazy" decoding="async"><span>0${i + 1} / ${name}</span></button>`).join('')}
      <span class="lab-board-signature" aria-hidden="true">SHIFT — FORM / SPACE / MOTION</span>
    </div><p id="lab-instructions" class="lab-instructions">Drag a tile. Or focus one and use the arrow keys. Tiles snap to your grid.</p></div>
    <aside class="lab-settings" aria-label="Composition settings"><p class="lab-eyebrow">YOUR RULES.</p>
      <label for="lab-columns">Columns <output id="lab-columns-value">6</output></label><input id="lab-columns" type="range" min="4" max="8" value="6">
      <label for="lab-gap">Spacing <output id="lab-gap-value">12 px</output></label><input id="lab-gap" type="range" min="0" max="24" value="12">
      <fieldset><legend>Accent</legend><div class="lab-palettes">${Object.entries(palettes).map(([name, color]) => `<button type="button" class="lab-palette" data-palette="${name}" aria-label="${name} accent" aria-pressed="${name === 'coral'}" style="--swatch:${color}">${name}</button>`).join('')}</div></fieldset>
      <label class="lab-guides-label"><input id="lab-guides" type="checkbox" checked> Show grid</label>
      <div class="lab-actions"><button class="shift-button lab-shuffle">Remix layout</button><button class="shift-button lab-reset">Reset</button></div>
      <p class="lab-note">There is no perfect layout.<br>Only a different perspective.</p>
    </aside></div>
    <footer class="lab-footer"><p class="lab-status" role="status" aria-live="polite">Your playground. Your composition.</p><div><button class="shift-button lab-share">Copy link</button><button class="shift-button lab-export">Export SVG</button></div></footer>
    <label class="lab-share-fallback" hidden>Share this link<input type="url" readonly></label>`;
  document.body.append(dialog);
  const board = dialog.querySelector('.lab-board');
  const tiles = [...dialog.querySelectorAll('.lab-tile')];
  const guides = dialog.querySelector('.lab-guides');
  const status = message => { dialog.querySelector('.lab-status').textContent = message; };
  function geometry() {
    const width = board.clientWidth;
    const height = board.clientHeight;
    const padding = Math.min(20, width * .04);
    const gap = Math.min(state.gap, width * .03);
    const cell = (width - padding * 2 - gap * (state.columns - 1)) / state.columns;
    const size = cell * 2 + gap;
    return { width, height, padding, gap, cell, size, step: cell + gap, xRange: Math.max(1, width - padding * 2 - size), yRange: Math.max(1, height - padding * 2 - size) };
  }
  function paint() {
    if (!dialog.open) return;
    const g = geometry();
    board.style.setProperty('--lab-accent', palettes[state.palette]);
    guides.hidden = !state.guides;
    dialog.querySelector('#lab-guides').checked = state.guides;
    guides.style.gridTemplateColumns = `repeat(${state.columns}, minmax(0, 1fr))`;
    guides.style.gap = `${g.gap}px`;
    guides.style.inset = `${g.padding}px`;
    if (guides.children.length !== state.columns) guides.replaceChildren(...Array.from({ length: state.columns }, () => document.createElement('i')));
    tiles.forEach((tile, i) => {
      tile.style.width = `${g.size}px`;
      tile.style.height = `${g.size}px`;
      tile.style.left = `${g.padding + state.positions[i][0] * g.xRange}px`;
      tile.style.top = `${g.padding + state.positions[i][1] * g.yRange}px`;
      tile.setAttribute('aria-pressed', String(i === selected));
    });
    dialog.querySelector('#lab-columns').value = state.columns;
    dialog.querySelector('#lab-gap').value = state.gap;
    dialog.querySelector('#lab-columns-value').value = state.columns;
    dialog.querySelector('#lab-gap-value').value = `${state.gap} px`;
    dialog.querySelectorAll('[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === state.palette)));
  }
  function snap(index) {
    const g = geometry();
    state.positions[index] = state.positions[index].map((value, axis) => {
      const range = axis === 0 ? g.xRange : g.yRange;
      return clamp(Math.round(value * range / g.step) * g.step / range, 0, 1);
    });
    paint();
  }
  function open() {
    if (document.querySelector('dialog[open], .trailer:not([hidden])')) return;
    dialog.showModal();
    paint();
  }
  trigger.addEventListener('click', open);
  document.addEventListener('click', event => { if (event.target instanceof Element && event.target.closest('[data-open-lab]')) open(); });
  dialog.querySelector('.lab-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    drag = null;
    tiles.forEach(tile => tile.classList.remove('is-dragging'));
    if (location.hash.startsWith('#lab=')) history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'l' || event.ctrlKey || event.metaKey || event.altKey
      || (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return;
    if (!document.querySelector('dialog[open]')) { event.preventDefault(); open(); }
  });
  new ResizeObserver(paint).observe(board);
  tiles.forEach((tile, index) => {
    tile.addEventListener('focus', () => { selected = index; paint(); });
    tile.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      selected = index;
      tile.focus();
      tile.setPointerCapture(event.pointerId);
      drag = { index, pointerId: event.pointerId, x: event.clientX, y: event.clientY, position: [...state.positions[index]] };
      tile.classList.add('is-dragging');
      paint();
    });
    tile.addEventListener('pointermove', event => {
      if (!drag || drag.index !== index || drag.pointerId !== event.pointerId) return;
      const g = geometry();
      state.positions[index] = [clamp(drag.position[0] + (event.clientX - drag.x) / g.xRange, 0, 1), clamp(drag.position[1] + (event.clientY - drag.y) / g.yRange, 0, 1)];
      paint();
    });
    const finishDrag = () => {
      if (!drag || drag.index !== index) return;
      drag = null;
      tile.classList.remove('is-dragging');
      snap(index);
      status(`${names[index]} placed on the grid.`);
    };
    tile.addEventListener('pointerup', finishDrag);
    tile.addEventListener('pointercancel', finishDrag);
    tile.addEventListener('keydown', event => {
      const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!directions[event.key]) return;
      event.preventDefault();
      const g = geometry();
      const direction = directions[event.key];
      state.positions[index] = state.positions[index].map((value, axis) => clamp(value + direction[axis] * g.step / (axis === 0 ? g.xRange : g.yRange), 0, 1));
      snap(index);
      status(`${names[index]} moved on the grid.`);
    });
  });
  for (const key of ['columns', 'gap']) dialog.querySelector(`#lab-${key}`).addEventListener('input', event => { state[key] = Number(event.target.value); paint(); });
  dialog.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click', () => { state.palette = button.dataset.palette; paint(); }));
  dialog.querySelector('#lab-guides').addEventListener('change', event => { state.guides = event.target.checked; paint(); });
  dialog.querySelector('.lab-shuffle').addEventListener('click', () => {
    state.positions = state.positions.map(() => [Math.random(), Math.random()]);
    state.positions.forEach((_, i) => snap(i));
    status('A new arrangement. Make it yours.');
  });
  dialog.querySelector('.lab-reset').addEventListener('click', () => {
    state = defaults(); selected = 0;
    guides.hidden = false;
    dialog.querySelector('#lab-guides').checked = true;
    paint(); status('Back to the starting composition.');
  });
  dialog.querySelector('.lab-share').addEventListener('click', async () => {
    const url = new URL(location.href);
    url.hash = `lab=${encode(state)}`;
    try { await navigator.clipboard.writeText(url.href); status('Link copied. Share your composition.'); }
    catch {
      const fallback = dialog.querySelector('.lab-share-fallback');
      fallback.hidden = false;
      fallback.querySelector('input').value = url.href;
      fallback.querySelector('input').select();
      status('Select and copy the link below.');
    }
  });
  dialog.querySelector('.lab-export').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    status('Preparing your composition…');
    try {
      const images = await Promise.all(media.map(async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Image unavailable');
        const blob = await response.blob();
        return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      }));
      const g = geometry();
      const ink = '#1d4ed8';
      const rectangles = tiles.map((tile, index) => {
        const x = g.padding + state.positions[index][0] * g.xRange;
        const y = g.padding + state.positions[index][1] * g.yRange;
        return `<svg x="${x}" y="${y}" width="${g.size}" height="${g.size}" viewBox="0 0 100 100"><image href="${images[index]}" width="100" height="100" preserveAspectRatio="xMidYMid slice"/><rect x="4" y="4" width="76" height="13" rx="2" fill="#e9f4ff"/><text x="7" y="13" font-size="7" fill="${ink}" font-family="sans-serif">0${index + 1} / ${names[index]}</text></svg>`;
      }).join('');
      const lines = guides.hidden ? '' : Array.from({ length: state.columns }, (_, i) => `<rect x="${g.padding + i * g.step}" y="${g.padding}" width="${g.cell}" height="${g.height - g.padding * 2}" fill="none" stroke="${ink}" stroke-opacity=".2"/>`).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 ${g.width} ${g.height}"><rect width="100%" height="100%" fill="${palettes[state.palette]}"/>${lines}<text x="${g.padding}" y="${g.height * .3}" fill="${ink}" font-family="sans-serif" font-size="${g.width * .13}" letter-spacing="-4">MAKE</text><text x="${g.padding}" y="${g.height * .53}" fill="${ink}" font-family="sans-serif" font-size="${g.width * .13}" letter-spacing="-4">SPACE.</text>${rectangles}<text x="${g.padding}" y="${g.height - 8}" fill="${ink}" font-family="sans-serif" font-size="8">SHIFT — FORM / SPACE / MOTION</text></svg>`;
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'shift-composition.svg'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      status('Composition exported. Keep experimenting.');
    } catch { status('Export could not finish. Please try again.'); }
    finally { button.disabled = false; }
  });
  function restoreShared() {
    if (!location.hash.startsWith('#lab=')) return;
    const shared = decode(location.hash.slice(5));
    if (shared) { state = shared; if (!dialog.open) open(); paint(); status('A shared composition. Make your own shift.'); }
  }
  window.addEventListener('hashchange', restoreShared);
  restoreShared();
}
