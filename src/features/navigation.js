import { chapters } from './chapters.js';

export function mountNavigation({ scrollToChapter, targets }) {
  const shell = document.createElement('nav');
  shell.className = 'shift-navigation';
  shell.setAttribute('aria-label', 'Explore SHIFT');
  shell.innerHTML = `<span class="shift-position" aria-hidden="true">00%</span>
    <button class="shift-button shift-index-toggle" aria-haspopup="dialog" title="Open chapter index (K)">Index <kbd>K</kbd></button>
    <button class="shift-button shift-grid-toggle" aria-pressed="false" title="Toggle composition grid (G)">Grid <kbd>G</kbd></button>
    <button class="shift-button shift-top" aria-label="Back to top" title="Back to top">↑</button>`;
  const progress = document.createElement('progress');
  progress.className = 'shift-progress';
  progress.max = 100;
  progress.value = 0;
  progress.setAttribute('aria-label', 'Reading progress');
  const grid = document.createElement('div');
  grid.className = 'shift-grid-overlay';
  grid.hidden = true;
  grid.setAttribute('aria-hidden', 'true');
  const dialog = document.createElement('dialog');
  dialog.className = 'shift-index';
  dialog.setAttribute('aria-labelledby', 'shift-index-title');
  dialog.setAttribute('data-lenis-prevent', '');
  dialog.innerHTML = `<div class="shift-index-heading"><div><p>EXPLORE THE STUDIES</p><h2 id="shift-index-title">Find your perspective.</h2></div>
    <button class="shift-button shift-index-close" aria-label="Close chapter index">×</button></div>
    <label class="shift-search-label" for="shift-search">Search chapters</label>
    <input id="shift-search" type="search" placeholder="Try composition, tension, grids…" autocomplete="off">
    <p class="shift-result-count" role="status"></p><ol class="shift-index-list"></ol>
    <p class="shift-index-help">Jump to any chapter. <kbd>Esc</kbd> to close.</p>`;
  document.body.append(progress, grid, shell, dialog);
  const input = dialog.querySelector('input');
  const list = dialog.querySelector('ol');
  const indexButton = shell.querySelector('.shift-index-toggle');
  const gridButton = shell.querySelector('.shift-grid-toggle');
  let activeIndex = -1;
  const renderResults = () => {
    const query = input.value.trim().toLowerCase();
    const matches = chapters.filter(chapter => `${chapter.title} ${chapter.description}`.toLowerCase().includes(query));
    list.replaceChildren(...matches.map(chapter => {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.chapter = chapter.index;
      button.className = 'shift-chapter-link';
      button.setAttribute('aria-current', String(chapter.index === activeIndex));
      button.innerHTML = `<span class="shift-chapter-number">${chapter.number}</span><span><strong>${chapter.title}</strong><small>${chapter.description}</small></span><span class="shift-chapter-time">${chapter.duration}</span>`;
      button.addEventListener('click', () => {
        dialog.close();
        scrollToChapter(chapter.index);
        history.replaceState(null, '', `#${chapter.id}`);
        updateProgress();
      });
      row.append(button);
      return row;
    }));
    dialog.querySelector('.shift-result-count').textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'study' : 'studies'}` : 'No studies found. Try another word.';
  };
  function openIndex() {
    if (dialog.open || document.querySelector('.trailer:not([hidden]), .shift-player[open]')) return;
    input.value = '';
    renderResults();
    dialog.showModal();
    input.focus();
  }
  function toggleGrid() {
    grid.hidden = !grid.hidden;
    gridButton.setAttribute('aria-pressed', String(!grid.hidden));
  }
  function updateProgress() {
    const range = document.documentElement.scrollHeight - innerHeight;
    const value = range > 0 ? Math.min(100, Math.max(0, Math.round(scrollY / range * 100))) : 0;
    progress.value = value;
    shell.querySelector('.shift-position').textContent = `${String(value).padStart(2, '0')}%`;
    activeIndex = -1;
    targets.forEach((target, index) => { if (target.getBoundingClientRect().top <= 180) activeIndex = index; });
    list.querySelectorAll('[data-chapter]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.chapter) === activeIndex)));
  }
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { updateProgress(); scheduled = false; });
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  indexButton.addEventListener('click', openIndex);
  gridButton.addEventListener('click', toggleGrid);
  shell.querySelector('.shift-top').addEventListener('click', () => {
    scrollToChapter(-1);
    history.replaceState(null, '', location.pathname + location.search);
  });
  dialog.querySelector('.shift-index-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dialog.close();
    }
  });
  input.addEventListener('input', renderResults);
  window.addEventListener('keydown', event => {
    if ((event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) || event.altKey) return;
    if (event.key.toLowerCase() === 'k') { event.preventDefault(); openIndex(); }
    if (event.key.toLowerCase() === 'g' && !event.metaKey && !event.ctrlKey && !dialog.open) { event.preventDefault(); toggleGrid(); }
  });
  const requested = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
  if (requested >= 0) requestAnimationFrame(() => scrollToChapter(requested));
  updateProgress();
}
